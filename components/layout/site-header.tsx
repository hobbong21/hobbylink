import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/server"
import { SiteNav } from "./site-nav"
import { NotificationBell } from "./notification-bell"
import { SearchButton } from "./search-button"
import { UserMenu } from "./user-menu"
import type { Tables } from "@/lib/database.types"

interface SiteHeaderProps {
  minimal?: boolean
}

const PUBLIC_NAV = [
  { href: "/explore", label: "탐색" },
  { href: "/matching", label: "매칭" },
  { href: "/community", label: "커뮤니티" },
  { href: "/events", label: "모임" },
]

const AUTH_NAV = [
  ...PUBLIC_NAV,
  { href: "/feed", label: "피드" },
  { href: "/messages", label: "메시지" },
]

export async function SiteHeader({ minimal = false }: SiteHeaderProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null = null
  let isPremium = false

  if (user) {
    const [{ data: profileRow }, { data: subRow }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("user_id", user.id)
        .maybeSingle(),
    ])
    profile = profileRow as typeof profile
    isPremium = subRow?.tier === "premium" && subRow.status === "active"
  }

  const navItems = user ? AUTH_NAV : PUBLIC_NAV

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80 flex-shrink-0"
        >
          <Image
            src="/hobbylink-logo.png"
            alt="HobbyLink"
            width={120}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {!minimal && <SiteNav items={navItems} />}

        <div className="flex items-center gap-1">
          <SearchButton />
          <ThemeToggle />
          <LanguageToggle />
          {user && <NotificationBell />}
          {user ? (
            <UserMenu
              displayName={profile?.display_name ?? user.email ?? "사용자"}
              email={user.email ?? ""}
              avatarUrl={profile?.avatar_url ?? null}
              isPremium={isPremium}
            />
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">로그인</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">회원가입</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
