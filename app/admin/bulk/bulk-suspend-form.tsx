"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { bulkSuspend } from "./actions"

export function BulkSuspendForm() {
  const [text, setText] = useState("")
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "ok"; count: number }
    | { kind: "error"; message: string }
  >({ kind: "idle" })
  const [isPending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ kind: "idle" })
    if (!confirm("정말 일괄 정지할까요? 되돌리려면 사용자 관리 페이지에서 개별 해제해야 합니다.")) {
      return
    }
    startTransition(async () => {
      const r = await bulkSuspend(text)
      if (r.ok) {
        setStatus({ kind: "ok", count: r.count })
        setText("")
      } else {
        setStatus({ kind: "error", message: r.message })
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="한 줄에 하나씩, 사용자 UUID를 붙여넣으세요."
        className="font-mono text-xs"
      />
      {status.kind === "ok" && (
        <div role="status" className="text-sm text-green-700">
          {status.count}명이 정지되었습니다.
        </div>
      )}
      {status.kind === "error" && (
        <div role="alert" className="text-sm text-red-600">
          {status.message}
        </div>
      )}
      <Button type="submit" variant="destructive" disabled={isPending || !text.trim()}>
        {isPending ? "처리 중..." : "일괄 정지 실행"}
      </Button>
    </form>
  )
}
