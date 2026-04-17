import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Heart,
  Calendar,
  Star,
  Trophy,
  UserPlus,
} from "lucide-react"
import type { Tables } from "@/lib/database.types"

/**
 * Unified "what have I done" timeline for the current user. Pulls the last N
 * rows from several tables and merges them by timestamp. Not indexed heavily;
 * for very active users we'd switch to a dedicated `activity_log` table.
 */
export default async function ActivityPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const uid = user.id

  const [
    posts,
    comments,
    reviews,
    events,
    joined,
    matches,
    follows,
    achievements,
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("id, content, created_at")
      .eq("author_id", uid)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("comments")
      .select("id, content, post_id, created_at")
      .eq("author_id", uid)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("event_reviews")
      .select("id, event_id, rating, created_at")
      .eq("author_id", uid)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("events")
      .select("id, title, created_at")
      .eq("organizer_id", uid)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("event_participants")
      .select("event_id, status, created_at, events(title)")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("matches")
      .select("id, matched_user_id, status, updated_at")
      .eq("user_id", uid)
      .eq("status", "accepted")
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("follows")
      .select("followed_id, created_at, profiles:followed_id(display_name)")
      .eq("follower_id", uid)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("user_achievements")
      .select("code, earned_at, achievements(label)")
      .eq("user_id", uid)
      .order("earned_at", { ascending: false })
      .limit(20),
  ])

  type Item = {
    at: string
    icon: typeof MessageSquare
    text: string
    href: string | null
  }
  const items: Item[] = []

  for (const p of (posts.data ?? []) as { id: string; content: string; created_at: string }[]) {
    items.push({
      at: p.created_at,
      icon: MessageSquare,
      text: `게시글 작성: "${p.content.slice(0, 40)}..."`,
      href: `/community/${p.id}`,
    })
  }
  for (const c of (comments.data ?? []) as {
    id: string
    content: string
    post_id: string
    created_at: string
  }[]) {
    items.push({
      at: c.created_at,
      icon: MessageSquare,
      text: `댓글 작성: "${c.content.slice(0, 40)}..."`,
      href: `/community/${c.post_id}`,
    })
  }
  for (const r of (reviews.data ?? []) as {
    id: string
    event_id: string
    rating: number
    created_at: string
  }[]) {
    items.push({
      at: r.created_at,
      icon: Star,
      text: `이벤트 후기 작성 (${r.rating}점)`,
      href: `/events/${r.event_id}`,
    })
  }
  for (const e of (events.data ?? []) as {
    id: string
    title: string
    created_at: string
  }[]) {
    items.push({
      at: e.created_at,
      icon: Calendar,
      text: `모임 주최: ${e.title}`,
      href: `/events/${e.id}`,
    })
  }
  for (const jp of (joined.data ?? []) as Array<
    Pick<Tables<"event_participants">, "event_id" | "status" | "created_at"> & {
      events: Pick<Tables<"events">, "title"> | null
    }
  >) {
    items.push({
      at: jp.created_at,
      icon: Calendar,
      text: `모임 ${jp.status === "waitlisted" ? "대기 등록" : "참가"}: ${jp.events?.title ?? "모임"}`,
      href: `/events/${jp.event_id}`,
    })
  }
  for (const m of (matches.data ?? []) as {
    id: string
    matched_user_id: string
    updated_at: string
  }[]) {
    items.push({
      at: m.updated_at,
      icon: Heart,
      text: "상호 매칭",
      href: `/profile/${m.matched_user_id}`,
    })
  }
  for (const f of (follows.data ?? []) as {
    followed_id: string
    created_at: string
    profiles: Pick<Tables<"profiles">, "display_name"> | null
  }[]) {
    items.push({
      at: f.created_at,
      icon: UserPlus,
      text: `팔로우: ${f.profiles?.display_name ?? "사용자"}`,
      href: `/profile/${f.followed_id}`,
    })
  }
  for (const a of (achievements.data ?? []) as {
    code: string
    earned_at: string
    achievements: { label: string } | null
  }[]) {
    items.push({
      at: a.earned_at,
      icon: Trophy,
      text: `업적 획득: ${a.achievements?.label ?? a.code}`,
      href: "/achievements",
    })
  }

  items.sort((a, b) => (a.at < b.at ? 1 : -1))

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-3xl font-bold">내 활동</h1>
          <p className="text-muted-foreground text-sm mt-1">
            최근 활동을 시간 순서로 모아봅니다.
          </p>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              아직 기록된 활동이 없습니다.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y p-0">
              {items.slice(0, 80).map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex items-start gap-3 p-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Icon aria-hidden="true" className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {item.href ? (
                          <Link href={item.href} className="hover:underline">
                            {item.text}
                          </Link>
                        ) : (
                          item.text
                        )}
                      </p>
                      <time
                        dateTime={item.at}
                        className="text-xs text-muted-foreground"
                      >
                        {new Date(item.at).toLocaleString("ko-KR")}
                      </time>
                    </div>
                  </div>
                )
              })}
              {items.length > 80 && (
                <div className="p-4 text-center">
                  <Badge variant="secondary">
                    {items.length - 80}개 더 있음
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
