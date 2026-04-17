"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteEventPhoto } from "./photo-actions"

interface DeletePhotoButtonProps {
  photoId: string
  storagePath: string
}

export function DeletePhotoButton({ photoId, storagePath }: DeletePhotoButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onClick = () => {
    if (!confirm("이 사진을 삭제할까요?")) return
    startTransition(async () => {
      const result = await deleteEventPhoto(photoId, storagePath)
      if (result.ok) router.refresh()
    })
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="destructive"
      className="w-7 h-7"
      onClick={onClick}
      disabled={isPending}
      aria-label="사진 삭제"
    >
      <Trash2 aria-hidden="true" className="w-3 h-3" />
    </Button>
  )
}
