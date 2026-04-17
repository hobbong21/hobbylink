import { describe, it, expect, beforeEach } from "vitest"
import { rateLimit } from "@/lib/rate-limit"

// These tests exercise the in-memory path (no Upstash env vars).

describe("rateLimit (in-memory)", () => {
  const opts = (key: string) => ({ key, limit: 3, windowMs: 10_000 })

  beforeEach(() => {
    // Each test uses a unique key to isolate state in the shared store.
  })

  it("allows up to the limit", async () => {
    const k = `t1-${Date.now()}`
    const results = [
      await rateLimit(opts(k)),
      await rateLimit(opts(k)),
      await rateLimit(opts(k)),
    ]
    expect(results.every((r) => r.allowed)).toBe(true)
    expect(results[2].remaining).toBe(0)
  })

  it("denies when limit exceeded", async () => {
    const k = `t2-${Date.now()}`
    for (let i = 0; i < 3; i++) await rateLimit(opts(k))
    const blocked = await rateLimit(opts(k))
    expect(blocked.allowed).toBe(false)
  })

  it("isolates counts per key", async () => {
    const a = `t3a-${Date.now()}`
    const b = `t3b-${Date.now()}`
    for (let i = 0; i < 3; i++) await rateLimit(opts(a))
    const bFirst = await rateLimit(opts(b))
    expect(bFirst.allowed).toBe(true)
  })
})
