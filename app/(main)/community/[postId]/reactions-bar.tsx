"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { toggleReaction, type Reaction } from "./reaction-actions"

const REACTIONS: Array<{ key: Reaction; emoji: string; label: string }> = [
  { key: "like", emoji: "👍", label: "좋아요" },
  { key: "love", emoji: "❤️", label: "사랑해요" },
  { key: "laugh", emoji: "😆", label: "웃겨요" },
  { key: "wow", emoji: "😮", label: "놀라워요" },
  { key: "sad", emoji: "😢", label: "슬퍼요" },
  { key: "clap", emoji: "👏", label: "짝짝짝" },
]

interface ReactionsBarProps {
  postId: string
  initialCounts: Record<Reaction, number>
  initialMine: Reaction[]
  disabled?: boolean
}

export function ReactionsBar({
  postId,
  initialCounts,
  initialMine,
  disabled,
}: ReactionsBarProps) {
  const [counts, setCounts] = useState<Record<Reaction, number>>(initialCounts)
  const [mine, setMine] = useState<Set<Reaction>>(new Set(initialMine))
  const [isPending, startTransition] = useTransition()

  const click = (key: Reaction) => {
    if (disabled) return
    const on = !mine.has(key)
    // optimistic
    setMine((prev) => {
      const next = new Set(prev)
      if (on) next.add(key)
      else next.delete(key)
      return next
    })
    setCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] ?? 0) + (on ? 1 : -1)),
    }))
    startTransition(async () => {
      const r = await toggleReaction(postId, key, on)
      if (!r.ok) {
        // revert
        setMine((prev) => {
          const next = new Set(prev)
          if (on) next.delete(key)
          else next.add(key)
          return next
        })
        setCounts((prev) => ({
          ...prev,
          [key]: Math.max(0, (prev[key] ?? 0) + (on ? -1 : 1)),
        }))
      }
    })
  }

  return (
    <div
      className="flex flex-wrap gap-1"
      role="toolbar"
      aria-label="감정 표현"
    >
      {REACTIONS.map((r) => {
        const on = mine.has(r.key)
        const count = counts[r.key] ?? 0
        return (
          <Button
            key={r.key}
            type="button"
            size="sm"
            variant={on ? "default" : "ghost"}
            onClick={() => click(r.key)}
            disabled={disabled || isPending}
            aria-pressed={on}
            aria-label={`${r.label} (${count})`}
            className="gap-1 h-8 px-2"
          >
            <span aria-hidden="true" className="text-base leading-none">
              {r.emoji}
            </span>
            {count > 0 && <span className="text-xs">{count}</span>}
          </Button>
        )
      })}
    </div>
  )
}
