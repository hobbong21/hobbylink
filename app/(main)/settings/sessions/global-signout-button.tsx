"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function GlobalSignOutButton() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onClick = () => {
    if (!confirm("모든 기기에서 로그아웃할까요?")) return
    setError(null)
    startTransition(async () => {
      try {
        const supabase = createClient()
        // `global` scope invalidates every refresh token for this user
        // across every device / tab.
        const { error } = await supabase.auth.signOut({ scope: "global" })
        if (error) throw error
        router.push("/")
        router.refresh()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "실패")
      }
    })
  }

  return (
    <div className="space-y-2">
      {error && (
        <div role="alert" className="text-sm text-red-600">
          {error}
        </div>
      )}
      <Button variant="destructive" onClick={onClick} disabled={isPending}>
        {isPending ? "로그아웃 중..." : "모든 기기에서 로그아웃"}
      </Button>
    </div>
  )
}
