import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, List } from "lucide-react"
import type { Tables } from "@/lib/database.types"

interface CalendarPageProps {
  searchParams: Promise<{ month?: string }>
}

function parseMonth(raw: string | undefined) {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number)
    return new Date(y, m - 1, 1)
  }
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams
  const monthStart = parseMonth(params.month)
  const monthEnd = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    1,
  )
  const prev = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1)
  const next = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)

  const supabase = await createClient()
  const { data } = await supabase
    .from("events")
    .select("id, title, event_date, location, current_participants, max_participants")
    .gte("event_date", monthStart.toISOString())
    .lt("event_date", monthEnd.toISOString())
    .order("event_date", { ascending: true })

  type EventRow = Pick<
    Tables<"events">,
    | "id"
    | "title"
    | "event_date"
    | "location"
    | "current_participants"
    | "max_participants"
  >
  const events = (data ?? []) as EventRow[]

  // Group events by day-of-month for the grid cells.
  const byDay = new Map<number, EventRow[]>()
  for (const e of events) {
    const d = new Date(e.event_date).getDate()
    const arr = byDay.get(d) ?? []
    arr.push(e)
    byDay.set(d, arr)
  }

  // Build the 6-row × 7-col grid. Start at the Sunday of the week containing day 1.
  const firstDow = monthStart.getDay()
  const daysInMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  ).getDate()
  const cells: Array<{ day: number | null; events: EventRow[] }> = []
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, events: [] })
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, events: byDay.get(d) ?? [] })
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, events: [] })

  const monthLabel = `${monthStart.getFullYear()}년 ${monthStart.getMonth() + 1}월`

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{monthLabel}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              해당 월의 모임 {events.length}개
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/calendar?month=${monthKey(prev)}`}>
                <ChevronLeft aria-hidden="true" className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/calendar?month=${monthKey(next)}`}>
                <ChevronRight aria-hidden="true" className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/events">
                <List aria-hidden="true" className="w-4 h-4 mr-1" />
                목록
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">월간 일정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                <div
                  key={d}
                  className={
                    i === 0
                      ? "p-2 font-medium text-red-500 text-center"
                      : i === 6
                        ? "p-2 font-medium text-blue-500 text-center"
                        : "p-2 font-medium text-muted-foreground text-center"
                  }
                >
                  {d}
                </div>
              ))}
              {cells.map((cell, idx) => (
                <div
                  key={idx}
                  className={
                    cell.day
                      ? "min-h-[80px] p-1.5 rounded border bg-card"
                      : "min-h-[80px] p-1.5 rounded border bg-muted/30"
                  }
                >
                  {cell.day && (
                    <>
                      <div className="text-[11px] font-medium text-muted-foreground">
                        {cell.day}
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {cell.events.slice(0, 3).map((e) => (
                          <Link
                            key={e.id}
                            href={`/events/${e.id}`}
                            className="block truncate text-[11px] px-1 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            {e.title}
                          </Link>
                        ))}
                        {cell.events.length > 3 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{cell.events.length - 3}
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
