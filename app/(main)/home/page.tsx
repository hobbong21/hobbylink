import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { StatTile } from "@/components/ui/stat-tile"
import { WeeklyBest } from "@/components/community/weekly-best"
import { OnboardingProgressCard } from "@/components/onboarding/progress-card"
import { XpProgress } from "@/components/profile/xp-progress"
import {
  Heart,
  MessageCircle,
  Calendar,
  Users,
  Bell,
  Sparkles,
  ArrowRight,
  Mail,
} from "lucide-react"
import type { Tables } from "@/lib/database.types"

/**
 * Logged-in home dashboard.
 *
 * Two-column layout on desktop: left column is time-sensitive content
 * (this week's events, pending invites, fresh matches); right column
 * is longer-lived context (level, onboarding, weekly best).
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
        .select("id, event_id, events:event_id(id, title, event_date)")
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
      supabase
        .from("profiles")
        .select("display_name, xp, level")
        .eq("id", user.id)
        .single(),
    ])

  type EventLite = Pick<
    Tables<"events">,
    "id" | "title" | "event_date" | "location"
  >
  const upcomingRows = ((upcoming.data ?? []) as Array<{
    events: EventLite | null
  }>)
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

  type MatchRow = Pick<
    Tables<"matches">,
    "id" | "matched_user_id" | "updated_at"
  >
  const matchRows = (freshMatches.data ?? []) as MatchRow[]

  const firstName = profile.data?.display_name?.split(" ")[0] ?? "사용자"

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <PageHeader
          eyebrow="내 홈"
          title={`좋은 하루예요, ${firstName}님 👋`}
          description="오늘 챙겨야 할 일들을 한눈에 보여드립니다."
          actions={
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/explore">탐색</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/events/new">
                  모임 열기
                  <ArrowRight className="ml-1 w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
            </>
          }
        />

        {/* Stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            label="읽지 않은 알림"
            value={(unreadNotif.count ?? 0).toLocaleString()}
            icon={<Bell className="w-4 h-4" aria-hidden="true" />}
            href="/notifications"
            tone={unreadNotif.count && unreadNotif.count > 0 ? "primary" : "default"}
          />
          <StatTile
            label="이번 주 모임"
            value={upcomingRows.length.toLocaleString()}
            icon={<Calendar className="w-4 h-4" aria-hidden="true" />}
            href="/my-events"
            footnote="7일 이내 예정"
          />
          <StatTile
            label="최근 매칭"
            value={matchRows.length.toLocaleString()}
            icon={<Heart className="w-4 h-4" aria-hidden="true" />}
            href="/matches"
          />
          <StatTile
            label="받은 초대"
            value={inviteRows.length.toLocaleString()}
            icon={<Mail className="w-4 h-4" aria-hidden="true" />}
            href="/invitations"
            tone={inviteRows.length > 0 ? "warning" : "default"}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/60 bg-muted/40">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar
                      aria-hidden="true"
                      className="w-4 h-4 text-primary"
                    />
                    이번 주 모임
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    7일 이내 예정된 참가 모임
                  </CardDescription>
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link href="/my-events" className="text-xs">
                    모두 보기
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {upcomingRows.length === 0 ? (
                  <div className="py-10 text-center">
                    <Calendar
                      className="w-8 h-8 text-muted-foreground/60 mx-auto mb-3"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-muted-foreground">
                      이번 주 예정된 모임이 없습니다
                    </p>
                    <Button size="sm" className="mt-4" asChild>
                      <Link href="/events">모임 찾아보기</Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {upcomingRows.map((e) => (
                      <li key={e.id}>
                        <Link
                          href={`/events/${e.id}`}
                          className="flex items-center justify-between gap-4 py-3 px-5 hover:bg-muted/40 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {e.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {new Date(e.event_date).toLocaleString("ko-KR", {
                                month: "short",
                                day: "numeric",
                                weekday: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {e.location && ` · ${e.location}`}
                            </p>
                          </div>
                          <ArrowRight
                            className="w-4 h-4 text-muted-foreground flex-shrink-0"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {inviteRows.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users
                      aria-hidden="true"
                      className="w-4 h-4 text-[var(--warning)]"
                    />
                    답변을 기다리는 초대
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {inviteRows.map((i) =>
                    i.events ? (
                      <Link
                        key={i.id}
                        href={`/invitations`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/80 p-3 hover:border-primary/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {i.events.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(i.events.event_date).toLocaleString(
                              "ko-KR",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                        <ArrowRight
                          className="w-4 h-4 text-muted-foreground flex-shrink-0"
                          aria-hidden="true"
                        />
                      </Link>
                    ) : null,
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle
                    aria-hidden="true"
                    className="w-4 h-4 text-primary"
                  />
                  최근 매칭된 사람들
                </CardTitle>
                <CardDescription className="text-xs">
                  대화를 시작해보세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matchRows.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    아직 매칭된 사람이 없습니다.
                    <br />
                    <Link
                      href="/matching"
                      className="text-primary underline underline-offset-4"
                    >
                      매칭 시작하기
                    </Link>
                  </div>
                ) : (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/matches">
                      {matchRows.length}명 보기
                      <ArrowRight className="ml-1 w-4 h-4" aria-hidden="true" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side column */}
          <aside className="space-y-6">
            <Card className="relative overflow-hidden ring-brand border-primary/20">
              <div
                className="absolute inset-0 bg-grid-pattern opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
                aria-hidden="true"
              />
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles
                    aria-hidden="true"
                    className="w-4 h-4 text-primary"
                  />
                  내 레벨
                </CardTitle>
                <CardDescription className="text-xs">
                  업적 포인트가 모이면 레벨이 오릅니다
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <XpProgress xp={profile.data?.xp ?? 0} />
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3"
                >
                  <Link href="/achievements">
                    업적 전체 보기
                    <ArrowRight
                      className="ml-1 w-3.5 h-3.5"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <OnboardingProgressCard />
            <WeeklyBest />
          </aside>
        </div>
      </div>
    </main>
  )
}
