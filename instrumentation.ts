/**
 * Next.js instrumentation hook (App Router).
 *
 * Runs once at server boot. We kick off Sentry init here so any exception
 * thrown during SSR is captured from the very first request.
 *
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
}
