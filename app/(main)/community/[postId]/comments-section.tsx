"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MentionTextarea } from "@/components/mentions/mention-textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ReportDialog } from "@/components/moderation/report-dialog"
import { Trash2, Reply } from "lucide-react"
import { createComment, deleteComment } from "./actions"

export interface CommentRowVM {
  id: string
  content: string
  created_at: string
  author_id: string
  author_display_name: string
  author_avatar_url: string | null
  parent_id: string | null
}

interface CommentsSectionProps {
  postId: string
  isAuthenticated: boolean
  currentUserId: string | null
  initialComments: CommentRowVM[]
}

interface ThreadNode extends CommentRowVM {
  replies: CommentRowVM[]
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
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Group comments into top-level + children.
  const threads = useMemo<ThreadNode[]>(() => {
    const roots: ThreadNode[] = comments
      .filter((c) => !c.parent_id)
      .map((c) => ({ ...c, replies: [] }))
    const byId = new Map(roots.map((r) => [r.id, r]))
    for (const c of comments) {
      if (c.parent_id && byId.has(c.parent_id)) {
        byId.get(c.parent_id)!.replies.push(c)
      }
    }
    for (const r of roots) {
      r.replies.sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    }
    return roots.sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
  }, [comments])

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

  const submitReply = (parentId: string) => {
    const content = (replyDrafts[parentId] ?? "").trim()
    if (!content) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set("post_id", postId)
      fd.set("content", content)
      fd.set("parent_id", parentId)
      const r = await createComment(fd)
      if (!r.ok) {
        setError(r.message)
        return
      }
      setReplyDrafts((prev) => ({ ...prev, [parentId]: "" }))
      setReplyTo(null)
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
            <MentionTextarea
              value={draft}
              onChange={setDraft}
              placeholder="댓글을 입력하세요 (@로 멘션)"
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

        {threads.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
          </p>
        ) : (
          <div className="space-y-5">
            {threads.map((t) => (
              <CommentItem
                key={t.id}
                comment={t}
                currentUserId={currentUserId}
                isAuthenticated={isAuthenticated}
                isPending={isPending}
                replyOpen={replyTo === t.id}
                replyDraft={replyDrafts[t.id] ?? ""}
                onReplyToggle={() => setReplyTo(replyTo === t.id ? null : t.id)}
                onReplyChange={(v) =>
                  setReplyDrafts((prev) => ({ ...prev, [t.id]: v }))
                }
                onReplySubmit={() => submitReply(t.id)}
                onDelete={onDelete}
              >
                {t.replies.length > 0 && (
                  <div className="ml-12 mt-3 space-y-3 border-l pl-4">
                    {t.replies.map((r) => (
                      <CommentItem
                        key={r.id}
                        comment={{ ...r, replies: [] as CommentRowVM[] }}
                        currentUserId={currentUserId}
                        isAuthenticated={isAuthenticated}
                        isPending={isPending}
                        compact
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                )}
              </CommentItem>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CommentItemProps {
  comment: ThreadNode | (CommentRowVM & { replies: CommentRowVM[] })
  currentUserId: string | null
  isAuthenticated: boolean
  isPending: boolean
  compact?: boolean
  replyOpen?: boolean
  replyDraft?: string
  onReplyToggle?: () => void
  onReplyChange?: (v: string) => void
  onReplySubmit?: () => void
  onDelete: (id: string) => void
  children?: React.ReactNode
}

function CommentItem({
  comment: c,
  currentUserId,
  isAuthenticated,
  isPending,
  compact,
  replyOpen,
  replyDraft,
  onReplyToggle,
  onReplyChange,
  onReplySubmit,
  onDelete,
  children,
}: CommentItemProps) {
  return (
    <div className="flex gap-3">
      <Avatar className={compact ? "w-7 h-7" : ""}>
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
          <time dateTime={c.created_at} className="text-xs text-muted-foreground">
            {new Date(c.created_at).toLocaleString("ko-KR")}
          </time>
        </div>
        <p className="text-sm mt-1 whitespace-pre-line break-words">{c.content}</p>
        <div className="flex items-center gap-1 mt-2">
          {!compact && isAuthenticated && onReplyToggle && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 text-muted-foreground"
              onClick={onReplyToggle}
              disabled={isPending}
            >
              <Reply aria-hidden="true" className="w-4 h-4" />
              답글
            </Button>
          )}
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
        {!compact && replyOpen && onReplyChange && onReplySubmit && (
          <div className="mt-3 space-y-2">
            <MentionTextarea
              value={replyDraft ?? ""}
              onChange={onReplyChange}
              placeholder="답글을 입력하세요 (@로 멘션)"
              rows={2}
              maxLength={2000}
              aria-label="답글 입력"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onReplyToggle}
                disabled={isPending}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={onReplySubmit}
                disabled={isPending || !(replyDraft?.trim())}
              >
                답글 작성
              </Button>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
