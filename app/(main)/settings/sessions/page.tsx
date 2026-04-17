import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GlobalSignOutButton } from "./global-signout-button"

export default async function SessionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  // Web Push subs serve as a cheap proxy for "active devices" since
  // Supabase doesn't expose the session list via the anon client.
  const { data: pushSubs } = await supabase
    .from("push_subscriptions")
    .select("id, user_agent, created_at, last_seen_at")
    .eq("user_id", user.id)
    .order("last_seen_at", { ascending: false, nullsFirst: false })

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-3xl font-bold">세션 관리</h1>
          <p className="text-muted-foreground text-sm mt-1">
            현재 로그인된 브라우저·기기 목록을 확인하고, 필요 시 모든 기기에서 로그아웃할 수 있습니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>푸시 알림이 설정된 기기</CardTitle>
            <CardDescription>
              세부 세션 내역은 Supabase Auth에서 관리되며, 여기서는 최근에 알림을 활성화한 기기를 표시합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(pushSubs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                기록된 기기가 없습니다.
              </p>
            ) : (
              <ul className="divide-y">
                {(pushSubs ?? []).map((d) => (
                  <li key={d.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        {d.user_agent ?? "알 수 없는 기기"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {d.last_seen_at
                          ? `최근 활동 ${new Date(d.last_seen_at).toLocaleString("ko-KR")}`
                          : `등록 ${new Date(d.created_at).toLocaleDateString("ko-KR")}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">모든 기기에서 로그아웃</CardTitle>
            <CardDescription>
              전체 세션을 종료합니다. 브라우저, 모바일, 푸시 구독이 모두 해제됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GlobalSignOutButton />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
