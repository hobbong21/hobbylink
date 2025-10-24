"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { Languages } from "lucide-react"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <Button variant="ghost" size="sm" onClick={() => setLanguage(language === "ko" ? "en" : "ko")} className="gap-2">
      <Languages className="w-4 h-4" />
      <span className="text-sm font-medium">{language === "ko" ? "EN" : "KO"}</span>
    </Button>
  )
}
