"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { resolveReport } from "./actions"

export function ResolveReportActions({ reportId }: { reportId: string }) {
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handle = (status: "resolved" | "dismissed") => {
    setError(null)
    startTransition(async () => {
      const result = await resolveReport(reportId, status, notes || undefined)
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <div className="space-y-2 pt-2 border-t">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="처리 메모 (선택)"
        rows={2}
        maxLength={500}
      />
      {error && (
        <div role="alert" className="text-xs text-red-600">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handle("resolved")} disabled={isPending}>
          해결 처리
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handle("dismissed")}
          disabled={isPending}
        >
          반려
        </Button>
      </div>
    </div>
  )
}
