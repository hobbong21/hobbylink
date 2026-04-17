import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Users } from "lucide-react"
import type { Tables } from "@/lib/database.types"

export default async function MyEventsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const now = new Date().toISOString()

  // Events I organize
  const { data: organizingData } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_id", user.id)
    .order("event_date", { ascending: false })
    .limit(50)

  // Events I'm participating in (registered/attended), excluding ones I organize.
  const { data: joinedLinks } = await supabase
    .from("event_participants")
    .select("event_id, status")
    .eq("user_id", user.id)
    .in("status", ["registered", "attended"])

  const joinedIds = (joinedLinks ?? [])
    .map((r) => r.event_id)
    .filter((id) => id)

  const { data: joinedData } =
    joinedIds.length > 0
      ? await supabase
          .from("events")
          .select("*")
          .in("id", joinedIds)
          .neq("organizer_id", user.id)
          .order("event_date", { ascending: false })
      : { data: [] as Tables<"events">[] }

  const organizing = (organizingData ?? []) as Tables<"events">[]
  const joined = (joinedData ?? []) as Tables<"events">[]

  const partition = (rows: Tables<"events">[]) => ({
    upcoming: rows.filter((e) => e.event_date >= now),
    past: rows.filter((e) => e.event_date < now),
  })
  const org = partition(organizing)
  const join = partition(joined)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">내 모임</h1>
            <p className="text-muted-foreground text-sm mt-1">
              참가 중이거나 주최한 모임을 관리하세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href="/api/calendar" download>
                캘린더 파일 (.ics)
              </a>
            </Button>
            <Button asChild>
              <Link href="/events/new">
                <Plus aria-hidden="true" className="w-4 h-4 mr-2" />
                모임 만들기
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="joined" className="space-y-4">
          <TabsList>
            <TabsTrigger value="joined">참가 ({joined.length})</TabsTrigger>
            <TabsTrigger value="organizing">주최 ({organizing.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="joined" className="space-y-4">
            <EventBucket
              label="예정된 모임"
              rows={join.upcoming}
              emptyLabel="예정된 참가 모임이 없습니다."
            />
            <EventBucket
              label="지난 모임"
              rows={join.past}
              emptyLabel="지난 참가 이력이 없습니다."
              muted
            />
          </TabsContent>

          <TabsContent value="organizing" className="space-y-4">
            <EventBucket
              label="예정"
              rows={org.upcoming}
              emptyLabel="주최 중인 예정 모임이 없습니다."
            />
            <EventBucket
              label="종료"
              rows={org.past}
              emptyLabel="종료된 주최 모임이 없습니다."
              muted
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function EventBucket({
  label,
  rows,
  emptyLabel,
  muted = false,
}: {
  label: string
  rows: Tables<"events">[]
  emptyLabel: string
  muted?: boolean
}) {
  return (
    <Card className={muted ? "opacity-70" : ""}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          {label}
          <Badge variant="secondary">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyLabel}
          </p>
        ) : (
          rows.map((e) => (
            <Link
              key={e.id}
              href={`/events/${e.id}`}
              className="flex items-center justify-between py-3 gap-3 hover:bg-muted/40 px-2 rounded transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{e.title}</p>
                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar aria-hidden="true" className="w-3 h-3" />
                    {new Date(e.event_date).toLocaleDateString("ko-KR")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users aria-hidden="true" className="w-3 h-3" />
                    {e.current_participants ?? 0}
                    {e.max_participants ? ` / ${e.max_participants}` : ""}
                  </span>
                  {e.location && <span className="truncate">{e.location}</span>}
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
