"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Settings,
  Bell,
  Bookmark,
  LogOut,
  Sparkles,
  Calendar,
  Mail,
  Trophy,
  Gift,
  Home,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { XpProgress } from "@/components/profile/xp-progress"

interface UserMenuProps {
  displayName: string
  email: string
  avatarUrl: string | null
  isPremium: boolean
  xp?: number
  level?: number
}

export function UserMenu({
  displayName,
  email,
  avatarUrl,
  isPremium,
  xp = 0,
  level = 1,
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onLogout = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-2 rounded-md p-1 hover:bg-muted transition-colors"
        aria-label="계정 메뉴"
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src={avatarUrl ?? "/placeholder-user.jpg"} alt="" />
          <AvatarFallback>{displayName[0]?.toUpperCase() ?? "?"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          {isPremium && (
            <Sparkles aria-hidden="true" className="w-4 h-4 text-orange-500" />
          )}
        </DropdownMenuLabel>
        {(xp > 0 || level > 1) && (
          <div className="px-2 pb-2">
            <XpProgress xp={xp} compact />
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/home">
            <Home aria-hidden="true" className="w-4 h-4 mr-2" />내 홈
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User aria-hidden="true" className="w-4 h-4 mr-2" />내 프로필
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-events">
            <Calendar aria-hidden="true" className="w-4 h-4 mr-2" />내 모임
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/invitations">
            <Mail aria-hidden="true" className="w-4 h-4 mr-2" />
            받은 초대
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/bookmarks">
            <Bookmark aria-hidden="true" className="w-4 h-4 mr-2" />
            북마크
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/achievements">
            <Trophy aria-hidden="true" className="w-4 h-4 mr-2" />
            업적
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/invite">
            <Gift aria-hidden="true" className="w-4 h-4 mr-2" />
            친구 초대
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/notifications">
            <Bell aria-hidden="true" className="w-4 h-4 mr-2" />
            알림
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden="true" className="w-4 h-4 mr-2" />
            설정
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onLogout()
          }}
          disabled={isPending}
          className="text-destructive"
        >
          <LogOut aria-hidden="true" className="w-4 h-4 mr-2" />
          {isPending ? "로그아웃 중..." : "로그아웃"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
