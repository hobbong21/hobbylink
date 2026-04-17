import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Database, Bell, CreditCard, Mail, MapPin } from "lucide-react"

/**
 * Admin system health page — checks environment wiring and DB latency.
 * Runs 100% server-side so secrets never leak to the client.
 */
export default async function AdminSystemPage() {
  const startedAt = Date.now()
  const supabase = await createClient()
  const { error: dbErr } = await supabase.from("hobbies").select("id").limit(1)
  const dbLatency = Date.now() - startedAt

  const checks = [
    {
      title: "Supabase 연결",
      icon: Database,
      ok: !dbErr,
      detail: dbErr ? dbErr.message : `응답 시간 ${dbLatency}ms`,
    },
    {
      title: "서비스 역할 키",
      icon: Activity,
      ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      detail: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? "설정됨 (계정 삭제 · 매칭 알림에 사용)"
        : "미설정 — 일부 서버 액션이 제한됩니다",
    },
    {
      title: "이메일 (Resend)",
      icon: Mail,
      ok: !!process.env.RESEND_API_KEY,
      detail: process.env.RESEND_API_KEY
        ? "API 키 설정됨"
        : "미설정 — 이메일 발송은 no-op (로그만 기록)",
    },
    {
      title: "Web Push (VAPID)",
      icon: Bell,
      ok: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
      detail:
        process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
          ? "키 쌍 설정됨"
          : "미설정 — 푸시 발송이 비활성",
    },
    {
      title: "결제 (Stripe)",
      icon: CreditCard,
      ok: !!process.env.STRIPE_SECRET_KEY,
      detail: process.env.STRIPE_SECRET_KEY
        ? "라이브 시크릿 설정됨"
        : "미설정 — 프리미엄 체크아웃 비활성",
    },
    {
      title: "Kakao Maps",
      icon: MapPin,
      ok: !!process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY,
      detail: process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY
        ? "App Key 설정됨"
        : "미설정 — LocationPicker가 수동 입력 모드",
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">시스템 상태</h1>
        <p className="text-muted-foreground text-sm mt-1">
          핵심 외부 통합의 환경변수와 Supabase 응답 상태를 점검합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {checks.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.title}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon aria-hidden="true" className="w-4 h-4" />
                    {c.title}
                  </CardTitle>
                  <Badge variant={c.ok ? "default" : "secondary"}>
                    {c.ok ? "정상" : "미설정"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{c.detail}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edge Functions</CardTitle>
          <CardDescription>
            Supabase Edge Function의 상태는 대시보드에서 직접 확인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1">
            <li>
              <code className="font-mono">event-reminders</code> — 24시간 내 모임 알림
            </li>
            <li>
              <code className="font-mono">weekly-digest</code> — 주간 활동 요약 메일
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
