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
} from "lucide-react"

const ADMIN_NAV = [
  { href: "/admin", label: "대시보드", icon: Activity, match: "exact" as const },
  { href: "/admin/analytics", label: "분석", icon: BarChart3, match: "prefix" as const },
  { href: "/admin/announcements", label: "공지사항", icon: Megaphone, match: "prefix" as const },
  { href: "/admin/flags", label: "피처 플래그", icon: ToggleLeft, match: "prefix" as const },
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
    <aside className="w-64 border-r border-border min-h-[calc(100vh-73px)] p-6">
      <nav className="space-y-2">
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
                  ? "flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
                  : "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
