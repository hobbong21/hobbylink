/**
 * Small pill shown next to display names when the user has completed phone
 * verification. Render conditionally — callers should only render the badge
 * when `phone_verified_at !== null`.
 */
import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerifiedBadgeProps {
  className?: string
  /** Shows text alongside the icon. Hidden by default to keep the pill compact. */
  showLabel?: boolean
}

export function VerifiedBadge({ className, showLabel = false }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-sky-700 dark:text-sky-300",
        className,
      )}
      aria-label="전화번호 인증된 사용자"
      title="전화번호 인증 완료"
    >
      <BadgeCheck className="w-4 h-4" aria-hidden="true" />
      {showLabel && <span>인증됨</span>}
    </span>
  )
}
