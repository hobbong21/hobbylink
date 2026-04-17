export type Locale = "ko" | "en"
export const SUPPORTED_LOCALES: Locale[] = ["ko", "en"]
export const DEFAULT_LOCALE: Locale = "ko"

export type Dictionary = Record<string, string | Record<string, string>>
