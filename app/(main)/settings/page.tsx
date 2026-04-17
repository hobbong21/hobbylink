import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SettingsForm } from "./settings-form"
import { DeleteAccountButton } from "./delete-account-button"
import { AvatarUpload } from "./avatar-upload"
import type { Tables } from "@/lib/database.types"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Tables<"profiles">>()

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">설정</h1>
          <p className="text-muted-foreground mt-2">계정 및 개인정보 설정을 관리하세요</p>
        </div>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>계정 정보</CardTitle>
            <CardDescription>기본 계정 정보를 확인하고 수정하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AvatarUpload
              userId={user.id}
              currentAvatarUrl={profile?.avatar_url ?? null}
              displayName={profile?.display_name ?? user.email ?? "사용자"}
            />
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                이메일 변경은{" "}
                <Link
                  href="/settings/email"
                  className="text-primary underline"
                >
                  인증 메일
                </Link>
                을 통해 진행됩니다.
              </p>
            </div>
            <SettingsForm
              initialDisplayName={profile?.display_name ?? ""}
              initialBio={profile?.bio ?? ""}
              initialLocation={profile?.location ?? ""}
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>알림</CardTitle>
            <CardDescription>이메일·인앱 알림 채널 설정</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/settings/notifications">알림 설정 관리</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle>보안</CardTitle>
            <CardDescription>비밀번호 및 세션 관리</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/settings/password">비밀번호 변경</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings/sessions">세션 관리</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Privacy & Safety */}
        <Card>
          <CardHeader>
            <CardTitle>개인정보 및 안전</CardTitle>
            <CardDescription>
              차단 목록 관리 및 개인정보 설정, 데이터 내보내기
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/settings/privacy">프로필 공개 범위</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings/blocks">차단 목록 관리</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/account/export" download>
                내 데이터 내보내기
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">위험 구역</CardTitle>
            <CardDescription>계정 삭제 등 되돌릴 수 없는 작업</CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">계정 삭제</div>
                <div className="text-sm text-muted-foreground">
                  모든 데이터가 영구적으로 삭제됩니다
                </div>
              </div>
              <DeleteAccountButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
