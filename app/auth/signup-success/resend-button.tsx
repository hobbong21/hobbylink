"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export function ResendVerificationButton() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "ok" } | { kind: "error"; message: string } | { kind: "loading" }
  >({ kind: "idle" })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus({ kind: "loading" })
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo:
            (typeof window !== "undefined" ? window.location.origin : "") + "/",
        },
      })
      if (error) throw error
      setStatus({ kind: "ok" })
    } catch (err: unknown) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "재발송에 실패했습니다",
      })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Input
        type="email"
        required
        placeholder="가입한 이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="이메일"
      />
      {status.kind === "error" && (
        <p role="alert" className="text-xs text-red-600">
          {status.message}
        </p>
      )}
      {status.kind === "ok" && (
        <p role="status" className="text-xs text-green-700">
          인증 메일을 다시 보냈습니다.
        </p>
      )}
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={status.kind === "loading" || !email}
        className="w-full"
      >
        {status.kind === "loading" ? "전송 중..." : "인증 메일 재발송"}
      </Button>
    </form>
  )
}
