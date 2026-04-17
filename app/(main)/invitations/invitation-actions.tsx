"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { respondToInvitation } from "../events/actions"

export function InvitationActions({ invitationId }: { invitationId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const respond = (action: "accept" | "decline") => {
    setError(null)
    startTransition(async () => {
      const r = await respondToInvitation(invitationId, action)
      if (!r.ok) {
        setError(r.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => respond("accept")}
        disabled={isPending}
      >
        {isPending ? "처리 중..." : "수락"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => respond("decline")}
        disabled={isPending}
      >
        거절
      </Button>
      {error && (
        <span role="alert" className="text-xs text-red-600 ml-auto">
          {error}
        </span>
      )}
    </div>
  )
}
