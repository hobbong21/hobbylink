"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Compass,
  Heart,
  CalendarDays,
  MessageCircle,
  User,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/explore", label: "탐색", icon: Compass },
  { href: "/matching", label: "매칭", icon: Heart },
  { href: "/events", label: "모임", icon: CalendarDays },
  { href: "/messages", label: "메시지", icon: MessageCircle },
  { href: "/profile", label: "내 정보", icon: User },
] as const

interface MobileNavProps {
  showMessages: boolean
  showProfile: boolean
  /** If true, inserts a central FAB-like "모임 열기" button between items. */
  showCreate?: boolean
}

/**
 * Bottom navigation for narrow screens. Uses an iOS-style segmented look
 * with a raised active indicator and room for a central "Create" action.
 *
 * Layout rules:
 *   - Safe-area aware (padding-bottom respects notches)
 *   - Max 5 items; if `showCreate` is on we reserve the middle slot for it
 *   - Icons have 44x44 tap targets minimum for accessibility
 */
export function MobileNav({
  showMessages,
  showProfile,
  showCreate = true,
}: MobileNavProps) {
  const pathname = usePathname() ?? ""

  const visible = items.filter((item) => {
    if (item.href === "/messages") return showMessages
    if (item.href === "/profile") return showProfile
    return true
  })

  // Split around the middle so we can insert a create button.
  const pivot = Math.ceil(visible.length / 2)
  const left = visible.slice(0, pivot)
  const right = visible.slice(pivot)

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40"
      aria-label="주요 내비게이션"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="border-t border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <ul className="flex items-stretch">
          {left.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}

          {showCreate && showMessages && (
            <li className="flex items-center justify-center px-2">
              <Link
                href="/events/new"
                aria-label="모임 만들기"
                className={cn(
                  "relative -top-3 w-12 h-12 rounded-full",
                  "bg-primary text-primary-foreground",
                  "shadow-[0_8px_20px_-4px_color-mix(in_oklch,var(--primary)_50%,transparent)]",
                  "flex items-center justify-center transition-transform active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <Plus className="w-6 h-6" aria-hidden="true" />
              </Link>
            </li>
          )}

          {right.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}
        </ul>
      </div>
    </nav>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string
  label: string
  icon: typeof Compass
  pathname: string
}) {
  const isActive = pathname === href || pathname.startsWith(href + "/")
  return (
    <li className="flex-1">
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-0.5 py-2.5",
          "min-h-[56px] text-muted-foreground transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          isActive && "text-primary",
        )}
      >
        {/* Active pill indicator */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-4 top-1 h-1 rounded-full transition-all",
            isActive ? "bg-primary opacity-100" : "opacity-0",
          )}
        />
        <Icon
          aria-hidden="true"
          className={cn(
            "w-5 h-5 transition-transform",
            isActive && "scale-110",
          )}
        />
        <span
          className={cn(
            "text-[10px] font-medium leading-none",
            isActive && "font-semibold",
          )}
        >
          {label}
        </span>
      </Link>
    </li>
  )
}
