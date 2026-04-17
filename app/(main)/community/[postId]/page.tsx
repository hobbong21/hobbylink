import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CommentsSection } from "./comments-section"
import { LikeButton } from "./like-button"
import { ReportDialog } from "@/components/moderation/report-dialog"
import { BookmarkButton } from "@/components/bookmark-button"
import { PostOwnerActions } from "./owner-actions"
import type { Tables } from "@/lib/database.types"

interface PostPageProps {
  params: Promise<{ postId: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { postId } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from("posts")
    .select("*, profiles:author_id(display_name, avatar_url)")
    .eq("id", postId)
    .maybeSingle()

  if (!data) notFound()

  type PostRow = Tables<"posts"> & {
    profiles: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
  }
  const post = data as PostRow

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Did the caller already like / bookmark this post?
  let initialLiked = false
  let initialSaved = false
  if (user) {
    const [{ data: myLike }, { data: myBm }] = await Promise.all([
      supabase
        .from("post_likes")
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_type", "post")
        .eq("target_id", postId)
        .maybeSingle(),
    ])
    initialLiked = !!myLike
    initialSaved = !!myBm
  }

  const { data: commentsData } = await supabase
    .from("comments")
    .select("*, profiles:author_id(display_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  type CommentRow = Tables<"comments"> & {
    profiles: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
  }
  const comments = (commentsData ?? []) as CommentRow[]

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/community"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 커뮤니티로
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage
                  src={post.profiles?.avatar_url ?? "/placeholder-user.jpg"}
                  alt={`${post.profiles?.display_name ?? "사용자"}의 프로필 사진`}
                />
                <AvatarFallback>
                  {post.profiles?.display_name?.[0] ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">
                  {post.profiles?.display_name ?? "사용자"}
                </CardTitle>
                <CardDescription>
                  {new Date(post.created_at).toLocaleString("ko-KR")}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                좋아요 {post.likes_count} · 댓글 {post.comments_count}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-line leading-relaxed">{post.content}</p>
            {post.image_url && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={post.image_url}
                  alt="게시글 이미지"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex items-center gap-2 pt-2 border-t">
              <LikeButton
                postId={postId}
                initialLiked={initialLiked}
                initialCount={post.likes_count}
                disabled={!user}
              />
              {user && (
                <BookmarkButton
                  targetType="post"
                  targetId={postId}
                  initialSaved={initialSaved}
                />
              )}
              <ReportDialog targetType="post" targetId={postId} />
              {user?.id === post.author_id && (
                <div className="ml-auto">
                  <PostOwnerActions postId={postId} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <CommentsSection
          postId={postId}
          isAuthenticated={!!user}
          currentUserId={user?.id ?? null}
          initialComments={comments.map((c) => ({
            id: c.id,
            content: c.content,
            created_at: c.created_at,
            author_id: c.author_id,
            author_display_name: c.profiles?.display_name ?? "사용자",
            author_avatar_url: c.profiles?.avatar_url ?? null,
          }))}
        />
      </div>
    </main>
  )
}
