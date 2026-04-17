"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { suspendUser, unsuspendUser } from "../reports/actions"

interface SuspendButtonProps {
  userId: string
  isSuspended: boolean
}

export function SuspendButton({ userId, isSuspended }: SuspendButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onClick = () => {
    setError(null)
    startTransition(async () => {
      const result = isSuspended
        ? await unsuspendUser(userId)
        : await suspendUser(userId)
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={isSuspended ? "default" : "destructive"}
        size="sm"
        onClick={onClick}
        disabled={isPending}
      >
        {isPending ? "처리 중..." : isSuspended ? "정지 해제" : "계정 정지"}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  )
}
