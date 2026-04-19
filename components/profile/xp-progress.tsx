/**
 * Compact XP → next-level progress bar.
 * Pure presentational component; pass in total xp.
 */
import { levelProgress } from "@/lib/levels"
import { cn } from "@/lib/utils"
import { LevelBadge } from "./level-badge"

interface XpProgressProps {
  xp: number
  className?: string
  /** Hides the numeric "12 / 80 xp" caption when true. */
  compact?: boolean
}

export function XpProgress({ xp, className, compact = false }: XpProgressProps) {
  const p = levelProgress(xp ?? 0)
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <LevelBadge level={p.level} />
        {!compact && (
          <span className="text-muted-foreground">
            {p.inLevel.toLocaleString()} / {p.needed.toLocaleString()} xp
          </span>
        )}
      </div>
      <div
        className="h-2 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={p.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`레벨 ${p.level + 1}까지 ${p.percent}% 진행`}
      >
        <div
          className="h-full bg-amber-500 transition-all"
          style={{ width: `${p.percent}%` }}
        />
      </div>
      {!compact && (
        <p className="text-[11px] text-muted-foreground">
          다음 레벨까지 {p.toNext.toLocaleString()} xp 남음
        </p>
      )}
    </div>
  )
}
