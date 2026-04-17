"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { mergeTags } from "./actions"

export function TagMergeForm() {
  const [source, setSource] = useState("")
  const [target, setTarget] = useState("")
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "ok" } | { kind: "error"; message: string }
  >({ kind: "idle" })
  const [isPending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ kind: "idle" })
    startTransition(async () => {
      const r = await mergeTags(source, target)
      if (r.ok) {
        setStatus({ kind: "ok" })
        setSource("")
        setTarget("")
      } else {
        setStatus({ kind: "error", message: r.message })
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="src">원본 태그 (삭제됨)</Label>
          <Input
            id="src"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="예: hiking"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tgt">대상 태그 (유지됨)</Label>
          <Input
            id="tgt"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="예: 등산"
          />
        </div>
      </div>
      {status.kind === "ok" && (
        <div role="status" className="text-sm text-green-700">
          병합되었습니다.
        </div>
      )}
      {status.kind === "error" && (
        <div role="alert" className="text-sm text-red-600">
          {status.message}
        </div>
      )}
      <Button type="submit" disabled={isPending || !source || !target}>
        {isPending ? "병합 중..." : "병합 실행"}
      </Button>
    </form>
  )
}
