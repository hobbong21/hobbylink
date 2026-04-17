"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { unblockUser } from "@/lib/moderation/actions"

export function UnblockButton({ targetId }: { targetId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      const result = await unblockUser(targetId)
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={handleClick} disabled={isPending}>
        {isPending ? "해제 중..." : "차단 해제"}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  )
}
