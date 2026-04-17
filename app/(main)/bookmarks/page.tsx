import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MessageSquare } from "lucide-react"
import type { Tables } from "@/lib/database.types"

export default async function BookmarksPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { data: rows } = await supabase
    .from("bookmarks")
    .select("id, target_type, target_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  type BookmarkRow = Pick<
    Tables<"bookmarks">,
    "id" | "target_type" | "target_id" | "created_at"
  >
  const bookmarks = (rows ?? []) as BookmarkRow[]

  const postIds = bookmarks.filter((b) => b.target_type === "post").map((b) => b.target_id)
  const eventIds = bookmarks.filter((b) => b.target_type === "event").map((b) => b.target_id)

  const [{ data: posts }, { data: events }] = await Promise.all([
    postIds.length > 0
      ? supabase
          .from("posts")
          .select("id, content, created_at, likes_count")
          .in("id", postIds)
      : Promise.resolve({ data: [] as Tables<"posts">[] }),
    eventIds.length > 0
      ? supabase
          .from("events")
          .select("id, title, event_date, location")
          .in("id", eventIds)
      : Promise.resolve({ data: [] as Tables<"events">[] }),
  ])

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">북마크</h1>
        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">
              <Calendar aria-hidden="true" className="w-4 h-4 mr-2" />
              모임 ({eventIds.length})
            </TabsTrigger>
            <TabsTrigger value="posts">
              <MessageSquare aria-hidden="true" className="w-4 h-4 mr-2" />
              게시글 ({postIds.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-2 mt-4">
            {(events ?? []).length === 0 ? (
              <EmptyState label="저장한 모임이 없습니다." />
            ) : (
              (events ?? []).map((e) => (
                <Card key={e.id}>
                  <CardContent className="p-4">
                    <Link
                      href={`/events/${e.id}`}
                      className="font-medium hover:underline"
                    >
                      {e.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(e.event_date).toLocaleString("ko-KR")}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-2 mt-4">
            {(posts ?? []).length === 0 ? (
              <EmptyState label="저장한 게시글이 없습니다." />
            ) : (
              (posts ?? []).map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <Link
                      href={`/community/${p.id}`}
                      className="text-sm line-clamp-2 hover:underline"
                    >
                      {p.content}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      좋아요 {p.likes_count} · {new Date(p.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-muted-foreground text-center">
          {label}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
