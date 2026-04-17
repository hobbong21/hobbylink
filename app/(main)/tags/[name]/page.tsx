import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import type { Tables } from "@/lib/database.types"

interface TagPageProps {
  params: Promise<{ name: string }>
}

export default async function TagPage({ params }: TagPageProps) {
  const { name } = await params
  const normalized = decodeURIComponent(name).toLowerCase()
  const supabase = await createClient()

  const { data: tag } = await supabase
    .from("tags")
    .select("*")
    .eq("name", normalized)
    .maybeSingle<Tables<"tags">>()

  if (!tag) notFound()

  const [posts, events] = await Promise.all([
    supabase
      .from("post_tags")
      .select("posts(id, content, author_id, created_at, likes_count, comments_count)")
      .eq("tag_id", tag.id)
      .limit(30),
    supabase
      .from("event_tags")
      .select(
        "events(id, title, description, event_date, location, current_participants)",
      )
      .eq("tag_id", tag.id)
      .limit(30),
  ])

  type PostRef = { posts: Tables<"posts"> | null }
  type EventRef = { events: Tables<"events"> | null }

  const postList = ((posts.data ?? []) as PostRef[])
    .map((r) => r.posts)
    .filter((p): p is Tables<"posts"> => p !== null)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  const eventList = ((events.data ?? []) as EventRef[])
    .map((r) => r.events)
    .filter((e): e is Tables<"events"> => e !== null)
    .sort((a, b) => (a.event_date < b.event_date ? -1 : 1))

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Badge className="text-lg px-3 py-1">#{tag.name}</Badge>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            게시글 {postList.length}개 · 모임 {eventList.length}개
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>모임</CardTitle>
          </CardHeader>
          <CardContent>
            {eventList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">관련 모임이 없습니다.</p>
            ) : (
              <div className="divide-y">
                {eventList.map((e) => (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="flex items-center justify-between py-3 gap-3 hover:bg-muted/40 px-2 rounded transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{e.title}</p>
                      <p className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar aria-hidden="true" className="w-3 h-3" />
                        {new Date(e.event_date).toLocaleDateString("ko-KR")}
                        {e.location && <span>· {e.location}</span>}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>게시글</CardTitle>
          </CardHeader>
          <CardContent>
            {postList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">관련 게시글이 없습니다.</p>
            ) : (
              <div className="divide-y">
                {postList.map((p) => (
                  <Link
                    key={p.id}
                    href={`/community/${p.id}`}
                    className="block py-3 hover:bg-muted/40 px-2 rounded transition-colors"
                  >
                    <p className="text-sm line-clamp-2">{p.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      좋아요 {p.likes_count} · 댓글 {p.comments_count} ·{" "}
                      {new Date(p.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
