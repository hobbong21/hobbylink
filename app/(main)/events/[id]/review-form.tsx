"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { submitReview } from "./review-actions"
import type { Tables } from "@/lib/database.types"

interface ReviewFormProps {
  eventId: string
  existingReview: Tables<"event_reviews"> | null
}

export function ReviewForm({ eventId, existingReview }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(existingReview?.rating ?? 0)
  const [comment, setComment] = useState<string>(existingReview?.comment ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError("별점을 선택해주세요")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await submitReview({ eventId, rating, comment })
      if (!result.ok) {
        setError(result.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 p-4 border rounded-lg">
      <div className="space-y-2">
        <label className="text-sm font-medium">별점</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label={`${value}점`}
              aria-pressed={rating === value}
            >
              <Star
                aria-hidden="true"
                className={
                  value <= rating
                    ? "w-6 h-6 fill-yellow-400 text-yellow-400"
                    : "w-6 h-6 text-muted-foreground"
                }
              />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="review-comment" className="text-sm font-medium">
          후기 (선택)
        </label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="모임은 어땠나요?"
        />
      </div>
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md"
        >
          {error}
        </div>
      )}
      <Button type="submit" disabled={isPending || rating < 1} size="sm">
        {isPending
          ? "저장 중..."
          : existingReview
            ? "후기 수정"
            : "후기 작성"}
      </Button>
    </form>
  )
}
