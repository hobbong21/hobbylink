import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Tables } from "@/lib/database.types"

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("events")
    .select("*, profiles:organizer_id(display_name)")
    .order("event_date", { ascending: false })
    .limit(50)

  type EventRow = Tables<"events"> & {
    profiles: Pick<Tables<"profiles">, "display_name"> | null
  }
  const events = (data ?? []) as EventRow[]

  const now = Date.now()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">이벤트 관리</h1>
        <p className="text-muted-foreground mt-2">최근 이벤트 {events.length}개</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>이벤트 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {events.map((e) => {
              const eventTime = new Date(e.event_date).getTime()
              const upcoming = eventTime >= now
              return (
                <div key={e.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium flex items-center gap-2">
                      {e.title}
                      <Badge variant={upcoming ? "default" : "secondary"}>
                        {upcoming ? "예정" : "종료"}
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.profiles?.display_name ?? "사용자"} ·{" "}
                      {new Date(e.event_date).toLocaleString("ko-KR")} · 참가자{" "}
                      {e.current_participants ?? 0}
                      {e.max_participants ? ` / ${e.max_participants}` : ""}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
