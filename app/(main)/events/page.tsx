import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, MapPin, Users, Plus, Search, CalendarDays } from "lucide-react"
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">오프라인 모임</h1>
            <p className="text-muted-foreground mt-2">
              지금 열리고 있는 모임을 살펴보고 참여해보세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/events/calendar">
                <CalendarDays aria-hidden="true" className="w-4 h-4 mr-2" />
                캘린더
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/events/nearby">
                <MapPin aria-hidden="true" className="w-4 h-4 mr-2" />
                주변 모임
              </Link>
            </Button>
            {user && (
              <Button asChild>
                <Link href="/events/new">
                  <Plus aria-hidden="true" className="w-4 h-4 mr-2" />
                  모임 만들기
                </Link>
              </Button>
            )}
          </div>
        </div>

        <form className="relative">
          <Search
            aria-hidden="true"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
          />
          <Input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="모임 이름·장소·설명 검색"
            className="pl-12 h-11"
            aria-label="모임 검색"
          />
          {when && <input type="hidden" name="when" value={when} />}
        </form>

        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: "", label: "전체" },
            { key: "today", label: "오늘" },
            { key: "week", label: "이번 주" },
            { key: "month", label: "이번 달" },
          ].map((f) => (
            <Button
              key={f.key || "all"}
              asChild
              size="sm"
              variant={when === f.key ? "default" : "outline"}
            >
              <Link href={buildHref(f.key)}>{f.label}</Link>
            </Button>
          ))}
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground mb-4">
                {q ? `"${q}"에 해당하는 모임이 없습니다.` : "예정된 모임이 없습니다."}
              </p>
              {user && (
                <Button asChild>
                  <Link href="/events/new">첫 모임 만들기</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const date = new Date(event.event_date)
              const isFull =
                event.max_participants !== null &&
                (event.current_participants ?? 0) >= event.max_participants
              return (
                <Card
                  key={event.id}
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  {event.image_url && (
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg line-clamp-1">
                        {event.title}
                      </CardTitle>
                      {event.hobbies?.category && (
                        <Badge variant="secondary" className="flex-shrink-0">
                          {event.hobbies.category}
                        </Badge>
                      )}
                    </div>
                    {event.description && (
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar aria-hidden="true" className="w-4 h-4" />
                        <time dateTime={event.event_date}>
                          {date.toLocaleDateString("ko-KR")}
                        </time>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock aria-hidden="true" className="w-4 h-4" />
                        <span>
                          {date.toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin aria-hidden="true" className="w-4 h-4" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users aria-hidden="true" className="w-4 h-4" />
                        <span>
                          {event.current_participants ?? 0}
                          {event.max_participants
                            ? ` / ${event.max_participants}`
                            : ""}
                          명{isFull && " · 마감"}
                        </span>
                      </div>
                    </div>
                    <Button asChild className="w-full">
                      <Link href={`/events/${event.id}`}>자세히 보기</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
