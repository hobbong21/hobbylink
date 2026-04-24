/**
 * Next.js instrumentation hook (App Router).
 *
 * Runs once at server boot. We kick off Sentry init here so any exception
 * thrown during SSR is captured from the very first request.
 *
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Sentry import is gated behind DSN presence so the app boots cleanly on Replit when @sentry/nextjs isn't installed.
  if (process.env.NEXT_RUNTIME === "nodejs" && (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) {
    try {
      await import("./sentry.server.config")
    } catch (e) {
      console.warn("[instrumentation] Sentry init skipped:", (e as Error).message)
    }
  }
}
