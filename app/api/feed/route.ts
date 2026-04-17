import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/feed?cursor=<iso>&limit=20
 *
 * Cursor-paginated following feed. `cursor` is the `created_at` of the last
 * item the client already has — rows strictly before that are returned.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ items: [], nextCursor: null }, { status: 401 })

  const limit = Math.min(
    50,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 20)),
  )
  const cursor = req.nextUrl.searchParams.get("cursor")

  const { data: follows } = await supabase
    .from("follows")
    .select("followed_id")
    .eq("follower_id", user.id)
  const followedIds = (follows ?? []).map((r) => r.followed_id)
  if (followedIds.length === 0) {
    return NextResponse.json({ items: [], nextCursor: null })
  }

  let q = supabase
    .from("posts")
    .select("id, author_id, content, image_url, likes_count, comments_count, created_at, profiles:author_id(display_name, avatar_url)")
    .in("author_id", followedIds)
    .order("created_at", { ascending: false })
    .limit(limit + 1)
  if (cursor) q = q.lt("created_at", cursor)

  const { data } = await q
  const rows = data ?? []
  const hasMore = rows.length > limit
  const items = rows.slice(0, limit)
  const nextCursor = hasMore ? items[items.length - 1]?.created_at ?? null : null

  return NextResponse.json({ items, nextCursor })
}
