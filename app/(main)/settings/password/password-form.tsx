"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export function PasswordForm() {
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "ok" } | { kind: "error"; message: string } | { kind: "loading" }
  >({ kind: "idle" })
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setStatus({ kind: "error", message: "비밀번호는 최소 8자 이상이어야 합니다." })
      return
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setStatus({ kind: "error", message: "영문과 숫자를 모두 포함해야 합니다." })
      return
    }
    if (newPassword !== confirm) {
      setStatus({ kind: "error", message: "새 비밀번호가 일치하지 않습니다." })
      return
    }

    setStatus({ kind: "loading" })
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setStatus({ kind: "ok" })
      setNewPassword("")
      setConfirm("")
      setTimeout(() => router.push("/settings"), 1500)
    } catch (err: unknown) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "변경에 실패했습니다",
      })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new">새 비밀번호</Label>
        <Input
          id="new"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">새 비밀번호 확인</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      {status.kind === "error" && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
        >
          {status.message}
        </div>
      )}
      {status.kind === "ok" && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md"
        >
          비밀번호가 변경되었습니다. 잠시 후 설정 페이지로 이동합니다.
        </div>
      )}
      <Button type="submit" disabled={status.kind === "loading"}>
        {status.kind === "loading" ? "변경 중..." : "비밀번호 변경"}
      </Button>
    </form>
  )
}
