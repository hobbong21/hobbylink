import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Heart, MessageSquare, Calendar, Activity, Search } from "lucide-react"

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/")
  }

  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
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
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-primary">관리자 모드</span>
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                사이트로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r border-border min-h-[calc(100vh-73px)] p-6">
          <nav className="space-y-2">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Activity className="w-5 h-5" />
              대시보드
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
            >
              <Users className="w-5 h-5" />
              사용자 관리
            </Link>
            <Link
              href="/admin/hobbies"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Heart className="w-5 h-5" />
              취미 관리
            </Link>
            <Link
              href="/admin/posts"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              게시글 관리
            </Link>
            <Link
              href="/admin/events"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Calendar className="w-5 h-5" />
              이벤트 관리
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">사용자 관리</h1>
                <p className="text-muted-foreground mt-2">전체 사용자 목록 및 관리</p>
              </div>
              <Button>새 사용자 추가</Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>전체 사용자 ({users?.length || 0})</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="사용자 검색..." className="pl-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users && users.length > 0 ? (
                    users.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-lg">
                            {u.display_name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {u.display_name || "사용자"}
                              {u.is_admin && <Badge variant="secondary">관리자</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground">{u.location || "위치 미설정"}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              가입일: {new Date(u.created_at).toLocaleDateString("ko-KR")}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            상세보기
                          </Button>
                          <Button variant="outline" size="sm">
                            수정
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">사용자가 없습니다</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
