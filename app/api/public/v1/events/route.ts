import { NextResponse } from "next/server"
import { authenticatePublicRequest } from "@/lib/public-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/public/v1/events
 *
 * Query params:
 *   - limit  (default 20, max 100)
 *   - cursor (ISO timestamp — return events after this event_date)
 *   - tag    (filter by tag name, case-insensitive)
 *
 * Returns upcoming public events. Private/waitlist events are not exposed.
 */
export async function GET(req: Request) {
  const auth = await authenticatePublicRequest(req)
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20))
  const cursor = url.searchParams.get("cursor")
  const tag = url.searchParams.get("tag")?.toLowerCase() ?? null

  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!srv || !dbUrl) {
    return NextResponse.json(
      { error: { code: "server_misconfigured", message: "Server misconfigured" } },
      { status: 500 },
    )
  }

  const { createClient } = await import("@supabase/supabase-js")
  const admin = createClient(dbUrl, srv, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let q = admin
    .from("events")
    .select(
      "id, title, description, event_date, location, max_participants, price_cents, currency",
    )
    .gte("event_date", cursor ?? new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(limit)

  if (tag) {
    const { data: tagRow } = await admin
      .from("tags")
      .select("id")
      .ilike("name", tag)
      .maybeSingle()
    if (!tagRow) return NextResponse.json({ data: [], next_cursor: null })
    const { data: evIds } = await admin
      .from("event_tags")
      .select("event_id")
      .eq("tag_id", tagRow.id)
    const ids = (evIds ?? []).map((r: { event_id: string }) => r.event_id)
    if (ids.length === 0) return NextResponse.json({ data: [], next_cursor: null })
    q = q.in("id", ids)
  }

  const { data, error } = await q
  if (error) {
    return NextResponse.json(
      { error: { code: "query_failed", message: error.message } },
      { status: 500 },
    )
  }

  const rows = (data ?? []) as Array<{
    id: string
    title: string
    description: string | null
    event_date: string
    location: string | null
    max_participants: number | null
    price_cents: number | null
    currency: string | null
  }>

  const next_cursor = rows.length === limit ? rows[rows.length - 1]?.event_date ?? null : null

  return NextResponse.json(
    {
      data: rows,
      next_cursor,
    },
    { headers: { "Cache-Control": "public, s-maxage=60" } },
  )
}
