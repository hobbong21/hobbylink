"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { extractHashtags } from "@/lib/tags"
import { updatePost } from "../../actions"

interface EditPostFormProps {
  postId: string
  initialContent: string
}

export function EditPostForm({ postId, initialContent }: EditPostFormProps) {
  const [content, setContent] = useState(initialContent)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const previewTags = extractHashtags(content)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = content.trim()
    if (!trimmed) {
      setError("내용을 입력하세요")
      return
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.set("post_id", postId)
      fd.set("content", trimmed)
      const r = await updatePost(fd)
      if (!r.ok) {
        setError(r.message)
        return
      }
      router.push(`/community/${postId}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        maxLength={5000}
        aria-label="게시글 내용"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{content.length} / 5000</span>
        {previewTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {previewTags.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">
                #{t}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
        >
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending || !content.trim()}>
          {isPending ? "저장 중..." : "저장"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/community/${postId}`)}
        >
          취소
        </Button>
      </div>
    </form>
  )
}
