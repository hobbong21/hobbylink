import type { ReactNode } from "react"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { SkipLink } from "@/components/layout/skip-link"
import { MobileNav } from "@/components/layout/mobile-nav"
import { createClient } from "@/lib/supabase/server"
import { ReferralCapture } from "@/components/referral-capture"
import { AnnouncementBanner } from "@/components/layout/announcement-banner"
import { KeyboardHelp } from "@/components/layout/keyboard-help"
import { PresenceHeartbeat } from "@/components/layout/presence-heartbeat"
import { Suspense } from "react"

export default async function MainLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkipLink />
      <SiteHeader />
      {/* Non-blocking announcement fetch */}
      <Suspense fallback={null}>
        <AnnouncementBanner />
      </Suspense>
      <div
        id="main-content"
        // Extra bottom padding on mobile so fixed nav doesn't cover content.
        className="flex-1 outline-none pb-16 md:pb-0"
        tabIndex={-1}
      >
        {children}
      </div>
      <SiteFooter minimal />
      <MobileNav showMessages={!!user} showProfile={!!user} />
      <Suspense fallback={null}>
        <ReferralCapture hasSession={!!user} />
      </Suspense>
      <KeyboardHelp />
      <PresenceHeartbeat hasSession={!!user} />
    </div>
  )
}
