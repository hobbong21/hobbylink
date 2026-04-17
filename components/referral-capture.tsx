"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { recordReferral } from "@/lib/referrals/actions"

/**
 * Captures ?ref=<code> from the URL into sessionStorage on any page render.
 * When the user becomes authenticated, automatically records the referral
 * and clears the cache. Safe to include on every page — no-ops when there's
 * no code or no user.
 */
export function ReferralCapture({ hasSession }: { hasSession: boolean }) {
  const searchParams = useSearchParams()

  // 1. Stash a fresh code in sessionStorage the first time we see it.
  useEffect(() => {
    const code = searchParams.get("ref")
    if (code && typeof window !== "undefined") {
      try {
        sessionStorage.setItem("hl_ref", code)
      } catch {
        // storage may be blocked in private mode — ignore
      }
    }
  }, [searchParams])

  // 2. When authenticated, flush to the server.
  useEffect(() => {
    if (!hasSession || typeof window === "undefined") return
    const code = sessionStorage.getItem("hl_ref")
    if (!code) return
    void recordReferral(code).finally(() => {
      try {
        sessionStorage.removeItem("hl_ref")
      } catch {
        // ignore
      }
    })
  }, [hasSession])

  return null
}
