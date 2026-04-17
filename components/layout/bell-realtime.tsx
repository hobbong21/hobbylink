"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface BellRealtimeProps {
  userId: string
  initialCount: number
}

/**
 * Subscribes to INSERTs on `notifications` for this user and increments the
 * visible unread count. Absolute-positioned badge inside the bell link.
 */
export function BellRealtime({ userId, initialCount }: BellRealtimeProps) {
  const [count, setCount] = useState(initialCount)

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
        () => setCount((c) => c + 1),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

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
