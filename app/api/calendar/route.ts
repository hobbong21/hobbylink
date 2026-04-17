import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { renderICalendar, type ICalEvent } from "@/lib/ical"

/**
 * Returns the caller's upcoming + recent events as an iCalendar feed.
 * Subscribe in Google Calendar / Apple Calendar via the URL (auth required,
 * so most apps won't be able to subscribe directly without a token — see
 * `?token=` below for a future extension).
 */
export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, message: "로그인이 필요합니다" }, { status: 401 })
  }

  // Fetch events I organize OR I'm actively participating in.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: organized } = await supabase
    .from("events")
    .select("id, title, description, location, event_date, hobby_id")
    .eq("organizer_id", user.id)
    .gte("event_date", since)

  const { data: joinedLinks } = await supabase
    .from("event_participants")
    .select("event_id")
    .eq("user_id", user.id)
    .in("status", ["registered", "attended"])
  const joinedIds = (joinedLinks ?? []).map((r) => r.event_id)

  const { data: joined } =
    joinedIds.length > 0
      ? await supabase
          .from("events")
          .select("id, title, description, location, event_date, hobby_id")
          .in("id", joinedIds)
          .gte("event_date", since)
      : { data: [] as unknown[] }

  type Row = {
    id: string
    title: string
    description: string | null
    location: string | null
    event_date: string
  }
  const byId = new Map<string, Row>()
  for (const row of [...(organized ?? []), ...(joined ?? [])] as Row[]) {
    byId.set(row.id, row)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const events: ICalEvent[] = Array.from(byId.values()).map((row) => ({
    uid: `${row.id}@hobbylink`,
    title: row.title,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    start: new Date(row.event_date),
    durationMinutes: 120,
    url: siteUrl ? `${siteUrl}/events/${row.id}` : undefined,
  }))

  const body = renderICalendar(
    `HobbyLink — 내 모임`,
    events,
  )
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="hobbylink.ics"',
      "Cache-Control": "private, max-age=300",
    },
  })
}
