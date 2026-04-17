"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteAnnouncement } from "./actions"

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const onClick = () => {
    if (!confirm("이 공지를 삭제할까요?")) return
    startTransition(async () => {
      const r = await deleteAnnouncement(id)
      if (r.ok) router.refresh()
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={isPending}
      aria-label="공지 삭제"
      className="text-destructive"
    >
      <Trash2 aria-hidden="true" className="w-4 h-4" />
    </Button>
  )
}
