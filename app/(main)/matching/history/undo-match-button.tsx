"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Undo2 } from "lucide-react"
import { undoMatch } from "../actions"

export function UndoMatchButton({ matchId }: { matchId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onClick = () => {
    setError(null)
    startTransition(async () => {
      const r = await undoMatch(matchId)
      if (!r.ok) {
        setError(r.message ?? "실패")
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={onClick} disabled={isPending} className="gap-1">
        <Undo2 aria-hidden="true" className="w-3 h-3" />
        되돌리기
      </Button>
      {error && (
        <span role="alert" className="text-[10px] text-red-600">
          {error}
        </span>
      )}
    </div>
  )
}
