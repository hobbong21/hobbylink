"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Compass,
  Heart,
  Users,
  MessageCircle,
  User,
} from "lucide-react"

const items = [
  { href: "/explore", label: "탐색", icon: Compass },
  { href: "/matching", label: "매칭", icon: Heart },
  { href: "/events", label: "모임", icon: Users },
  { href: "/messages", label: "메시지", icon: MessageCircle },
  { href: "/profile", label: "내 정보", icon: User },
]

interface MobileNavProps {
  showMessages: boolean
  showProfile: boolean
}

/**
 * Fixed bottom navigation for screens narrower than `md`. Hidden on desktop
 * where the header nav is visible. Only shows auth-gated items when
 * applicable.
 */
export function MobileNav({ showMessages, showProfile }: MobileNavProps) {
  const pathname = usePathname() ?? ""

  const visible = items.filter((item) => {
    if (item.href === "/messages") return showMessages
    if (item.href === "/profile") return showProfile
    return true
  })

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      aria-label="주요 내비게이션"
    >
      <ul className="flex">
        {visible.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "flex flex-col items-center justify-center gap-0.5 py-2 text-primary"
                    : "flex flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground"
                }
              >
                <Icon aria-hidden="true" className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
