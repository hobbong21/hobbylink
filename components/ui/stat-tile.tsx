import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Stat widget used on dashboards and marketing pages. Distinct from a
 * generic Card in that it leans into numeric display (tabular-nums,
 * deliberate size hierarchy) and stays hoverable when wrapped in a link.
 */
interface StatTileProps {
  label: ReactNode
  value: ReactNode
  icon?: ReactNode
  delta?: { value: ReactNode; direction: "up" | "down" | "flat" }
  href?: string
  footnote?: ReactNode
  tone?: "default" | "primary" | "warning" | "success"
  className?: string
}

const TONES: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "bg-card",
  primary: "bg-primary-muted/60 dark:bg-primary-muted/30",
  warning: "bg-[color-mix(in_oklch,var(--warning)_14%,var(--background))]",
  success: "bg-[color-mix(in_oklch,var(--success)_14%,var(--background))]",
}

export function StatTile({
  label,
  value,
  icon,
  delta,
  href,
  footnote,
  tone = "default",
  className,
}: StatTileProps) {
  const body = (
    <div
      className={cn(
        "group relative rounded-xl border border-border/80 p-4 transition",
        "hover:border-primary/40 hover:shadow-[0_1px_0_0_var(--border),0_18px_30px_-22px_color-mix(in_oklch,var(--primary)_40%,transparent)]",
        TONES[tone],
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        {icon && (
          <span className="text-muted-foreground/80 group-hover:text-primary transition-colors">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2 tabular-nums">
        <span className="text-2xl md:text-3xl font-semibold tracking-tight">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "text-xs font-medium",
              delta.direction === "up" && "text-[var(--success)]",
              delta.direction === "down" && "text-[var(--destructive)]",
              delta.direction === "flat" && "text-muted-foreground",
            )}
          >
            {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "–"}{" "}
            {delta.value}
          </span>
        )}
      </div>
      {footnote && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
          {footnote}
        </p>
      )}
      {href && (
        <ArrowUpRight
          aria-hidden="true"
          className="absolute top-3 right-3 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </div>
  )
  return href ? (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
      {body}
    </Link>
  ) : (
    body
  )
}
