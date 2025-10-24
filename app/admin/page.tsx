import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Heart, MessageSquare, Calendar, TrendingUp, Activity } from "lucide-react"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/")
  }

  // Fetch statistics
  const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  const { count: hobbiesCount } = await supabase.from("hobbies").select("*", { count: "exact", head: true })

  const { count: matchesCount } = await supabase.from("matches").select("*", { count: "exact", head: true })

  const { count: postsCount } = await supabase.from("posts").select("*", { count: "exact", head: true })

  const { count: eventsCount } = await supabase.from("events").select("*", { count: "exact", head: true })

  const { count: messagesCount } = await supabase.from("messages").select("*", { count: "exact", head: true })

  // Fetch recent users
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch recent posts
  const { data: recentPosts } = await supabase
    .from("posts")
    .select("*, profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(5)

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
        {/* Sidebar */}
        <aside className="w-64 border-r border-border min-h-[calc(100vh-73px)] p-6">
          <nav className="space-y-2">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
            >
              <Activity className="w-5 h-5" />
              대시보드
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
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

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold">관리자 대시보드</h1>
              <p className="text-muted-foreground mt-2">HobbyLink 플랫폼 통계 및 관리</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usersCount || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    지난 주 대비 +12%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">등록된 취미</CardTitle>
                  <Heart className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{hobbiesCount || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">다양한 카테고리</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">총 매칭</CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{matchesCount || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">성공적인 연결</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">게시글</CardTitle>
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{postsCount || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">커뮤니티 활동</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">이벤트</CardTitle>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{eventsCount || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">예정된 모임</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">메시지</CardTitle>
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{messagesCount || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">주고받은 대화</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>최근 가입 사용자</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentUsers && recentUsers.length > 0 ? (
                    <div className="space-y-4">
                      {recentUsers.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                              {user.display_name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="font-medium">{user.display_name || "사용자"}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString("ko-KR")}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">아직 사용자가 없습니다</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>최근 게시글</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentPosts && recentPosts.length > 0 ? (
                    <div className="space-y-4">
                      {recentPosts.map((post: any) => (
                        <div key={post.id} className="space-y-1">
                          <div className="font-medium">{post.profiles?.display_name || "사용자"}</div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                          <div className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString("ko-KR")}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">아직 게시글이 없습니다</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
