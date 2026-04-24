'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

/**
 * Thin wrapper around next-themes ThemeProvider that avoids the React 19
 * hydration mismatch.
 *
 * next-themes@0.4.x uses a module-level `J = typeof window === "undefined"`
 * constant to guard localStorage reads inside the useState initializer.
 * During Next.js SSR the module runs in Node.js (J=true → initial state =
 * undefined). During client hydration the same module runs in the browser
 * (J=false → initial state = localStorage value). React 19 re-evaluates
 * useState initialisers during hydration, detects the mismatch, and throws.
 *
 * The mounted guard keeps the tree identical between SSR and the first
 * client render (both just render {children} with no NextThemesProvider),
 * so hydration always succeeds. After the first paint the real provider
 * mounts and the context becomes available.
 *
 * FOIT (flash-of-incorrect-theme) is prevented by the inline <script> that
 * app/layout.tsx injects into <head> — it runs synchronously before React
 * hydrates and applies the correct class to <html>.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
