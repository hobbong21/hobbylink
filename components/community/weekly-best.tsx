import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"
import type { Tables } from "@/lib/database.types"

/**
 * Top 5 posts from the past 7 days ordered by likes_count.
 * No SQL view — simple query + in-memory sort, good enough up to tens
 * of thousands of weekly posts.
 */
export async function WeeklyBest() {
  const supabase = await createClient()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString()

  const { data } = await supabase
    .from("posts")
    .select("id, content, likes_count, comments_count, profiles:author_id(display_name)")
    .gte("created_at", weekAgo)
    .order("likes_count", { ascending: false })
    .limit(5)

  type Row = Pick<Tables<"posts">, "id" | "content" | "likes_count" | "comments_count"> & {
    profiles: Pick<Tables<"profiles">, "display_name"> | null
  }
  const posts = (data ?? []) as Row[]
  if (posts.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp aria-hidden="true" className="w-5 h-5" />
          이번 주 베스트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {posts.map((p, i) => (
          <Link
            key={p.id}
            href={`/community/${p.id}`}
            className="block hover:bg-muted/40 -mx-2 px-2 py-2 rounded transition-colors"
          >
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-muted-foreground w-4 flex-shrink-0">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm line-clamp-2">{p.content}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                  <span>{p.profiles?.display_name ?? "사용자"}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    ♥ {p.likes_count}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    💬 {p.comments_count}
                  </Badge>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
