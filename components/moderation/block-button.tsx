"use client"

import { useState, useTransition } from "react"
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
import { Ban } from "lucide-react"
import { blockUser } from "@/lib/moderation/actions"

interface BlockButtonProps {
  targetId: string
  targetName?: string
}

export function BlockButton({ targetId, targetName }: BlockButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    setError(null)
    startTransition(async () => {
      const result = await blockUser(targetId)
      if (!result.ok) {
        setError(result.message)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Ban aria-hidden="true" className="w-4 h-4" />
          차단
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {targetName ? `${targetName}님을 차단할까요?` : "이 사용자를 차단할까요?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            차단하면 서로의 프로필·메시지·매칭이 보이지 않으며, 기존 매칭은 해제됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
          >
            {error}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? "차단 중..." : "차단하기"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
