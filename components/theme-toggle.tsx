"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

/**
 * Simple light/dark toggle. Renders nothing on the server to avoid hydration
 * mismatch (system theme is unknown until after mount).
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0" aria-hidden="true">
        <Sun className="w-4 h-4" />
      </Button>
    )
  }

  const current = theme === "system" ? resolvedTheme : theme
  const next = current === "dark" ? "light" : "dark"

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(next)}
      className="w-9 h-9 p-0"
      aria-label={next === "dark" ? "다크 모드로 전환" : "라이트 모드로 전환"}
    >
      {current === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </Button>
  )
}
