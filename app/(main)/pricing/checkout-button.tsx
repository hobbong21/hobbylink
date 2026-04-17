"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function CheckoutButton() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const onClick = async () => {
    setError(null)
    setIsPending(true)
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" })
      const body = (await res.json()) as { ok: boolean; data?: { url: string }; message?: string }
      if (!body.ok || !body.data?.url) {
        setError(body.message ?? "결제를 시작할 수 없습니다")
        return
      }
      window.location.href = body.data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청 실패")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={onClick} disabled={isPending} className="w-full">
        {isPending ? "이동 중..." : "프리미엄 시작하기"}
      </Button>
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded"
        >
          {error}
        </div>
      )}
    </div>
  )
}
