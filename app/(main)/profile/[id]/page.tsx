import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Calendar, MessageCircle, Star } from "lucide-react"
import { presenceLabel } from "@/lib/presence"
import { ReportDialog } from "@/components/moderation/report-dialog"
import { BlockButton } from "@/components/moderation/block-button"
import { FollowButton } from "@/components/follow/follow-button"
import { LevelBadge } from "@/components/profile/level-badge"
import { VerifiedBadge } from "@/components/profile/verified-badge"
import type { Tables } from "@/lib/database.types"

interface ProfileDetailProps {
  params: Promise<{ id: string }>
}

export default async function ProfileDetailPage({ params }: ProfileDetailProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect /profile/<own-id> to /profile so the self view uses the edit-aware page.
  if (user?.id === id) redirect("/profile")

  // Enforce bidirectional block: if either blocked the other, pretend the profile doesn't exist.
  if (user) {
    const [myBlock, theirBlock] = await Promise.all([
      supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", id)
        .maybeSingle(),
      supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_id", id)
        .eq("blocked_id", user.id)
        .maybeSingle(),
    ])
    if (myBlock.data || theirBlock.data) notFound()
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle<Tables<"profiles">>()

  if (!profile || profile.is_suspended) notFound()

  const { data: userHobbies } = await supabase
    .from("user_hobbies")
    .select("id, skill_level, hobbies(name)")
    .eq("user_id", id)

  type HobbyRow = Pick<Tables<"user_hobbies">, "id" | "skill_level"> & {
    hobbies: Pick<Tables<"hobbies">, "name"> | null
  }
  const hobbies = (userHobbies ?? []) as HobbyRow[]

  // Do we have an accepted mutual match? Gate the "message" button.
  let canMessage = false
  let isFollowing = false
  if (user) {
    const [{ data: mutual }, { data: follow }] = await Promise.all([
      supabase
        .from("matches")
        .select("id")
        .eq("status", "accepted")
        .or(
          `and(user_id.eq.${user.id},matched_user_id.eq.${id}),and(user_id.eq.${id},matched_user_id.eq.${user.id})`,
        )
        .maybeSingle(),
      supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("followed_id", id)
        .maybeSingle(),
    ])
    canMessage = !!mutual
    isFollowing = !!follow
  }

  // Follow counts + organizer reputation
  const [followersRes, followingRes, repRes] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("followed_id", id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", id),
    supabase.rpc("get_organizer_reputation", { p_user_id: id }),
  ])
  const followersCount = followersRes.count ?? 0
  const followingCount = followingRes.count ?? 0
  type RepRow = {
    review_count: number
    avg_rating: number | null
    events_organized: number
  }
  const rep = ((repRes.data as RepRow[] | null) ?? [])[0]

  // Recent achievements (latest 5)
  const { data: achievementRows } = await supabase
    .from("user_achievements")
    .select("code, earned_at, achievements(label, icon)")
    .eq("user_id", id)
    .order("earned_at", { ascending: false })
    .limit(5)
  type AchRow = {
    code: string
    earned_at: string
    achievements: { label: string; icon: string | null } | null
  }
  const achievements = (achievementRows ?? []) as AchRow[]

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar className="w-28 h-28 flex-shrink-0">
                <AvatarImage
                  src={profile.avatar_url ?? "/placeholder-user.jpg"}
                  alt={`${profile.display_name}의 프로필 사진`}
                />
                <AvatarFallback className="text-3xl">
                  {profile.display_name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3 min-w-0">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2 flex-wrap">
                    {profile.display_name}
                    {profile.phone_verified_at && <VerifiedBadge />}
                    {profile.level > 1 && <LevelBadge level={profile.level} />}
                    {(() => {
                      const p = presenceLabel(profile.last_active_at)
                      return (
                        <span
                          className={
                            p.isOnline
                              ? "inline-flex items-center gap-1 text-xs font-normal text-green-700 dark:text-green-400"
                              : "inline-flex items-center gap-1 text-xs font-normal text-muted-foreground"
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={
                              p.isOnline
                                ? "w-2 h-2 rounded-full bg-green-500"
                                : "w-2 h-2 rounded-full bg-muted-foreground/40"
                            }
                          />
                          {p.label}
                        </span>
                      )
                    })()}
                  </h1>
                  {profile.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin aria-hidden="true" className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar aria-hidden="true" className="w-3 h-3" />
                    가입일:{" "}
                    {new Date(profile.created_at).toLocaleDateString("ko-KR")}
                  </div>
                </div>
                {profile.bio && (
                  <p className="text-muted-foreground whitespace-pre-line">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  <span>
                    <strong>{followersCount}</strong>
                    <span className="text-muted-foreground ml-1">팔로워</span>
                  </span>
                  <span>
                    <strong>{followingCount}</strong>
                    <span className="text-muted-foreground ml-1">팔로잉</span>
                  </span>
                  {rep && rep.events_organized > 0 && (
                    <>
                      <span>
                        <strong>{rep.events_organized}</strong>
                        <span className="text-muted-foreground ml-1">주최 모임</span>
                      </span>
                      {rep.avg_rating !== null && rep.review_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Star
                            aria-hidden="true"
                            className="w-3 h-3 fill-yellow-400 text-yellow-400"
                          />
                          <strong>{Number(rep.avg_rating).toFixed(1)}</strong>
                          <span className="text-muted-foreground text-xs">
                            ({rep.review_count}개 후기)
                          </span>
                        </span>
                      )}
                    </>
                  )}
                </div>

                {user && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <FollowButton targetId={id} initialFollowing={isFollowing} />
                    {canMessage ? (
                      <Button asChild size="sm">
                        <Link href={`/messages/${id}`}>
                          <MessageCircle
                            aria-hidden="true"
                            className="w-4 h-4 mr-2"
                          />
                          메시지 보내기
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        title="매칭된 사용자에게만 메시지를 보낼 수 있습니다"
                      >
                        <MessageCircle
                          aria-hidden="true"
                          className="w-4 h-4 mr-2"
                        />
                        매칭 후 대화 가능
                      </Button>
                    )}
                    <ReportDialog targetType="profile" targetId={id} />
                    <BlockButton targetId={id} targetName={profile.display_name} />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>최근 업적</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {achievements.map((a) => (
                <Badge key={a.code} variant="secondary" className="gap-1">
                  🏆 {a.achievements?.label ?? a.code}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>관심사</CardTitle>
          </CardHeader>
          <CardContent>
            {hobbies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {hobbies.map((h) => (
                  <Badge key={h.id} variant="secondary" className="px-3 py-1">
                    {h.hobbies?.name ?? "알 수 없음"}
                    {h.skill_level && (
                      <span className="ml-2 text-xs opacity-70">
                        {h.skill_level === "beginner" && "초급"}
                        {h.skill_level === "intermediate" && "중급"}
                        {h.skill_level === "advanced" && "고급"}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                이 사용자는 아직 관심사를 추가하지 않았습니다.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
