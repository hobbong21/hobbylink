import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import type { Tables } from "@/lib/database.types"

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  // Users I follow
  const { data: follows } = await supabase
    .from("follows")
    .select("followed_id")
    .eq("follower_id", user.id)
  const followedIds = (follows ?? []).map((r) => r.followed_id)

  if (followedIds.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">팔로잉 피드</h1>
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Users aria-hidden="true" className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">아직 팔로우하는 사용자가 없습니다.</p>
              <Button asChild>
                <Link href="/explore">사용자 탐색하기</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const { data: postsData } = await supabase
    .from("posts")
    .select("*, profiles:author_id(display_name, avatar_url)")
    .in("author_id", followedIds)
    .order("created_at", { ascending: false })
    .limit(50)

  type PostRow = Tables<"posts"> & {
    profiles: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
  }
  const posts = (postsData ?? []) as PostRow[]

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">팔로잉 피드</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            팔로우하는 {followedIds.length}명의 최신 게시글
          </p>
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              팔로우한 사용자들이 아직 게시글을 올리지 않았습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 space-y-3">
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
                        className="font-medium text-sm hover:underline"
                      >
                        {p.profiles?.display_name ?? "사용자"}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleString("ko-KR")}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/community/${p.id}`}
                    className="block hover:bg-muted/40 -mx-2 px-2 py-1 rounded transition-colors"
                  >
                    <p className="text-sm whitespace-pre-line line-clamp-4">
                      {p.content}
                    </p>
                    {p.image_url && (
                      <div className="mt-2 relative aspect-video rounded-md overflow-hidden bg-muted">
                        <Image
                          src={p.image_url}
                          alt="게시글 이미지"
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
    </main>
  )
}
