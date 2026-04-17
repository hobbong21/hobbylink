import Link from "next/link"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { BellRealtime } from "./bell-realtime"

/**
 * Server component that renders the bell icon with the current unread count.
 * A small client companion (<BellRealtime />) subscribes to Supabase Realtime
 * so the count bumps without a full page refresh, and optionally plays a
 * sound / vibrates based on the user's notification_prefs.
 */
export async function NotificationBell() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ count }, { data: prefs }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
    supabase
      .from("notification_prefs")
      .select("play_sound, vibrate")
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  const initial = count ?? 0

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors"
      aria-label={initial > 0 ? `알림 ${initial}개` : "알림"}
    >
      <Bell aria-hidden="true" className="w-5 h-5" />
      <BellRealtime
        userId={user.id}
        initialCount={initial}
        playSound={prefs?.play_sound ?? true}
        vibrate={prefs?.vibrate ?? false}
      />
    </Link>
  )
}
