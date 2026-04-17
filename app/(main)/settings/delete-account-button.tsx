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
import { deleteOwnAccount } from "./actions"

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteOwnAccount()
      // If successful, the action redirects. We only get here on failure.
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
        <Button variant="destructive" size="sm">
          계정 삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말 계정을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            이 작업은 되돌릴 수 없습니다. 프로필, 관심사, 메시지 등 모든 데이터가 영구적으로
            삭제됩니다.
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
            {isPending ? "삭제 중..." : "삭제하기"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
