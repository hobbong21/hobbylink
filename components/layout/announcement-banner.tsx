import { createClient } from "@/lib/supabase/server"
import { DismissButton } from "./announcement-dismiss"
import type { Tables } from "@/lib/database.types"

/**
 * Renders the highest-priority (most recent, not dismissed) active
 * announcement at the top of the page. Returns null when nothing to show.
 */
export async function AnnouncementBanner() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: rows } = await supabase
    .from("announcements")
    .select("*")
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order("starts_at", { ascending: false })
    .limit(5)

  const announcements = (rows ?? []) as Tables<"announcements">[]
  if (announcements.length === 0) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let dismissedIds = new Set<string>()
  if (user) {
    const { data } = await supabase
      .from("announcement_dismissals")
      .select("announcement_id")
      .eq("user_id", user.id)
      .in(
        "announcement_id",
        announcements.map((a) => a.id),
      )
    dismissedIds = new Set((data ?? []).map((r) => r.announcement_id))
  }

  const visible = announcements.find((a) => !dismissedIds.has(a.id))
  if (!visible) return null

  const colorClass = {
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100",
    warning:
      "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100",
    success:
      "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
  }[visible.variant]

  return (
    <div
      className={`border-b ${colorClass} text-sm`}
      role="status"
      aria-live="polite"
    >
      <div className="container mx-auto px-4 py-2 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium">{visible.title}</p>
          <p className="text-xs opacity-90 mt-0.5 whitespace-pre-line">
            {visible.body}
          </p>
          {visible.link_url && (
            <a
              href={visible.link_url}
              className="inline-block text-xs font-medium underline mt-1"
              target={
                visible.link_url.startsWith("http") ? "_blank" : undefined
              }
              rel={
                visible.link_url.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              {visible.link_label ?? "자세히 보기"} →
            </a>
          )}
        </div>
        {user && <DismissButton announcementId={visible.id} />}
      </div>
    </div>
  )
}
