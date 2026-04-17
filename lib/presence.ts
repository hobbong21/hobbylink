/**
 * Computes a human-friendly label from a `last_active_at` timestamp.
 * - Within 5 minutes → "온라인"
 * - Within 60 minutes → "방금 전"
 * - Within 24 hours → "X시간 전"
 * - Otherwise → "YYYY-MM-DD"
 */
export function presenceLabel(lastActiveAt: string | null | undefined): {
  label: string
  /** Whether the user should be rendered as online (green dot). */
  isOnline: boolean
} {
  if (!lastActiveAt) return { label: "오프라인", isOnline: false }
  const now = Date.now()
  const ts = new Date(lastActiveAt).getTime()
  if (Number.isNaN(ts)) return { label: "오프라인", isOnline: false }

  const deltaMs = now - ts
  if (deltaMs < 0) return { label: "온라인", isOnline: true }
  if (deltaMs <= 5 * 60_000) return { label: "온라인", isOnline: true }
  if (deltaMs <= 60 * 60_000) {
    return { label: `${Math.floor(deltaMs / 60_000)}분 전`, isOnline: false }
  }
  if (deltaMs <= 24 * 60 * 60_000) {
    return { label: `${Math.floor(deltaMs / (60 * 60_000))}시간 전`, isOnline: false }
  }
  const d = new Date(lastActiveAt)
  return {
    label: d.toLocaleDateString("ko-KR"),
    isOnline: false,
  }
}
