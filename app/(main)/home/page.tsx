import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Calendar, Users, Bell } from "lucide-react"
import { WeeklyBest } from "@/components/community/weekly-best"
import { OnboardingProgressCard } from "@/components/onboarding/progress-card"
import type { Tables } from "@/lib/database.types"

/**
 * Logged-in home dashboard. Surfaces the most time-sensitive things:
 *  - unread notifications
 *  - pending event invitations
 *  - upcoming joined events within 7 days
 *  - accepted matches waiting for the first message
 */
export default async function HomeDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [unreadNotif, pendingInvites, upcoming, freshMatches, profile] =
    await Promise.all([
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
      supabase
        .from("event_invitations")
        .select(
          "id, event_id, events:event_id(id, title, event_date)",
        )
        .eq("invitee_id", user.id)
        .eq("status", "pending")
        .limit(5),
      supabase
        .from("event_participants")
        .select("event_id, events:event_id(id, title, event_date, location)")
        .eq("user_id", user.id)
        .in("status", ["registered", "attended"])
        .limit(10),
      supabase
        .from("matches")
        .select("id, matched_user_id, updated_at")
        .eq("status", "accepted")
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    ])

  type EventLite = Pick<Tables<"events">, "id" | "title" | "event_date" | "location">
  const upcomingRows = ((upcoming.data ?? []) as Array<{ events: EventLite | null }>)
    .map((r) => r.events)
    .filter((e): e is EventLite => e !== null)
    .filter((e) => {
      const t = new Date(e.event_date).getTime()
      return t >= now.getTime() && t <= weekFromNow.getTime()
    })
    .sort((a, b) => (a.event_date < b.event_date ? -1 : 1))
    .slice(0, 5)

  type InviteRow = { id: string; event_id: string; events: EventLite | null }
  const inviteRows = (pendingInvites.data ?? []) as InviteRow[]

  type MatchRow = Pick<Tables<"matches">, "id" | "matched_user_id" | "updated_at">
  const matchRows = (freshMatches.data ?? []) as MatchRow[]

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            안녕하세요, {profile.data?.display_name ?? "사용자"}님 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            오늘의 하이라이트를 한눈에 확인하세요.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Bell}
            label="읽지 않은 알림"
            value={unreadNotif.count ?? 0}
            href="/notifications"
          />
          <StatCard
            icon={Calendar}
            label="예정된 모임"
            value={upcomingRows.length}
            href="/my-events"
          />
          <StatCard
            icon={Heart}
            label="최근 매칭"
            value={matchRows.length}
            href="/matches"
          />
          <StatCard
            icon={MessageCircle}
            label="받은 초대"
            value={inviteRows.length}
            href="/invitations"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar aria-hidden="true" className="w-5 h-5" />
                  이번 주 모임
                </CardTitle>
                <CardDescription>7일 이내 예정된 참가 모임</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    이번 주 예정된 모임이 없습니다.
                    <br />
                    <Link href="/events" className="text-primary underline">
                      모임 찾아보기
                    </Link>
                  </p>
                ) : (
                  <ul className="divide-y">
                    {upcomingRows.map((e) => (
                      <li key={e.id} className="py-2">
                        <Link
                          href={`/events/${e.id}`}
                          className="block hover:bg-muted/40 -mx-2 px-2 py-1 rounded"
                        >
                          <p className="font-medium text-sm truncate">{e.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(e.event_date).toLocaleString("ko-KR")}
                            {e.location && ` · ${e.location}`}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {inviteRows.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users aria-hidden="true" className="w-5 h-5" />
                    답변 기다리는 초대
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {inviteRows.map((i) =>
                    i.events ? (
                      <Link
                        key={i.id}
                        href={`/invitations`}
                        className="block border rounded p-2 hover:bg-muted/40"
                      >
                        <p className="text-sm font-medium truncate">
                          {i.events.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(i.events.event_date).toLocaleString("ko-KR")}
                        </p>
                      </Link>
                    ) : null,
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/invitations">모두 보기</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            <WeeklyBest />
          </aside>
        </div>
      </div>
    </main>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Heart
  label: string
  value: number
  href: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border p-3 hover:bg-muted/40 transition-colors"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon aria-hidden="true" className="w-4 h-4" />
        {label}
      </div>
      <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
    </Link>
  )
}
