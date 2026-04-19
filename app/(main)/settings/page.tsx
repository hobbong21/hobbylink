import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import {
  User,
  Bell,
  Shield,
  Eye,
  Code2,
  AlertTriangle,
  Settings as SettingsIcon,
} from "lucide-react"
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

  const SECTIONS = [
    { id: "account", label: "계정 정보", icon: User },
    { id: "notifications", label: "알림", icon: Bell },
    { id: "security", label: "보안", icon: Shield },
    { id: "developer", label: "개발자", icon: Code2 },
    { id: "privacy", label: "개인정보", icon: Eye },
    { id: "danger", label: "위험 구역", icon: AlertTriangle },
  ]

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          eyebrow="설정"
          title="계정 및 개인정보"
          description="계정 정보, 알림, 보안 옵션 등 모든 설정을 한곳에서 관리하세요."
          icon={<SettingsIcon className="w-5 h-5" aria-hidden="true" />}
        />

        <div className="grid lg:grid-cols-[220px,1fr] gap-6">
          {/* Sticky nav */}
          <aside className="hidden lg:block">
            <nav className="sticky top-20 space-y-0.5 pr-2">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <s.icon className="w-4 h-4" aria-hidden="true" />
                  {s.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Sections */}
          <div className="space-y-6 min-w-0">
            {/* Account Settings */}
            <Card id="account" className="scroll-mt-20">
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
        <Card id="notifications" className="scroll-mt-20">
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
        <Card id="security" className="scroll-mt-20">
          <CardHeader>
            <CardTitle>보안</CardTitle>
            <CardDescription>비밀번호, 세션, 전화번호 인증</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/settings/password">비밀번호 변경</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings/sessions">세션 관리</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings/phone">
                전화번호 인증
                {profile?.phone_verified_at ? " ✓" : ""}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Developer */}
        <Card id="developer" className="scroll-mt-20">
          <CardHeader>
            <CardTitle>개발자</CardTitle>
            <CardDescription>공개 API 키 발급 및 문서</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/settings/api-keys">API 키</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/docs/api">API 문서</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Privacy & Safety */}
        <Card id="privacy" className="scroll-mt-20">
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
        <Card
          id="danger"
          className="scroll-mt-20 border-destructive/40 bg-[color-mix(in_oklch,var(--destructive)_4%,var(--background))]"
        >
          <CardHeader>
            <CardTitle className="text-destructive inline-flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              위험 구역
            </CardTitle>
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
        </div>
      </div>
    </main>
  )
}
