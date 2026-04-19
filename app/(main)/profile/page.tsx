import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatTile } from "@/components/ui/stat-tile"
import { XpProgress } from "@/components/profile/xp-progress"
import { VerifiedBadge } from "@/components/profile/verified-badge"
import {
  MapPin,
  Calendar,
  Edit,
  Settings,
  Sparkles,
  Heart,
  Users,
  CalendarCheck,
  MessageSquare,
  Plus,
  ArrowRight,
} from "lucide-react"
import type { Tables } from "@/lib/database.types"
import { getMySubscription } from "@/lib/billing/subscription"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) redirect("/login")

  const [
    { data: profile },
    { data: userHobbies },
    matchesCountRes,
    postsCountRes,
    eventsCountRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<Tables<"profiles">>(),
    supabase
      .from("user_hobbies")
      .select("*, hobbies(*)")
      .eq("user_id", user.id),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id),
    supabase
      .from("event_participants")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["registered", "attended"]),
  ])

  type UserHobbyRow = Tables<"user_hobbies"> & {
    hobbies: Tables<"hobbies"> | null
  }
  const hobbies = (userHobbies as UserHobbyRow[] | null) ?? []

  const sub = await getMySubscription()
  const matchesCount = matchesCountRes.count ?? 0
  const postsCount = postsCountRes.count ?? 0
  const eventsCount = eventsCountRes.count ?? 0

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[320px,1fr] gap-6">
          {/* -------------------------------------------------------- *
           * Left column — identity                                    *
           * -------------------------------------------------------- */}
          <aside className="space-y-4">
            <Card className="overflow-hidden border-border/80">
              {/* Cover band */}
              <div className="relative h-24 bg-gradient-to-br from-primary-muted via-muted to-secondary">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-grid-pattern opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
                />
              </div>
              <CardContent className="p-5 -mt-12 relative">
                <Avatar className="w-24 h-24 ring-4 ring-card shadow-sm">
                  <AvatarImage
                    src={profile?.avatar_url ?? "/placeholder-user.jpg"}
                    alt={profile?.display_name ?? "내 프로필"}
                  />
                  <AvatarFallback className="text-2xl bg-primary-muted text-primary">
                    {profile?.display_name?.[0]?.toUpperCase() ||
                      user.email?.[0]?.toUpperCase() ||
                      "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">
                      {profile?.display_name || "사용자"}
                    </h1>
                    {profile?.phone_verified_at && <VerifiedBadge />}
                    {sub.tier === "premium" && (
                      <Badge className="gap-1 bg-gradient-to-r from-[color:var(--warning)] to-[color:var(--chart-5)] text-white border-0">
                        <Sparkles aria-hidden="true" className="w-3 h-3" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  {profile?.bio && (
                    <p className="text-sm leading-relaxed whitespace-pre-line pt-1">
                      {profile.bio}
                    </p>
                  )}
                  <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                    {profile?.location && (
                      <div className="inline-flex items-center gap-1.5">
                        <MapPin aria-hidden="true" className="w-3.5 h-3.5" />
                        {profile.location}
                      </div>
                    )}
                    <div className="inline-flex items-center gap-1.5 ml-3">
                      <Calendar aria-hidden="true" className="w-3.5 h-3.5" />
                      가입일:{" "}
                      {new Date(profile?.created_at || "").toLocaleDateString(
                        "ko-KR",
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <Button size="sm" variant="outline" asChild className="flex-1">
                    <Link href="/settings">
                      <Settings aria-hidden="true" className="w-3.5 h-3.5 mr-1.5" />
                      설정
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="flex-1">
                    <Link href="/profile/edit">
                      <Edit aria-hidden="true" className="w-3.5 h-3.5 mr-1.5" />
                      프로필 수정
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 ring-brand">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm inline-flex items-center gap-2">
                  <Sparkles aria-hidden="true" className="w-4 h-4 text-primary" />
                  내 레벨
                </CardTitle>
              </CardHeader>
              <CardContent>
                <XpProgress xp={profile?.xp ?? 0} />
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="w-full mt-3"
                >
                  <Link href="/achievements">
                    업적 보기
                    <ArrowRight className="ml-1 w-3 h-3" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* -------------------------------------------------------- *
           * Right column — content                                    *
           * -------------------------------------------------------- */}
          <div className="min-w-0 space-y-6">
            {/* Stat row */}
            <div className="grid grid-cols-3 gap-3">
              <StatTile
                label="매칭"
                value={matchesCount}
                icon={<Heart className="w-4 h-4" aria-hidden="true" />}
                href="/matches"
              />
              <StatTile
                label="게시글"
                value={postsCount}
                icon={<MessageSquare className="w-4 h-4" aria-hidden="true" />}
                href="/community"
              />
              <StatTile
                label="참여 모임"
                value={eventsCount}
                icon={<CalendarCheck className="w-4 h-4" aria-hidden="true" />}
                href="/my-events"
              />
            </div>

            {/* Hobbies */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                <div>
                  <CardTitle className="text-base inline-flex items-center gap-2">
                    <Users aria-hidden="true" className="w-4 h-4 text-primary" />
                    내 관심사
                  </CardTitle>
                  <CardDescription className="text-xs">
                    관심사가 비슷한 사람과 더 자주 매칭됩니다
                  </CardDescription>
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link href="/interests">
                    <Plus className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    편집
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {hobbies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {hobbies.map((uh) => (
                      <Badge
                        key={uh.id}
                        variant="secondary"
                        className="px-2.5 py-1 text-xs gap-1.5"
                      >
                        {uh.hobbies?.name ?? "알 수 없음"}
                        {uh.skill_level && (
                          <span className="text-[10px] opacity-70 font-normal">
                            {uh.skill_level === "beginner" && "초급"}
                            {uh.skill_level === "intermediate" && "중급"}
                            {uh.skill_level === "advanced" && "고급"}
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 rounded-lg border border-dashed border-border/80">
                    <Users
                      className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-muted-foreground mb-3">
                      아직 추가된 관심사가 없습니다
                    </p>
                    <Button size="sm" asChild>
                      <Link href="/interests">관심사 추가하기</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">바로가기</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-2">
                {[
                  { href: "/bookmarks", label: "북마크", icon: Heart },
                  { href: "/my-events", label: "내 모임", icon: CalendarCheck },
                  { href: "/messages", label: "메시지", icon: MessageSquare },
                  { href: "/activity", label: "활동 내역", icon: Sparkles },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center justify-between gap-2 rounded-lg border border-border/80 px-3 py-2.5 text-sm hover:border-primary/40 hover:bg-muted/40 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <link.icon
                        className="w-4 h-4 text-primary"
                        aria-hidden="true"
                      />
                      {link.label}
                    </span>
                    <ArrowRight
                      className="w-4 h-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
