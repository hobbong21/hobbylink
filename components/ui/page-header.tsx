import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Top-of-page header used by internal pages (dashboard, settings, admin,
 * detail screens). Provides a consistent title → description → toolbar
 * rhythm without forcing every page to re-roll its own spacing.
 *
 *   <PageHeader
 *     eyebrow="관리자"
 *     title="매칭 추천 튜닝"
 *     description="슬라이더를 조정하면 우측에서 점수가 재계산됩니다."
 *     actions={<Button>저장</Button>}
 *   />
 */
interface PageHeaderProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border/70 pb-6",
        "md:flex-row md:items-start md:justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex gap-4">
        {icon && (
          <div className="hidden sm:flex w-10 h-10 rounded-lg bg-primary-muted text-primary items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-sm md:text-[15px] text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 md:flex-shrink-0">
          {actions}
        </div>
      )}
    </header>
  )
}
