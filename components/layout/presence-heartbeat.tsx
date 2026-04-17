"use client"

import { useEffect } from "react"

/**
 * Sends a lightweight POST /api/presence/heartbeat every 2 minutes while
 * the tab is visible. Fire-and-forget. No-op when not authenticated (the
 * endpoint responds 401 and we ignore).
 */
export function PresenceHeartbeat({ hasSession }: { hasSession: boolean }) {
  useEffect(() => {
    if (!hasSession) return

    const ping = () => {
      if (document.visibilityState !== "visible") return
      void fetch("/api/presence/heartbeat", {
        method: "POST",
        keepalive: true,
      }).catch(() => {
        // ignore — presence is best-effort
      })
    }

    ping() // immediate ping
    const interval = window.setInterval(ping, 2 * 60_000)

    const onVisible = () => {
      if (document.visibilityState === "visible") ping()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [hasSession])

  return null
}
