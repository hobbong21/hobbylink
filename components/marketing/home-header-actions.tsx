"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/contexts/language-context"

export function HomeHeaderActions() {
  const { t } = useLanguage()
  return (
    <div className="flex items-center gap-2">
      <LanguageToggle />
      <Button variant="ghost" asChild className="hidden sm:inline-flex">
        <Link href="/login">{t("login")}</Link>
      </Button>
      <Button asChild>
        <Link href="/signup">{t("signup")}</Link>
      </Button>
    </div>
  )
}
