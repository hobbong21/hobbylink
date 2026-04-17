import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { renderICalendar } from "@/lib/ical"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params
  const supabase = await createClient()
  const { data: event } = await supabase
    .from("events")
    .select("id, title, description, location, event_date")
    .eq("id", eventId)
    .maybeSingle()
  if (!event) {
    return NextResponse.json({ ok: false, message: "모임을 찾을 수 없습니다" }, { status: 404 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const body = renderICalendar(event.title, [
    {
      uid: `${event.id}@hobbylink`,
      title: event.title,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      start: new Date(event.event_date),
      durationMinutes: 120,
      url: siteUrl ? `${siteUrl}/events/${event.id}` : undefined,
    },
  ])

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.id}.ics"`,
      "Cache-Control": "public, max-age=600",
    },
  })
}
