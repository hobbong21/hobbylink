import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, TrendingUp, Users, Clock } from "lucide-react"
import { WeeklyBest } from "@/components/community/weekly-best"
import type { Tables } from "@/lib/database.types"

export default async function CommunityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: postsData }, { data: eventsData }] = await Promise.all([
    supabase
      .from("posts")
      .select("*, profiles:author_id(display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("events")
      .select("id, title, event_date, location, image_url, current_participants, max_participants")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(5),
  ])

  type PostRow = Tables<"posts"> & {
    profiles: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
  }
  const posts = (postsData ?? []) as PostRow[]
  const events = (eventsData ?? []) as Pick<
    Tables<"events">,
    | "id"
    | "title"
    | "event_date"
    | "location"
    | "image_url"
    | "current_participants"
    | "max_participants"
  >[]

  return (
    <>
      <section className="bg-gradient-to-b from-muted/50 to-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">커뮤니티</h1>
            <p className="text-lg text-muted-foreground mb-6 text-pretty">
              취미를 공유하고, 경험을 나누며, 함께 성장하는 공간입니다
            </p>
            {user ? (
              <Button size="lg" asChild>
                <Link href="/community/new">
                  <MessageCircle aria-hidden="true" className="mr-2 w-5 h-5" />
                  새 글 작성하기
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link href="/login">로그인하고 글 작성하기</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Clock aria-hidden="true" className="w-5 h-5" />
                  최신 게시글
                </h2>
                <Badge variant="secondary">{posts.length}</Badge>
              </div>

              {posts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    아직 게시글이 없습니다. 첫 게시글을 남겨보세요.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.map((p) => (
                    <Card key={p.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={p.profiles?.avatar_url ?? "/placeholder-user.jpg"}
                              alt={`${p.profiles?.display_name ?? "사용자"}의 프로필 사진`}
                            />
                            <AvatarFallback>
                              {p.profiles?.display_name?.[0] ?? "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/profile/${p.author_id}`}
                              className="font-medium hover:underline"
                            >
                              {p.profiles?.display_name ?? "사용자"}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {new Date(p.created_at).toLocaleString("ko-KR")}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Link
                          href={`/community/${p.id}`}
                          className="block hover:bg-muted/40 -mx-2 px-2 py-1 rounded transition-colors"
                        >
                          <p className="whitespace-pre-line text-sm line-clamp-4">
                            {p.content}
                          </p>
                          {p.image_url && (
                            <div className="mt-3 relative aspect-video rounded-md overflow-hidden bg-muted">
                              <Image
                                src={p.image_url}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, 600px"
                              />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            좋아요 {p.likes_count} · 댓글 {p.comments_count}
                          </p>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <WeeklyBest />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp aria-hidden="true" className="w-5 h-5" />
                    다가오는 모임
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      예정된 모임이 없습니다.
                    </p>
                  ) : (
                    events.map((e) => (
                      <Link
                        key={e.id}
                        href={`/events/${e.id}`}
                        className="flex gap-3 hover:bg-muted/40 -mx-2 px-2 py-2 rounded transition-colors"
                      >
                        {e.image_url && (
                          <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                            <Image
                              src={e.image_url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{e.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(e.event_date).toLocaleDateString("ko-KR")}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Users aria-hidden="true" className="w-3 h-3" />
                            {e.current_participants ?? 0}
                            {e.max_participants ? ` / ${e.max_participants}` : ""}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/events">모든 모임 보기</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>커뮤니티 가이드</CardTitle>
                  <CardDescription>
                    서로를 존중하며 안전한 공간을 함께 만들어요. 부적절한 내용은 신고 버튼으로 알려주세요.
                  </CardDescription>
                </CardHeader>
              </Card>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
