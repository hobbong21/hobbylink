import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, MapPin, Users, Plus, Search, CalendarDays } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import type { Tables } from "@/lib/database.types"

interface EventsPageProps {
  searchParams: Promise<{ q?: string; when?: "today" | "week" | "month" }>
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { q = "", when = "" } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const now = new Date()
  let upperBound: Date | null = null
  if (when === "today") {
    upperBound = new Date(now)
    upperBound.setHours(23, 59, 59, 999)
  } else if (when === "week") {
    upperBound = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  } else if (when === "month") {
    upperBound = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  }

  let query = supabase
    .from("events")
    .select("*, hobbies(name, category)")
    .gte("event_date", now.toISOString())
  if (upperBound) query = query.lte("event_date", upperBound.toISOString())
  if (q) {
    const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`
    query = query.or(
      `title.ilike.${like},description.ilike.${like},location.ilike.${like}`,
    )
  }
  const { data } = await query.order("event_date", { ascending: true }).limit(50)

  type EventRow = Tables<"events"> & {
    hobbies: Pick<Tables<"hobbies">, "name" | "category"> | null
  }
  const events = (data ?? []) as EventRow[]

  const buildHref = (w: string) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (w) params.set("when", w)
    const qs = params.toString()
    return `/events${qs ? `?${qs}` : ""}`
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          eyebrow="모임"
          title="오프라인 모임"
          description="지금 열리고 있는 모임을 살펴보고 참여해보세요."
          icon={<Calendar aria-hidden="true" className="w-5 h-5" />}
          actions={
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/events/calendar">
                  <CalendarDays aria-hidden="true" className="w-4 h-4 mr-1.5" />
                  캘린더
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/events/nearby">
                  <MapPin aria-hidden="true" className="w-4 h-4 mr-1.5" />
                  주변 모임
                </Link>
              </Button>
              {user && (
                <Button asChild size="sm">
                  <Link href="/events/new">
                    <Plus aria-hidden="true" className="w-4 h-4 mr-1.5" />
                    모임 만들기
                  </Link>
                </Button>
              )}
            </>
          }
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <form className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <Input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="모임 이름·장소·설명 검색"
              className="pl-10 h-10"
              aria-label="모임 검색"
            />
            {when && <input type="hidden" name="when" value={when} />}
          </form>
          <div className="flex gap-1 p-1 rounded-lg bg-muted overflow-x-auto">
            {[
              { key: "", label: "전체" },
              { key: "today", label: "오늘" },
              { key: "week", label: "이번 주" },
              { key: "month", label: "이번 달" },
            ].map((f) => (
              <Link
                key={f.key || "all"}
                href={buildHref(f.key)}
                className={
                  when === f.key
                    ? "px-3 py-1.5 rounded-md bg-background text-foreground shadow-sm text-sm font-medium whitespace-nowrap"
                    : "px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground text-sm whitespace-nowrap"
                }
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <Calendar
              className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground mb-4">
              {q
                ? `"${q}"에 해당하는 모임이 없습니다.`
                : "예정된 모임이 없습니다."}
            </p>
            {user && (
              <Button asChild>
                <Link href="/events/new">첫 모임 만들기</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {events.map((event) => {
              const date = new Date(event.event_date)
              const isFull =
                event.max_participants !== null &&
                (event.current_participants ?? 0) >= event.max_participants
              const isToday = date.toDateString() === new Date().toDateString()
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group rounded-xl border border-border/80 bg-card overflow-hidden hover:border-primary/40 hover:shadow-[0_1px_0_0_var(--border),0_18px_36px_-24px_color-mix(in_oklch,var(--primary)_40%,transparent)] transition-all"
                >
                  {event.image_url ? (
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {isToday && (
                          <Badge className="bg-primary text-primary-foreground">
                            오늘
                          </Badge>
                        )}
                        {isFull && (
                          <Badge variant="destructive">마감</Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-primary-muted to-muted flex items-center justify-center">
                      <Calendar
                        className="w-8 h-8 text-primary/40"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      {event.hobbies?.category && (
                        <Badge
                          variant="secondary"
                          className="flex-shrink-0 text-[11px]"
                        >
                          {event.hobbies.category}
                        </Badge>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                    <div className="pt-2 border-t border-border/60 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar
                          aria-hidden="true"
                          className="w-3.5 h-3.5 flex-shrink-0"
                        />
                        <time dateTime={event.event_date}>
                          {date.toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            weekday: "short",
                          })}
                        </time>
                        <span className="text-muted-foreground/60">·</span>
                        <Clock
                          aria-hidden="true"
                          className="w-3.5 h-3.5 flex-shrink-0"
                        />
                        <span>
                          {date.toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin
                            aria-hidden="true"
                            className="w-3.5 h-3.5 flex-shrink-0"
                          />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Users
                          aria-hidden="true"
                          className="w-3.5 h-3.5 flex-shrink-0"
                        />
                        <span className="tabular-nums">
                          {event.current_participants ?? 0}
                          {event.max_participants
                            ? ` / ${event.max_participants}`
                            : ""}
                          명
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
