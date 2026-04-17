/**
 * Rate limiter.
 *
 * Default implementation is an in-memory sliding window — fine for a single
 * Node instance (local dev, single-region deploy). For multi-region Vercel
 * or horizontally scaled setups, set `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` to switch to a Redis-backed fixed window that
 * works across every serverless instance.
 *
 * Usage:
 *
 *   const ok = await rateLimit({
 *     key: `send-msg:${userId}`,
 *     limit: 30,
 *     windowMs: 60_000,
 *   })
 *   if (!ok.allowed) return { error: "너무 많은 요청" }
 */

export interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// --------------------------------------------------------------------------
// In-memory backend (default)
// --------------------------------------------------------------------------

interface Bucket {
  count: number
  resetAt: number
}

const memStore = new Map<string, Bucket>()

function memoryLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const bucket = memStore.get(key)

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs
    memStore.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }
  bucket.count += 1
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
}

if (typeof setInterval !== "undefined" && process.env.NODE_ENV !== "test") {
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of memStore) {
      if (v.resetAt < now) memStore.delete(k)
    }
  }, 60_000).unref?.()
}

// --------------------------------------------------------------------------
// Upstash Redis backend (opt-in via env)
// --------------------------------------------------------------------------

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

async function upstashLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  // Pipeline: INCR + (PEXPIRE only on first increment). Upstash returns an
  // array of results; on INCR=1 we set TTL in the same pipeline.
  const pipeline = [
    ["INCR", `rl:${key}`],
    ["PEXPIRE", `rl:${key}`, windowMs.toString(), "NX"],
    ["PTTL", `rl:${key}`],
  ]
  const resp = await fetch(`${upstashUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pipeline),
  })
  if (!resp.ok) {
    // Fallback: deny-open (allow) so we don't accidentally lock users out on
    // transient Redis failures. Log so the issue is visible.
    // eslint-disable-next-line no-console
    console.warn("[rate-limit] upstash error", resp.status)
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs }
  }
  const body = (await resp.json()) as Array<{ result: number | string }>
  const count = Number(body[0]?.result ?? 0)
  const ttlMs = Number(body[2]?.result ?? windowMs)
  const resetAt = Date.now() + Math.max(0, ttlMs)
  if (count > limit) {
    return { allowed: false, remaining: 0, resetAt }
  }
  return { allowed: true, remaining: Math.max(0, limit - count), resetAt }
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Overloaded signature — sync when using the in-memory backend, async when
 * using Upstash. Callers can always `await` to get a consistent shape.
 */
export function rateLimit(opts: RateLimitOptions): RateLimitResult | Promise<RateLimitResult> {
  if (upstashUrl && upstashToken) return upstashLimit(opts)
  return memoryLimit(opts)
}
