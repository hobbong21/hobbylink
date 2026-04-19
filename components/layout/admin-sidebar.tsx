"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  Users,
  Heart,
  MessageSquare,
  Calendar,
  Flag,
  Hash,
  Layers,
  BarChart3,
  Megaphone,
  ToggleLeft,
  ServerCog,
  ShieldAlert,
  FlaskConical,
  SlidersHorizontal,
} from "lucide-react"

const ADMIN_NAV = [
  { href: "/admin", label: "대시보드", icon: Activity, match: "exact" as const },
  { href: "/admin/analytics", label: "분석", icon: BarChart3, match: "prefix" as const },
  { href: "/admin/announcements", label: "공지사항", icon: Megaphone, match: "prefix" as const },
  { href: "/admin/flags", label: "피처 플래그", icon: ToggleLeft, match: "prefix" as const },
  { href: "/admin/experiments", label: "A/B 실험", icon: FlaskConical, match: "prefix" as const },
  { href: "/admin/matching", label: "매칭 튜닝", icon: SlidersHorizontal, match: "prefix" as const },
  { href: "/admin/risk", label: "위험 사용자", icon: ShieldAlert, match: "prefix" as const },
  { href: "/admin/system", label: "시스템 상태", icon: ServerCog, match: "prefix" as const },
  { href: "/admin/users", label: "사용자 관리", icon: Users, match: "prefix" as const },
  { href: "/admin/hobbies", label: "취미 관리", icon: Heart, match: "prefix" as const },
  { href: "/admin/posts", label: "게시글 관리", icon: MessageSquare, match: "prefix" as const },
  { href: "/admin/events", label: "이벤트 관리", icon: Calendar, match: "prefix" as const },
  { href: "/admin/tags", label: "태그 관리", icon: Hash, match: "prefix" as const },
  { href: "/admin/reports", label: "신고 관리", icon: Flag, match: "prefix" as const },
  { href: "/admin/bulk", label: "대량 작업", icon: Layers, match: "prefix" as const },
]

export function AdminSidebar() {
  const pathname = usePathname() ?? ""

  return (
    <aside className="w-60 border-r border-sidebar-border bg-sidebar min-h-[calc(100vh-73px)] p-4">
      <p className="px-3 pt-1 pb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Admin
      </p>
      <nav className="space-y-0.5">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon
          const isActive =
            item.match === "exact"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "flex items-center gap-2.5 px-3 py-2 rounded-md bg-sidebar-accent text-sidebar-accent-foreground font-medium text-sm"
                  : "flex items-center gap-2.5 px-3 py-2 rounded-md text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 text-sm transition-colors"
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {isActive && (
                <span className="ml-auto w-1 h-1 rounded-full bg-primary" aria-hidden="true" />
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
