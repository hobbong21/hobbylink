import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Heart, MessageSquare, Calendar, Flag, Sparkles } from "lucide-react"

/**
 * Admin analytics snapshot — counts + growth vs. the previous 7-day window.
 * No external analytics dependency; everything comes from the DB.
 */
export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [
    users,
    usersThis,
    usersPrev,
    events,
    eventsThis,
    posts,
    postsThis,
    matches,
    openReports,
    premium,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString()),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twoWeeksAgo.toISOString())
      .lt("created_at", weekAgo.toISOString()),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString()),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString()),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted"),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "reviewing"]),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("tier", "premium")
      .eq("status", "active"),
  ])

  const userGrowth = growthPct(usersThis.count ?? 0, usersPrev.count ?? 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">분석</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          현재 시각 기준 주요 지표. 이 페이지는 DB 쿼리로 직접 계산합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Metric
          title="전체 사용자"
          value={users.count ?? 0}
          hint={`지난 7일 +${usersThis.count ?? 0} (${userGrowth})`}
          icon={Users}
        />
        <Metric
          title="예정·종료 이벤트"
          value={events.count ?? 0}
          hint={`지난 7일 +${eventsThis.count ?? 0}`}
          icon={Calendar}
        />
        <Metric
          title="게시글"
          value={posts.count ?? 0}
          hint={`지난 7일 +${postsThis.count ?? 0}`}
          icon={MessageSquare}
        />
        <Metric
          title="상호 매칭 수"
          value={matches.count ?? 0}
          hint="서로 관심 표현"
          icon={Heart}
        />
        <Metric
          title="처리 대기 신고"
          value={openReports.count ?? 0}
          hint="open + reviewing"
          icon={Flag}
        />
        <Metric
          title="프리미엄 구독자"
          value={premium.count ?? 0}
          hint="tier=premium, status=active"
          icon={Sparkles}
        />
      </div>
    </div>
  )
}

function growthPct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "+∞" : "0%"
  const pct = Math.round(((current - previous) / previous) * 100)
  return `${pct >= 0 ? "+" : ""}${pct}%`
}

function Metric({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string
  value: number
  hint: string
  icon: typeof Users
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
          <Icon aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value.toLocaleString()}</div>
        <CardDescription className="mt-1 text-xs">{hint}</CardDescription>
      </CardContent>
    </Card>
  )
}
