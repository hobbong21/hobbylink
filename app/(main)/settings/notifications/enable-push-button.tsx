"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { registerPushSubscription } from "@/lib/push/register"

export function EnablePushButton() {
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "ok" } | { kind: "error"; message: string }
  >({ kind: "idle" })
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    setBusy(true)
    const r = await registerPushSubscription()
    setBusy(false)
    if (r.ok) setStatus({ kind: "ok" })
    else setStatus({ kind: "error", message: r.message ?? "요청 실패" })
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={onClick} disabled={busy} className="gap-2">
        <Bell aria-hidden="true" className="w-4 h-4" />
        {busy ? "등록 중..." : "브라우저 푸시 알림 켜기"}
      </Button>
      {status.kind === "ok" && (
        <p role="status" className="text-xs text-green-700">
          푸시 알림이 활성화되었습니다.
        </p>
      )}
      {status.kind === "error" && (
        <p role="alert" className="text-xs text-red-600">
          {status.message}
        </p>
      )}
    </div>
  )
}
