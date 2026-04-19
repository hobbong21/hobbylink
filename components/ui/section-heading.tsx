import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * In-page heading used between cards/sections inside a page. Keeps the
 * typographic scale consistent across dashboard widgets, admin screens,
 * and marketing sections.
 */
interface SectionHeadingProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  align?: "left" | "center"
  as?: "h2" | "h3"
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as = "h2",
  className,
}: SectionHeadingProps) {
  const Heading = as
  return (
    <div
      className={cn(
        "space-y-2",
        align === "center" && "text-center mx-auto max-w-2xl",
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "inline-flex items-center gap-2 text-xs uppercase tracking-wider font-medium",
            "text-primary/80 dark:text-primary",
          )}
        >
          {eyebrow}
        </p>
      )}
      <Heading
        className={cn(
          as === "h2"
            ? "text-2xl md:text-3xl font-semibold tracking-tight"
            : "text-xl md:text-2xl font-semibold tracking-tight",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
