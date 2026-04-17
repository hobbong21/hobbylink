import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyLink } from "./copy-link"
import type { Tables } from "@/lib/database.types"

export default async function InvitePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const [{ data: profile }, { data: referrals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single<Pick<Tables<"profiles">, "referral_code">>(),
    supabase
      .from("referrals")
      .select("referred_user_id, created_at, profiles:referred_user_id(display_name)")
      .eq("referrer_user_id", user.id)
      .order("created_at", { ascending: false }),
  ])

  type ReferralRow = {
    referred_user_id: string
    created_at: string
    profiles: Pick<Tables<"profiles">, "display_name"> | null
  }
  const rows = (referrals ?? []) as ReferralRow[]

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const link = profile?.referral_code
    ? `${baseUrl}/signup?ref=${profile.referral_code}`
    : ""

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">친구 초대</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            내 추천 링크로 가입한 친구는 아래 목록에 기록됩니다. 가입이 완료되면 업적 포인트를 지급받을 수 있어요.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>내 추천 코드</CardTitle>
            <CardDescription>
              링크를 복사해 친구에게 보내세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted rounded px-3 py-2 text-sm font-mono break-all">
                {link || "링크 생성 중..."}
              </code>
              {link && <CopyLink text={link} />}
            </div>
            {profile?.referral_code && (
              <p className="text-xs text-muted-foreground">
                코드:{" "}
                <span className="font-mono">{profile.referral_code}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>내가 초대한 사람 ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                아직 초대한 친구가 없습니다.
              </p>
            ) : (
              <ul className="divide-y">
                {rows.map((r) => (
                  <li
                    key={r.referred_user_id}
                    className="py-2 flex items-center justify-between"
                  >
                    <span className="text-sm">
                      {r.profiles?.display_name ?? "사용자"}
                    </span>
                    <time
                      dateTime={r.created_at}
                      className="text-xs text-muted-foreground"
                    >
                      {new Date(r.created_at).toLocaleDateString("ko-KR")}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
