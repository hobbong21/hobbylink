"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp } from "lucide-react"
import { toggleLike } from "./like-actions"

interface LikeButtonProps {
  postId: string
  initialLiked: boolean
  initialCount: number
  disabled?: boolean
}

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
  disabled,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  const onClick = () => {
    if (disabled) return
    const next = !liked
    setLiked(next)
    setCount((c) => c + (next ? 1 : -1))
    startTransition(async () => {
      const r = await toggleLike(postId, next)
      if (!r.ok) {
        // Revert on failure
        setLiked(!next)
        setCount((c) => c - (next ? 1 : -1))
      }
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={onClick}
      disabled={disabled || isPending}
      aria-pressed={liked}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
    >
      <ThumbsUp
        aria-hidden="true"
        className={
          liked ? "w-4 h-4 fill-current text-primary" : "w-4 h-4 text-muted-foreground"
        }
      />
      <span>{count}</span>
    </Button>
  )
}
