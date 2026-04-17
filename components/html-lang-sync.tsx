"use client"

import { useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"

/**
 * Keeps <html lang="..."> in sync with the user's selected language.
 * Rendered inside <body> so it can access client-side language context,
 * but mutates document.documentElement to update the <html> attribute.
 */
export function HtmlLangSync() {
  const { language } = useLanguage()

  useEffect(() => {
    if (typeof document === "undefined") return
    document.documentElement.lang = language
  }, [language])

  return null
}
