"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavItem {
  href: string
  label: string
}

interface SiteNavProps {
  items: NavItem[]
}

export function SiteNav({ items }: SiteNavProps) {
  const pathname = usePathname()

  return (
    <nav className="hidden items-center gap-6 md:flex">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "text-sm font-medium text-foreground hover:text-primary transition-colors"
                : "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
