/**
 * Sentry server-side initialization.
 *
 * Runs once per server instance (Next.js boot). Like the client config, this
 * is a no-op unless SENTRY_DSN is set and @sentry/nextjs is installed.
 *
 * When wiring up fully, ALSO update next.config.mjs:
 *
 *   import { withSentryConfig } from "@sentry/nextjs"
 *   export default withSentryConfig(nextConfig, {
 *     silent: true,
 *     org: process.env.SENTRY_ORG,
 *     project: process.env.SENTRY_PROJECT,
 *   })
 */

export async function initSentryServer() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return
  try {
    const Sentry = await import(/* webpackIgnore: true */ "@sentry/nextjs")
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_RATE ?? "0.1"),
    })
  } catch {
    // Skip
  }
}

// Kick off immediately on import so Next.js' instrumentation hook works.
void initSentryServer()
