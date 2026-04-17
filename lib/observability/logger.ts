/**
 * Structured logger wrapper.
 *
 * Writes JSON-line logs to stdout in production for easy ingestion by log
 * aggregators (Vercel, Datadog, etc). In development, falls back to the
 * standard console for readability.
 *
 * Also forwards `error` and `fatal` events to Sentry when configured.
 */

type Level = "debug" | "info" | "warn" | "error" | "fatal"

interface LogContext {
  [key: string]: unknown
}

function write(level: Level, message: string, context?: LogContext) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...context,
  }

  if (process.env.NODE_ENV === "production") {
    // Single JSON line, predictable shape.
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload))
  } else {
    const method =
      level === "error" || level === "fatal"
        ? "error"
        : level === "warn"
          ? "warn"
          : "log"
    // eslint-disable-next-line no-console
    console[method](`[${level}]`, message, context ?? "")
  }

  if ((level === "error" || level === "fatal") && typeof globalThis !== "undefined") {
    // Sentry integration (optional). If @sentry/nextjs is installed and
    // initialized, prefer its captureException for the stack trace.
    const sentry = (globalThis as { Sentry?: { captureMessage?: (m: string, opts?: unknown) => void } })
      .Sentry
    sentry?.captureMessage?.(message, { level, extra: context })
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => write("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => write("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => write("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => write("error", msg, ctx),
  fatal: (msg: string, ctx?: LogContext) => write("fatal", msg, ctx),
}
