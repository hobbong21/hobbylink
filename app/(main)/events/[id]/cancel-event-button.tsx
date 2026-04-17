"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { cancelEvent } from "../actions"

interface CancelEventButtonProps {
  eventId: string
}

export function CancelEventButton({ eventId }: CancelEventButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onConfirm = () => {
    setError(null)
    startTransition(async () => {
      const r = await cancelEvent(eventId)
      if (!r.ok) {
        setError(r.message)
        return
      }
      setOpen(false)
      router.push("/my-events")
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 aria-hidden="true" className="w-4 h-4" />
          모임 취소
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>모임을 취소할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            이 작업은 되돌릴 수 없습니다. 참가자 정보, 사진, 후기가 모두 함께 삭제됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div role="alert" className="text-sm text-red-600">
            {error}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? "삭제 중..." : "모임 삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
