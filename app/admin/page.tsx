import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Heart, MessageSquare, Calendar, TrendingUp } from "lucide-react"
import type { Tables } from "@/lib/database.types"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Parallel count + list queries. Auth/admin guard happens in app/admin/layout.tsx.
  const [usersCountRes, hobbiesCountRes, matchesCountRes, postsCountRes, eventsCountRes, messagesCountRes, recentUsersRes, recentPostsRes] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("hobbies").select("*", { count: "exact", head: true }),
      supabase.from("matches").select("*", { count: "exact", head: true }),
      supabase.from("posts").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("messages").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("posts")
        .select("*, profiles(display_name)")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  const usersCount = usersCountRes.count ?? 0
  const hobbiesCount = hobbiesCountRes.count ?? 0
  const matchesCount = matchesCountRes.count ?? 0
  const postsCount = postsCountRes.count ?? 0
  const eventsCount = eventsCountRes.count ?? 0
  const messagesCount = messagesCountRes.count ?? 0

  const recentUsers = (recentUsersRes.data ?? []) as Tables<"profiles">[]
  type RecentPost = Tables<"posts"> & {
    profiles: Pick<Tables<"profiles">, "display_name"> | null
  }
  const recentPosts = (recentPostsRes.data ?? []) as RecentPost[]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <p className="text-muted-foreground mt-2">HobbyLink 플랫폼 통계 및 관리</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="전체 사용자"
          value={usersCount}
          icon={Users}
          hint={
            <>
              <TrendingUp aria-hidden="true" className="w-3 h-3 inline mr-1" />
              지난 주 대비 +12%
            </>
          }
        />
        <StatCard title="등록된 취미" value={hobbiesCount} icon={Heart} hint="다양한 카테고리" />
        <StatCard title="총 매칭" value={matchesCount} icon={Users} hint="성공적인 연결" />
        <StatCard title="게시글" value={postsCount} icon={MessageSquare} hint="커뮤니티 활동" />
        <StatCard title="이벤트" value={eventsCount} icon={Calendar} hint="예정된 모임" />
        <StatCard title="메시지" value={messagesCount} icon={MessageSquare} hint="주고받은 대화" />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>최근 가입 사용자</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {u.display_name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-medium">{u.display_name || "사용자"}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("ko-KR")}
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
            {recentPosts.length > 0 ? (
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <div key={post.id} className="space-y-1">
                    <div className="font-medium">
                      {post.profiles?.display_name || "사용자"}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.content}
                    </p>
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
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string
  value: number
  icon: typeof Users
  hint: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  )
}
