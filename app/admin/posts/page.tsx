import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Tables } from "@/lib/database.types"

export default async function AdminPostsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("posts")
    .select("*, profiles:author_id(display_name)")
    .order("created_at", { ascending: false })
    .limit(50)

  type PostRow = Tables<"posts"> & {
    profiles: Pick<Tables<"profiles">, "display_name"> | null
  }
  const posts = (data ?? []) as PostRow[]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">게시글 관리</h1>
        <p className="text-muted-foreground mt-2">최근 게시글 {posts.length}개</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 게시글</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {posts.map((p) => (
              <div key={p.id} className="py-3 space-y-1">
                <p className="text-sm font-medium">
                  {p.profiles?.display_name ?? "사용자"} ·{" "}
                  <span className="font-normal text-muted-foreground text-xs">
                    {new Date(p.created_at).toLocaleString("ko-KR")}
                  </span>
                </p>
                <p className="text-sm line-clamp-2">{p.content}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>좋아요 {p.likes_count}</span>
                  <span>댓글 {p.comments_count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
