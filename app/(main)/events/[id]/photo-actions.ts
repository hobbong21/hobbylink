"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const ALLOWED_ORIGIN_HOST = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : null
  } catch {
    return null
  }
})()

export interface PhotoUploadInput {
  eventId: string
  storagePath: string
  url: string
  caption?: string
}

export async function recordEventPhoto(input: PhotoUploadInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  // Defense-in-depth: the URL must point back at our own Supabase host.
  try {
    const u = new URL(input.url)
    if (ALLOWED_ORIGIN_HOST && u.host !== ALLOWED_ORIGIN_HOST) {
      return { ok: false as const, message: "허용되지 않은 이미지 URL입니다" }
    }
  } catch {
    return { ok: false as const, message: "올바른 URL이 아닙니다" }
  }

  const { error } = await supabase.from("event_photos").insert({
    event_id: input.eventId,
    uploader_id: user.id,
    storage_path: input.storagePath,
    url: input.url,
    caption: input.caption?.trim() || null,
  })
  if (error) return { ok: false as const, message: error.message }

  revalidatePath(`/events/${input.eventId}`)
  return { ok: true as const }
}

export async function deleteEventPhoto(photoId: string, storagePath: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  // Delete DB row (RLS enforces uploader_id = auth.uid())
  const { data: row } = await supabase
    .from("event_photos")
    .select("event_id")
    .eq("id", photoId)
    .maybeSingle()

  const { error } = await supabase
    .from("event_photos")
    .delete()
    .eq("id", photoId)
    .eq("uploader_id", user.id)
  if (error) return { ok: false as const, message: error.message }

  // Best-effort storage cleanup. If this fails (e.g. already gone), we move on.
  await supabase.storage.from("event-photos").remove([storagePath])

  if (row?.event_id) revalidatePath(`/events/${row.event_id}`)
  return { ok: true as const }
}
