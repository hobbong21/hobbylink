import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import { FeedList } from "./feed-list"
import type { Tables } from "@/lib/database.types"

const PAGE_SIZE = 20

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

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
              <p className="text-muted-foreground">
                아직 팔로우하는 사용자가 없습니다.
              </p>
              <Button asChild>
                <Link href="/explore">사용자 탐색하기</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const { data: firstPage } = await supabase
    .from("posts")
    .select(
      "id, author_id, content, image_url, likes_count, comments_count, created_at, profiles:author_id(display_name, avatar_url)",
    )
    .in("author_id", followedIds)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1)

  type FeedRow = Pick<
    Tables<"posts">,
    | "id"
    | "author_id"
    | "content"
    | "image_url"
    | "likes_count"
    | "comments_count"
    | "created_at"
  > & {
    profiles: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
  }

  const rows = (firstPage ?? []) as FeedRow[]
  const hasMore = rows.length > PAGE_SIZE
  const items = rows.slice(0, PAGE_SIZE)
  const nextCursor = hasMore ? items[items.length - 1]?.created_at ?? null : null

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">팔로잉 피드</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            팔로우하는 {followedIds.length}명의 최신 게시글
          </p>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              팔로우한 사용자들이 아직 게시글을 올리지 않았습니다.
            </CardContent>
          </Card>
        ) : (
          <FeedList initialItems={items} initialCursor={nextCursor} />
        )}
      </div>
    </main>
  )
}
