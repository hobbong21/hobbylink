"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export function ChangeEmailForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok" }
    | { kind: "error"; message: string }
  >({ kind: "idle" })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus({ kind: "loading" })
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: `${window.location.origin}/auth/callback?next=/settings` },
      )
      if (error) throw error
      setStatus({ kind: "ok" })
      setEmail("")
    } catch (err: unknown) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "이메일 변경 요청 실패",
      })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="new-email">새 이메일</Label>
        <Input
          id="new-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="new@example.com"
        />
      </div>
      {status.kind === "ok" && (
        <div
          role="status"
          className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md"
        >
          확인 메일을 보냈습니다. 새 이메일 함의 링크를 클릭해 변경을 완료해주세요.
        </div>
      )}
      {status.kind === "error" && (
        <div role="alert" className="text-sm text-red-600">
          {status.message}
        </div>
      )}
      <Button type="submit" disabled={status.kind === "loading"}>
        {status.kind === "loading" ? "전송 중..." : "확인 메일 보내기"}
      </Button>
    </form>
  )
}
