"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { joinEvent, leaveEvent } from "../actions"

interface JoinButtonProps {
  eventId: string
  isAuthenticated: boolean
  isJoined: boolean
  isFull: boolean
  isWaitlisted?: boolean
}

export function JoinButton({
  eventId,
  isAuthenticated,
  isJoined,
  isFull,
  isWaitlisted = false,
}: JoinButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!isAuthenticated) {
    return (
      <Button asChild className="w-full">
        <Link href="/login">로그인 후 참가하기</Link>
      </Button>
    )
  }

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      const result =
        isJoined || isWaitlisted
          ? await leaveEvent(eventId)
          : await joinEvent(eventId)
      if (!result.ok) {
        setError(result.message ?? "요청을 처리할 수 없습니다")
        return
      }
      router.refresh()
    })
  }

  const label = isPending
    ? "처리 중..."
    : isJoined
      ? "참가 취소"
      : isWaitlisted
        ? "대기 취소"
        : isFull
          ? "대기자 등록"
          : "참가하기"

  return (
    <div className="space-y-2">
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
        >
          {error}
        </div>
      )}
      {isWaitlisted && !isPending && (
        <p
          role="status"
          className="p-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded"
        >
          현재 대기자 명단에 있습니다. 자리가 나면 자동으로 참가 확정됩니다.
        </p>
      )}
      <Button
        className="w-full"
        onClick={handleClick}
        disabled={isPending}
        variant={isJoined || isWaitlisted ? "outline" : "default"}
      >
        {label}
      </Button>
    </div>
  )
}
