/**
 * Tiny static badge that shows a user's current level.
 * Presentation-only — the caller passes in the level (or the xp and we derive it).
 */
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import { computeLevel } from "@/lib/levels"
import { cn } from "@/lib/utils"

interface LevelBadgeProps {
  level?: number
  xp?: number
  className?: string
  showIcon?: boolean
}

export function LevelBadge({ level, xp, className, showIcon = true }: LevelBadgeProps) {
  const resolved = level ?? computeLevel(xp ?? 0)
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200",
        className,
      )}
      aria-label={`레벨 ${resolved}`}
    >
      {showIcon && <Sparkles aria-hidden="true" className="w-3 h-3" />}
      Lv. {resolved}
    </Badge>
  )
}
