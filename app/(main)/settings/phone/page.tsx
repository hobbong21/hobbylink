import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { PhoneForm } from "./phone-form"
import { UnlinkButton } from "./unlink-button"
import type { Tables } from "@/lib/database.types"

export const dynamic = "force-dynamic"

export default async function PhoneSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_verified_at")
    .eq("id", user.id)
    .maybeSingle<Pick<Tables<"profiles">, "phone_verified_at">>()

  const verified = !!profile?.phone_verified_at
  // `user.phone` is the E.164 string Supabase Auth keeps on auth.users.
  const linkedPhone =
    (user as unknown as { phone?: string | null }).phone ?? null

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings" className="gap-1">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            설정으로 돌아가기
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" aria-hidden="true" />
            전화번호 인증
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            휴대폰 번호를 인증하면 본인 확인 배지를 받고, 일부 신뢰 기반 기능에
            접근할 수 있습니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">SMS 인증</CardTitle>
            <CardDescription>
              인증번호는 한 번 사용 후 만료되며 5분간 유효합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PhoneForm initialPhone={linkedPhone} verified={verified} />
            {verified && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm">
                  <p className="font-medium">인증 완료</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.phone_verified_at &&
                      new Date(profile.phone_verified_at).toLocaleString("ko-KR")}
                  </p>
                </div>
                <UnlinkButton />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">인증이 필요한 이유</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• 본인 확인으로 스팸 계정을 줄입니다</p>
            <p>• 결제/환불 과정에서 추가 인증 단계가 필요할 수 있습니다</p>
            <p>• 모임 주최자에게 &quot;인증됨&quot; 배지가 표시됩니다</p>
            <p className="pt-2 text-xs">
              전화번호는 프로필에 공개되지 않으며 인증 여부만 기록됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
