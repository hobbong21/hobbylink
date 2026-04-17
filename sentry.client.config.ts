/**
 * Sentry client-side initialization.
 *
 * This file runs in the browser on app bootstrap. It's a no-op unless
 * NEXT_PUBLIC_SENTRY_DSN is set AND @sentry/nextjs is installed.
 *
 * To enable fully:
 *   1. pnpm add @sentry/nextjs
 *   2. Set NEXT_PUBLIC_SENTRY_DSN (and SENTRY_AUTH_TOKEN in CI for sourcemaps)
 *   3. Wrap next.config.mjs with withSentryConfig (see sentry.server.config.ts)
 */

export async function initSentryClient() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
  try {
    const Sentry = await import(/* webpackIgnore: true */ "@sentry/nextjs")
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_RATE ?? "0.1"),
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      integrations: [],
    })
  } catch {
    // Sentry SDK not installed — silently skip.
  }
}
