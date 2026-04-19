import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface RiskRow {
  user_id: string
  display_name: string | null
  is_suspended: boolean
  reports_7d: number
  reports_30d: number
  blocks_7d: number
  blocks_30d: number
  risk_score: number
}

export default async function AdminRiskPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("risk_signals")
    .select("*")
    .order("risk_score", { ascending: false })
    .limit(100)
  const rows = (data ?? []) as RiskRow[]

  const high = rows.filter((r) => r.risk_score >= 50)
  const medium = rows.filter((r) => r.risk_score >= 20 && r.risk_score < 50)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">위험 사용자</h1>
        <p className="text-muted-foreground text-sm mt-1">
          지난 30일간의 신고·차단 지표로 계산한 위험도 상위 사용자. 조치는
          사용자 관리 페이지에서 수행합니다.
        </p>
      </div>

      <RiskSection
        title="고위험 (risk ≥ 50)"
        description="즉시 확인이 필요한 사용자"
        variant="destructive"
        rows={high}
      />
      <RiskSection
        title="중위험 (20 ≤ risk < 50)"
        description="추이를 관찰해야 하는 사용자"
        variant="secondary"
        rows={medium}
      />
    </div>
  )
}

function RiskSection({
  title,
  description,
  variant,
  rows,
}: {
  title: string
  description: string
  variant: "destructive" | "secondary"
  rows: RiskRow[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant={variant}>{rows.length}</Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            해당하는 사용자가 없습니다.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li
                key={r.user_id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/profile/${r.user_id}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {r.display_name ?? "(이름 없음)"}
                  </Link>
                  {r.is_suspended && (
                    <Badge variant="destructive" className="ml-2 text-[10px]">
                      정지됨
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    신고 7d/30d {r.reports_7d}/{r.reports_30d} · 차단 7d/30d{" "}
                    {r.blocks_7d}/{r.blocks_30d}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={r.risk_score >= 50 ? "destructive" : "secondary"}
                  >
                    risk {r.risk_score}
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/users">조치</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
