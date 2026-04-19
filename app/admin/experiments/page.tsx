import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RateRow {
  flag_key: string
  variant: "on" | "off"
  conversion_kind: string | null
  exposures: number
  converters: number
  conversion_pct: number
}

export default async function AdminExperimentsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("ab_flag_conversion_rates")
    .select("*")
    .order("flag_key", { ascending: true })

  const rows = (data ?? []) as RateRow[]

  // Group by flag_key for readable display.
  const byFlag = new Map<string, RateRow[]>()
  for (const r of rows) {
    const arr = byFlag.get(r.flag_key) ?? []
    arr.push(r)
    byFlag.set(r.flag_key, arr)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">A/B 실험 결과</h1>
        <p className="text-muted-foreground text-sm mt-1">
          각 피처 플래그의 on/off 코호트별 전환율 비교. 전환 이벤트는
          <code className="font-mono text-xs mx-1">logConversion(kind)</code>
          호출 시점에 기록됩니다.
        </p>
      </div>

      {byFlag.size === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            아직 수집된 노출/전환 데이터가 없습니다.
          </CardContent>
        </Card>
      ) : (
        Array.from(byFlag.entries()).map(([flag, entries]) => {
          const conversionKinds = Array.from(
            new Set(entries.map((e) => e.conversion_kind).filter(Boolean) as string[]),
          )
          return (
            <Card key={flag}>
              <CardHeader>
                <CardTitle className="font-mono">{flag}</CardTitle>
                <CardDescription>
                  전환 종류 {conversionKinds.length}개
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b">
                        <th className="py-2 pr-4">전환 종류</th>
                        <th className="py-2 pr-4">코호트</th>
                        <th className="py-2 pr-4 text-right">노출자</th>
                        <th className="py-2 pr-4 text-right">전환자</th>
                        <th className="py-2 text-right">전환율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-mono text-xs">
                            {r.conversion_kind ?? "(미전환)"}
                          </td>
                          <td className="py-2 pr-4">
                            <Badge
                              variant={r.variant === "on" ? "default" : "secondary"}
                            >
                              {r.variant}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4 text-right">{r.exposures}</td>
                          <td className="py-2 pr-4 text-right">{r.converters}</td>
                          <td className="py-2 text-right font-medium">
                            {Number(r.conversion_pct).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
