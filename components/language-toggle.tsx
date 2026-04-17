"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { createClient } from "@/lib/supabase/client"
import { Languages } from "lucide-react"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  const toggle = async () => {
    const next = language === "ko" ? "en" : "ko"
    setLanguage(next)
    // Mirror into a cookie so server components can read the same preference.
    if (typeof document !== "undefined") {
      const maxAge = 60 * 60 * 24 * 365
      document.cookie = `NEXT_LOCALE=${next}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
    }
    // If authenticated, persist the choice to profiles.language so
    // transactional emails can pick the right template.
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from("profiles")
          .update({ language: next, updated_at: new Date().toISOString() })
          .eq("id", user.id)
      }
    } catch {
      // Best-effort: never block the UI toggle on DB errors.
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-2"
      aria-label={language === "ko" ? "Switch to English" : "한국어로 전환"}
    >
      <Languages aria-hidden="true" className="w-4 h-4" />
      <span className="text-sm font-medium">{language === "ko" ? "EN" : "KO"}</span>
    </Button>
  )
}
