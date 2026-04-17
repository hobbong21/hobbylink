import { cookies, headers } from "next/headers"
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./types"

/**
 * Resolves the current locale for server components.
 * Reads an explicit `NEXT_LOCALE` cookie first, then falls back to the
 * Accept-Language header, then DEFAULT_LOCALE.
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get("NEXT_LOCALE")?.value
  if (fromCookie && SUPPORTED_LOCALES.includes(fromCookie as Locale)) {
    return fromCookie as Locale
  }
  const h = await headers()
  const accept = h.get("accept-language")
  if (accept) {
    for (const part of accept.split(",")) {
      const code = part.trim().split(";")[0]?.split("-")[0].toLowerCase()
      if (code && SUPPORTED_LOCALES.includes(code as Locale)) return code as Locale
    }
  }
  return DEFAULT_LOCALE
}
