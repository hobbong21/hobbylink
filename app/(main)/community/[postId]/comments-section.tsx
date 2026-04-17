"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ReportDialog } from "@/components/moderation/report-dialog"
import { Trash2 } from "lucide-react"
import { createComment, deleteComment } from "./actions"

export interface CommentRowVM {
  id: string
  content: string
  created_at: string
  author_id: string
  author_display_name: string
  author_avatar_url: string | null
}

interface CommentsSectionProps {
  postId: string
  isAuthenticated: boolean
  currentUserId: string | null
  initialComments: CommentRowVM[]
}

export function CommentsSection({
  postId,
  isAuthenticated,
  currentUserId,
  initialComments,
}: CommentsSectionProps) {
  const router = useRouter()
  const [comments, setComments] = useState<CommentRowVM[]>(initialComments)
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content) return
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set("post_id", postId)
      fd.set("content", content)
      const result = await createComment(fd)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setDraft("")
      router.refresh()
    })
  }

  const onDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteComment(id)
      if (result.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id))
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>댓글 ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAuthenticated ? (
          <form onSubmit={onSubmit} className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="댓글을 입력하세요"
              rows={3}
              maxLength={2000}
              aria-label="댓글 입력"
            />
            {error && (
              <div role="alert" className="text-xs text-red-600">
                {error}
              </div>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending || !draft.trim()} size="sm">
                {isPending ? "전송 중..." : "댓글 작성"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            댓글을 작성하려면{" "}
            <Link href="/login" className="text-primary underline">
              로그인
            </Link>
            하세요.
          </p>
        )}

        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar>
                  <AvatarImage
                    src={c.author_avatar_url ?? "/placeholder-user.jpg"}
                    alt={`${c.author_display_name}의 프로필 사진`}
                  />
                  <AvatarFallback>{c.author_display_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/profile/${c.author_id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {c.author_display_name}
                    </Link>
                    <time
                      dateTime={c.created_at}
                      className="text-xs text-muted-foreground"
                    >
                      {new Date(c.created_at).toLocaleString("ko-KR")}
                    </time>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-line">{c.content}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ReportDialog targetType="comment" targetId={c.id} />
                    {currentUserId === c.author_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-muted-foreground"
                        onClick={() => onDelete(c.id)}
                        disabled={isPending}
                      >
                        <Trash2 aria-hidden="true" className="w-4 h-4" />
                        삭제
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
