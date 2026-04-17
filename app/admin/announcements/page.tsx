import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NewAnnouncementForm } from "./new-announcement-form"
import { DeleteAnnouncementButton } from "./delete-announcement-button"
import type { Tables } from "@/lib/database.types"

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  const rows = (data ?? []) as Tables<"announcements">[]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">공지사항 관리</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          전체 사용자에게 표시되는 배너 공지입니다. 시작/종료 시각으로 노출 구간을 제어하세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>새 공지 작성</CardTitle>
          <CardDescription>
            짧고 명확하게. 링크가 있으면 함께 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewAnnouncementForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>공지 목록 ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              아직 작성된 공지가 없습니다.
            </p>
          ) : (
            rows.map((r) => {
              const now = Date.now()
              const start = new Date(r.starts_at).getTime()
              const end = r.ends_at ? new Date(r.ends_at).getTime() : null
              const isLive = start <= now && (end === null || end > now)
              return (
                <div key={r.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{r.title}</p>
                      <Badge variant={isLive ? "default" : "secondary"}>
                        {isLive ? "노출 중" : "미노출"}
                      </Badge>
                      <Badge variant="outline">{r.variant}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {r.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(r.starts_at).toLocaleString("ko-KR")}
                      {r.ends_at &&
                        ` ~ ${new Date(r.ends_at).toLocaleString("ko-KR")}`}
                    </p>
                  </div>
                  <DeleteAnnouncementButton id={r.id} />
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
