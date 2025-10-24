import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/hobbylink-logo.png"
                alt="HobbyLink"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                홈
              </Link>
              <Link href="/explore" className="text-sm font-medium hover:text-primary transition-colors">
                탐색
              </Link>
              <Link href="/matching" className="text-sm font-medium hover:text-primary transition-colors">
                매칭
              </Link>
              <Link href="/community" className="text-sm font-medium hover:text-primary transition-colors">
                커뮤니티
              </Link>
              <Link href="/profile" className="text-sm font-medium hover:text-primary transition-colors">
                프로필
              </Link>
            </nav>
          </div>
        </div>
      </header>

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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" type="email" value={user.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-name">표시 이름</Label>
                <Input id="display-name" type="text" defaultValue={profile?.display_name || ""} />
              </div>
              <Button>변경사항 저장</Button>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>개인정보 설정</CardTitle>
              <CardDescription>프로필 공개 범위를 설정하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">프로필 공개</div>
                  <div className="text-sm text-muted-foreground">다른 사용자가 내 프로필을 볼 수 있습니다</div>
                </div>
                <Button variant="outline" size="sm">
                  공개
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">매칭 알림</div>
                  <div className="text-sm text-muted-foreground">새로운 매칭 시 알림을 받습니다</div>
                </div>
                <Button variant="outline" size="sm">
                  켜기
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle>보안</CardTitle>
              <CardDescription>비밀번호 및 보안 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">비밀번호 변경</div>
                  <div className="text-sm text-muted-foreground">정기적으로 비밀번호를 변경하세요</div>
                </div>
                <Button variant="outline" size="sm">
                  변경
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">로그아웃</div>
                  <div className="text-sm text-muted-foreground">모든 기기에서 로그아웃합니다</div>
                </div>
                <Button variant="destructive" size="sm">
                  로그아웃
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">위험 구역</CardTitle>
              <CardDescription>계정 삭제 등 되돌릴 수 없는 작업</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">계정 삭제</div>
                  <div className="text-sm text-muted-foreground">모든 데이터가 영구적으로 삭제됩니다</div>
                </div>
                <Button variant="destructive" size="sm">
                  계정 삭제
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
