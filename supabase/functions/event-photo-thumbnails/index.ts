// deno-lint-ignore-file no-explicit-any
/**
 * Supabase Edge Function: event-photo-thumbnails
 *
 * Batches through `event_photos` rows with thumb_status = 'pending',
 * downloads the original from the `event-photos` bucket, resizes it to a
 * reasonable gallery preview size, and uploads the result to the
 * `event-photo-thumbnails` bucket. Updates the row with thumb_path/thumb_url
 * on success, or thumb_status = 'failed' + thumb_error on error.
 *
 * Invocation:
 *   - POST: standard run, processes up to BATCH_SIZE rows
 *   - GET ?photo_id=<uuid>: re-process a single row (admin recovery)
 *
 * Deploy:
 *   supabase functions deploy event-photo-thumbnails
 *
 * Schedule (pg_cron, every 2 minutes):
 *   select cron.schedule('event-photo-thumbnails', '*\/2 * * * *',
 *     $$select net.http_post(
 *       url:= 'https://<project>.functions.supabase.co/event-photo-thumbnails',
 *       headers:= jsonb_build_object('Authorization', 'Bearer ' || <service_role>)
 *     )$$);
 *
 * Required env (set via `supabase secrets set`):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Notes:
 *   - Uses `imagescript`, a pure-JS image library that works in Deno without
 *     native binaries. Supports JPEG/PNG input and WEBP-like output via
 *     re-encoding to JPEG (imagescript 1.x doesn't output WebP directly, so
 *     we output JPEG to keep the function dependency-free).
 *   - Max dimension 600px, quality 80 — roughly 1/10 the bytes of a 4000px
 *     iPhone photo.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { decode, Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const ORIGINALS_BUCKET = "event-photos"
const THUMBS_BUCKET = "event-photo-thumbnails"
const MAX_DIM = 600
const JPEG_QUALITY = 80
const BATCH_SIZE = 20

interface PhotoRow {
  id: string
  storage_path: string
  thumb_status: string
}

async function processRow(
  supabase: ReturnType<typeof createClient>,
  row: PhotoRow,
): Promise<{ ok: true; thumb_path: string; thumb_url: string } | { ok: false; message: string }> {
  // Download original
  const { data: blob, error: dlErr } = await supabase.storage
    .from(ORIGINALS_BUCKET)
    .download(row.storage_path)
  if (dlErr || !blob) {
    return { ok: false, message: dlErr?.message ?? "다운로드 실패" }
  }

  // Decode + resize
  const buf = new Uint8Array(await blob.arrayBuffer())
  let img
  try {
    img = await decode(buf)
  } catch (e: any) {
    return { ok: false, message: `디코딩 실패: ${e?.message ?? e}` }
  }
  if (!(img instanceof Image)) {
    // imagescript may return a GIF for animated frames; we don't support those.
    return { ok: false, message: "지원하지 않는 이미지 형식" }
  }

  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height))
  if (scale < 1) {
    img.resize(Math.round(img.width * scale), Math.round(img.height * scale))
  }

  const outBuf = await img.encodeJPEG(JPEG_QUALITY)

  // Upload — rewrite extension to .jpg regardless of source extension.
  const parts = row.storage_path.split(".")
  const baseNoExt = parts.length > 1 ? parts.slice(0, -1).join(".") : row.storage_path
  const thumbPath = `${baseNoExt}.jpg`

  const { error: upErr } = await supabase.storage
    .from(THUMBS_BUCKET)
    .upload(thumbPath, outBuf, {
      contentType: "image/jpeg",
      cacheControl: "604800", // 7 days
      upsert: true,
    })
  if (upErr) return { ok: false, message: `업로드 실패: ${upErr.message}` }

  const { data } = supabase.storage.from(THUMBS_BUCKET).getPublicUrl(thumbPath)
  return { ok: true, thumb_path: thumbPath, thumb_url: data.publicUrl }
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
  if (!token || token !== SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const url = new URL(req.url)
  const singleId = url.searchParams.get("photo_id")

  // Fetch rows to process.
  let rows: PhotoRow[] = []
  if (singleId) {
    const { data, error } = await supabase
      .from("event_photos")
      .select("id, storage_path, thumb_status")
      .eq("id", singleId)
      .maybeSingle()
    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })
    }
    if (data) rows = [data as PhotoRow]
  } else {
    const { data, error } = await supabase
      .from("event_photos")
      .select("id, storage_path, thumb_status")
      .eq("thumb_status", "pending")
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE)
    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })
    }
    rows = (data ?? []) as PhotoRow[]
  }

  let processed = 0
  let failed = 0
  for (const row of rows) {
    const result = await processRow(supabase, row)
    if (result.ok) {
      await supabase
        .from("event_photos")
        .update({
          thumb_path: result.thumb_path,
          thumb_url: result.thumb_url,
          thumb_status: "done",
          thumb_error: null,
        })
        .eq("id", row.id)
      processed++
    } else {
      await supabase
        .from("event_photos")
        .update({
          thumb_status: "failed",
          thumb_error: result.message.slice(0, 500),
        })
        .eq("id", row.id)
      failed++
      console.error(`[thumbnails] ${row.id}: ${result.message}`)
    }
  }

  return new Response(
    JSON.stringify({ ok: true, candidates: rows.length, processed, failed }),
    { headers: { "Content-Type": "application/json" } },
  )
})
