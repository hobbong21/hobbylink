import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FlagRow } from "./flag-row"
import { NewFlagForm } from "./new-flag-form"
import type { Tables } from "@/lib/database.types"

export default async function AdminFlagsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("feature_flags")
    .select("*")
    .order("key", { ascending: true })

  const flags = (data ?? []) as Tables<"feature_flags">[]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">피처 플래그</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          코드는 바뀌지 않고 특정 기능의 노출만 켜고 끌 수 있습니다. rollout_percent로 사용자 비율 지정 가능.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>새 플래그</CardTitle>
          <CardDescription>
            코드 키는 영문 소문자 + 언더스코어만 사용하세요 (예: `premium_badge_v2`).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewFlagForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            등록된 플래그
            <Badge variant="secondary">{flags.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {flags.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              아직 등록된 플래그가 없습니다.
            </p>
          ) : (
            flags.map((f) => <FlagRow key={f.key} flag={f} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}
