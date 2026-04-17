import { describe, it, expect } from "vitest"
import { presenceLabel } from "@/lib/presence"

describe("presenceLabel", () => {
  it("treats missing timestamp as offline", () => {
    expect(presenceLabel(null).isOnline).toBe(false)
    expect(presenceLabel(undefined).label).toBe("오프라인")
  })

  it("marks very recent activity as online", () => {
    const recent = new Date(Date.now() - 30_000).toISOString()
    const { label, isOnline } = presenceLabel(recent)
    expect(isOnline).toBe(true)
    expect(label).toBe("온라인")
  })

  it("formats recent-but-stale times in minutes", () => {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60_000).toISOString()
    expect(presenceLabel(thirtyMinAgo).label).toMatch(/\d+분 전/)
  })

  it("falls back to date for old activity", () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString()
    expect(presenceLabel(weekAgo).isOnline).toBe(false)
    expect(presenceLabel(weekAgo).label).toMatch(/\d{4}/)
  })
})
