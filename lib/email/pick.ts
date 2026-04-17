import { newMatchEmail, eventReminderEmail } from "./templates"
import { newMatchEmailEn, eventReminderEmailEn } from "./templates-en"

export type EmailLocale = "ko" | "en"

export function pickMatchEmail(locale: EmailLocale, args: Parameters<typeof newMatchEmail>[0]) {
  return locale === "en" ? newMatchEmailEn(args) : newMatchEmail(args)
}

export function pickEventReminderEmail(
  locale: EmailLocale,
  args: Parameters<typeof eventReminderEmail>[0],
) {
  return locale === "en" ? eventReminderEmailEn(args) : eventReminderEmail(args)
}

/**
 * Naive Accept-Language / user-preference resolver. Falls back to Korean.
 * Can be upgraded later to read the recipient's `language` column once that
 * column is added.
 */
export function resolveLocaleFromUserMeta(raw?: string | null): EmailLocale {
  if (!raw) return "ko"
  const lower = raw.toLowerCase()
  if (lower.startsWith("en")) return "en"
  return "ko"
}
