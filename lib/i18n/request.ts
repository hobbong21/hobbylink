/**
 * next-intl request config.
 *
 * Picks the locale from the NEXT_LOCALE cookie (written by <LanguageToggle>)
 * or from Accept-Language as a fallback. Loads the matching JSON dictionary
 * from /messages/<locale>.json.
 *
 * Wire into next.config.mjs with:
 *
 *   import createNextIntlPlugin from 'next-intl/plugin'
 *   const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts')
 *   export default withNextIntl(nextConfig)
 */
import { getServerLocale } from "./server"
import { DEFAULT_LOCALE } from "./types"

// Runtime check — avoids hard failure if next-intl is not yet installed.
type RequestConfigReturn = {
  locale: string
  messages: Record<string, unknown>
}

export default async function getRequestConfig(): Promise<RequestConfigReturn> {
  const locale = await getServerLocale().catch(() => DEFAULT_LOCALE)
  const messages = await import(`../../messages/${locale}.json`)
    .then((m) => m.default ?? m)
    .catch(() => ({}))
  return { locale, messages }
}
