"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { Languages } from "lucide-react"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  const toggle = () => {
    const next = language === "ko" ? "en" : "ko"
    setLanguage(next)
    // Mirror into a cookie so server components can read the same preference
    // via lib/i18n/server.ts.
    if (typeof document !== "undefined") {
      const maxAge = 60 * 60 * 24 * 365
      document.cookie = `NEXT_LOCALE=${next}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
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
