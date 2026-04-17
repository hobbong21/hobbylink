import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Heart, MessageCircle, UserPlus, Calendar, Info } from "lucide-react"
import { MarkAllReadButton } from "./mark-all-read-button"
import type { Tables } from "@/lib/database.types"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { data } = await supabase
    .from("notifications")
    .select("*, actor:actor_id(display_name, avatar_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  type NotificationRow = Tables<"notifications"> & {
    actor: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
  }
  const rows = (data ?? []) as NotificationRow[]
  const hasUnread = rows.some((r) => !r.is_read)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell aria-hidden="true" className="w-7 h-7" />
              알림
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              총 {rows.length}건 · 읽지 않음 {rows.filter((r) => !r.is_read).length}건
            </p>
          </div>
          {hasUnread && <MarkAllReadButton />}
        </div>

        {rows.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              아직 알림이 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((n) => (
              <NotificationItem key={n.id} n={n} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function NotificationItem({
  n,
}: {
  n: Tables<"notifications"> & {
    actor: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
  }
}) {
  const { icon: Icon, label, href } = describe(n)

  const content = (
    <Card
      className={n.is_read ? "hover:bg-muted/40 transition-colors" : "border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors"}
    >
      <CardContent className="p-4 flex items-start gap-3">
        {n.actor ? (
          <Avatar className="flex-shrink-0">
            <AvatarImage
              src={n.actor.avatar_url ?? "/placeholder-user.jpg"}
              alt={`${n.actor.display_name}의 프로필 사진`}
            />
            <AvatarFallback>{n.actor.display_name[0]}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Icon aria-hidden="true" className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm">{label}</p>
            {!n.is_read && <Badge>새</Badge>}
          </div>
          <time
            dateTime={n.created_at}
            className="text-xs text-muted-foreground"
          >
            {new Date(n.created_at).toLocaleString("ko-KR")}
          </time>
        </div>
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

function describe(
  n: Tables<"notifications"> & {
    actor: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
  },
): { icon: typeof Bell; label: string; href: string | null } {
  const actor = n.actor?.display_name ?? "누군가"
  const payload = (n.payload ?? {}) as Record<string, unknown>

  switch (n.type) {
    case "match_accepted":
      return { icon: Heart, label: `${actor}님과 매칭되었어요!`, href: "/matches" }
    case "new_message":
      return {
        icon: MessageCircle,
        label: `${actor}: ${(payload.preview as string) || "새 메시지"}`,
        href: payload.peer_id ? `/messages/${payload.peer_id as string}` : "/messages",
      }
    case "new_follower":
      return {
        icon: UserPlus,
        label: `${actor}님이 당신을 팔로우했습니다`,
        href: n.actor_id ? `/profile/${n.actor_id}` : null,
      }
    case "event_reminder":
      return {
        icon: Calendar,
        label: `${(payload.event_title as string) ?? "모임"} — 곧 시작합니다`,
        href: payload.event_id ? `/events/${payload.event_id as string}` : "/events",
      }
    case "event_cancelled":
      return {
        icon: Calendar,
        label: `${(payload.event_title as string) ?? "모임"}이 취소되었습니다`,
        href: null,
      }
    case "system":
    default:
      return {
        icon: Info,
        label: (payload.message as string) ?? "새 알림이 있습니다",
        href: null,
      }
  }
}
