import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ResolveReportActions } from "./resolve-report-actions"
import type { Tables } from "@/lib/database.types"

export default async function AdminReportsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("reports")
    .select("*, reporter:reporter_id(display_name)")
    .in("status", ["open", "reviewing"])
    .order("created_at", { ascending: false })

  type ReportRow = Tables<"reports"> & {
    reporter: Pick<Tables<"profiles">, "display_name"> | null
  }
  const reports = (data ?? []) as ReportRow[]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">신고 관리</h1>
        <p className="text-muted-foreground mt-2">
          처리되지 않은 신고 {reports.length}건
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            처리할 신고가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">
                      {r.target_type} 신고
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      신고자: {r.reporter?.display_name ?? "알 수 없음"} ·{" "}
                      {new Date(r.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <Badge variant={r.status === "open" ? "destructive" : "secondary"}>
                    {r.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">대상 ID</p>
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {r.target_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">신고 사유</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {r.reason}
                  </p>
                </div>
                <ResolveReportActions reportId={r.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
