/**
 * Circular progress ring used on matching candidate cards.
 * Pure SVG — no animation dep. Size/stroke configurable, default 64x4.
 *
 * Colors interpolate:
 *   < 40  → muted
 *   40-70 → warning
 *   ≥ 70  → primary
 */
import { cn } from "@/lib/utils"

interface ScoreRingProps {
  value: number
  size?: number
  stroke?: number
  className?: string
}

export function ScoreRing({
  value,
  size = 64,
  stroke = 4,
  className,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (clamped / 100) * c

  const tone =
    clamped >= 70
      ? "text-primary"
      : clamped >= 40
        ? "text-[color:var(--warning)]"
        : "text-muted-foreground"

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`매칭 점수 ${clamped}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn("transition-[stroke-dashoffset] duration-700", tone)}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center tabular-nums">
        <span className={cn("text-lg font-semibold leading-none", tone)}>
          {clamped}
        </span>
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
          match
        </span>
      </div>
    </div>
  )
}
