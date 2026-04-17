"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface BellRealtimeProps {
  userId: string
  initialCount: number
  playSound?: boolean
  vibrate?: boolean
}

/**
 * Subscribes to INSERTs on `notifications` for this user and increments the
 * visible unread count. Optionally plays a short WebAudio beep and/or
 * triggers the device vibration API on arrival.
 */
export function BellRealtime({
  userId,
  initialCount,
  playSound,
  vibrate,
}: BellRealtimeProps) {
  const [count, setCount] = useState(initialCount)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notif:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setCount((c) => c + 1)
          try {
            if (playSound) beep(audioCtxRef)
            if (vibrate && typeof navigator !== "undefined" && "vibrate" in navigator) {
              ;(navigator as Navigator).vibrate?.(120)
            }
          } catch {
            // Autoplay may be blocked; silently ignore.
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, playSound, vibrate])

  if (count <= 0) return null

  return (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-semibold"
    >
      {count > 99 ? "99+" : count}
    </span>
  )
}

function beep(ctxRef: React.MutableRefObject<AudioContext | null>) {
  const AC = (globalThis as { AudioContext?: typeof AudioContext }).AudioContext
  if (!AC) return
  if (!ctxRef.current) ctxRef.current = new AC()
  const ctx = ctxRef.current
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.22)
}
