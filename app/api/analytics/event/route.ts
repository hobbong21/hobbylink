import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { logger } from "@/lib/observability/logger"
import { createClient } from "@/lib/supabase/server"

/**
 * First-party analytics ingest.
 *
 * Currently logs events via the structured logger (ingestable by Vercel /
 * Datadog / etc). For a warehouse-quality pipeline, swap the body of `POST`
 * for a Supabase insert into an `analytics_events` table, or forward to
 * PostHog / Amplitude / ClickHouse.
 */

const Schema = z.object({
  name: z.string().min(1).max(80),
  props: z.record(z.unknown()).optional(),
  ts: z.number().optional(),
  url: z.string().max(1000).nullable().optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Associate with a user if there's a session; otherwise treat as anon.
  let userId: string | null = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    userId = data.user?.id ?? null
  } catch {
    // anon
  }

  logger.info("analytics.event", {
    event: parsed.data.name,
    user_id: userId,
    props: parsed.data.props ?? {},
    ts: parsed.data.ts,
    url: parsed.data.url ?? undefined,
  })

  return NextResponse.json({ ok: true })
}
