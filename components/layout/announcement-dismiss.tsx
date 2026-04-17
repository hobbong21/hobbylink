"use client"

import { useState, useTransition } from "react"
import { X } from "lucide-react"
import { dismissAnnouncement } from "./announcement-actions"

export function DismissButton({ announcementId }: { announcementId: string }) {
  const [hidden, setHidden] = useState(false)
  const [isPending, startTransition] = useTransition()

  const onClick = () => {
    setHidden(true)
    startTransition(async () => {
      await dismissAnnouncement(announcementId)
    })
  }

  if (hidden) return null

  return (
    <button
      type="button"
      aria-label="공지 닫기"
      onClick={onClick}
      disabled={isPending}
      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 flex-shrink-0"
    >
      <X aria-hidden="true" className="w-4 h-4" />
    </button>
  )
}
