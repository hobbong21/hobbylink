import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, Users, Heart } from "lucide-react"
import type { Tables } from "@/lib/database.types"

export default async function LeaderboardPage() {
  const supabase = await createClient()

  // 1) Top followed users
  //    We can't easily GROUP BY with an ordered join via supabase-js, so we
  //    fetch the raw follow rows and aggregate in-app. For production-scale
  //    data move this to a SQL view + GIN index.
  const { data: followRows } = await supabase
    .from("follows")
    .select("followed_id")
    .limit(5000)
  const followCount = new Map<string, number>()
  for (const row of followRows ?? []) {
    followCount.set(row.followed_id, (followCount.get(row.followed_id) ?? 0) + 1)
  }
  const topFollowedIds = Array.from(followCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  // 2) Top rated organizers — reuse the `organizer_reputation` view.
  const { data: organizers } = await supabase
    .from("organizer_reputation")
    .select("user_id, review_count, avg_rating, events_organized")
    .not("avg_rating", "is", null)
    .gte("review_count", 1)
    .order("avg_rating", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(10)

  type OrgRow = {
    user_id: string
    review_count: number
    avg_rating: number | null
    events_organized: number
  }
  const topOrganizers = (organizers ?? []) as OrgRow[]

  const allIds = Array.from(
    new Set([...topFollowedIds, ...topOrganizers.map((o) => o.user_id)]),
  )
  const { data: profiles } = allIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, is_suspended")
        .in("id", allIds)
    : { data: [] as Pick<Tables<"profiles">, "id" | "display_name" | "avatar_url" | "is_suspended">[] }

  const profileById = new Map(
    ((profiles ?? []) as Pick<
      Tables<"profiles">,
      "id" | "display_name" | "avatar_url" | "is_suspended"
    >[])
      .filter((p) => !p.is_suspended)
      .map((p) => [p.id, p]),
  )

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">리더보드</h1>
          <p className="text-muted-foreground text-sm mt-1">
            커뮤니티에서 가장 활발한 사용자들을 만나보세요.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart aria-hidden="true" className="w-5 h-5" />
                인기 사용자
              </CardTitle>
              <CardDescription>팔로워가 많은 순서</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {topFollowedIds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  아직 팔로우 활동이 없습니다.
                </p>
              ) : (
                topFollowedIds.map((id, i) => {
                  const p = profileById.get(id)
                  if (!p) return null
                  return (
                    <Link
                      key={id}
                      href={`/profile/${id}`}
                      className="flex items-center gap-3 rounded p-2 hover:bg-muted/40 transition-colors"
                    >
                      <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <Avatar className="w-9 h-9">
                        <AvatarImage
                          src={p.avatar_url ?? "/placeholder-user.jpg"}
                          alt={`${p.display_name}의 프로필 사진`}
                        />
                        <AvatarFallback>{p.display_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {p.display_name}
                        </p>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Users aria-hidden="true" className="w-3 h-3" />
                        {followCount.get(id)}
                      </Badge>
                    </Link>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star aria-hidden="true" className="w-5 h-5" />
                우수 주최자
              </CardTitle>
              <CardDescription>리뷰 평균 별점 기준</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {topOrganizers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  평가된 주최자가 아직 없습니다.
                </p>
              ) : (
                topOrganizers.map((o, i) => {
                  const p = profileById.get(o.user_id)
                  if (!p) return null
                  return (
                    <Link
                      key={o.user_id}
                      href={`/profile/${o.user_id}`}
                      className="flex items-center gap-3 rounded p-2 hover:bg-muted/40 transition-colors"
                    >
                      <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <Avatar className="w-9 h-9">
                        <AvatarImage
                          src={p.avatar_url ?? "/placeholder-user.jpg"}
                          alt={`${p.display_name}의 프로필 사진`}
                        />
                        <AvatarFallback>{p.display_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {p.display_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          모임 {o.events_organized}개 · 후기 {o.review_count}개
                        </p>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Star aria-hidden="true" className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {Number(o.avg_rating).toFixed(1)}
                      </Badge>
                    </Link>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
