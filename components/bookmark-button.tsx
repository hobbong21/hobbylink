"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { toggleBookmark, type BookmarkTarget } from "@/lib/bookmarks/actions"

interface BookmarkButtonProps {
  targetType: BookmarkTarget
  targetId: string
  initialSaved: boolean
  disabled?: boolean
}

export function BookmarkButton({
  targetType,
  targetId,
  initialSaved,
  disabled,
}: BookmarkButtonProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  const onClick = () => {
    const next = !saved
    setSaved(next)
    startTransition(async () => {
      const r = await toggleBookmark(targetType, targetId, next)
      if (!r.ok) setSaved(!next)
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
      aria-pressed={saved}
      aria-label={saved ? "저장됨" : "저장"}
    >
      {saved ? (
        <>
          <BookmarkCheck aria-hidden="true" className="w-4 h-4 fill-current" />
          저장됨
        </>
      ) : (
        <>
          <Bookmark aria-hidden="true" className="w-4 h-4" />
          저장
        </>
      )}
    </Button>
  )
}
