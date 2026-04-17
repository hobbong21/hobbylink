"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface FeedItem {
  id: string
  author_id: string
  content: string
  image_url: string | null
  likes_count: number
  comments_count: number
  created_at: string
  profiles: { display_name: string; avatar_url: string | null } | null
}

interface FeedListProps {
  initialItems: FeedItem[]
  initialCursor: string | null
}

/**
 * Client-side infinite scroll for the following feed. Initial page is
 * rendered by the server; subsequent pages are fetched from /api/feed.
 * Uses IntersectionObserver to auto-load when the sentinel enters the viewport.
 */
export function FeedList({ initialItems, initialCursor }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !cursor) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ cursor })
      const r = await fetch(`/api/feed?${params.toString()}`)
      if (!r.ok) throw new Error(`status ${r.status}`)
      const body = (await r.json()) as { items: FeedItem[]; nextCursor: string | null }
      setItems((prev) => [...prev, ...body.items])
      setCursor(body.nextCursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : "불러오기 실패")
    } finally {
      setLoading(false)
    }
  }, [cursor, loading])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !cursor) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore()
      },
      { rootMargin: "400px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [cursor, loadMore])

  return (
    <div className="space-y-4">
      {items.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4 space-y-3">
            <CardHeader className="p-0">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={p.profiles?.avatar_url ?? "/placeholder-user.jpg"}
                    alt={`${p.profiles?.display_name ?? "사용자"}의 프로필 사진`}
                  />
                  <AvatarFallback>{p.profiles?.display_name?.[0] ?? "U"}</AvatarFallback>
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
            </CardHeader>
            <Link
              href={`/community/${p.id}`}
              className="block hover:bg-muted/40 -mx-2 px-2 py-1 rounded transition-colors"
            >
              <p className="text-sm whitespace-pre-line line-clamp-4">{p.content}</p>
              {p.image_url && (
                <div className="mt-2 relative aspect-video rounded-md overflow-hidden bg-muted">
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

      {cursor && (
        <div ref={sentinelRef} className="py-4 text-center">
          {loading ? (
            <p className="text-xs text-muted-foreground">불러오는 중...</p>
          ) : (
            <Button variant="outline" size="sm" onClick={loadMore}>
              더 보기
            </Button>
          )}
          {error && (
            <p role="alert" className="text-xs text-red-600 mt-1">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
