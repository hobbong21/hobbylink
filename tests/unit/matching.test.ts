import { describe, it, expect, vi } from "vitest"

// Mock the supabase server module BEFORE importing the unit under test.
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { getMatchCandidates } from "@/lib/matching"
import { createClient } from "@/lib/supabase/server"

interface FakeSupabase {
  from: (table: string) => FakeQuery
}

interface FakeQuery {
  select: (...args: unknown[]) => FakeQuery
  eq: (...args: unknown[]) => FakeQuery
  neq: (...args: unknown[]) => FakeQuery
  in: (...args: unknown[]) => FakeQuery
  order: (...args: unknown[]) => FakeQuery
  limit: (...args: unknown[]) => FakeQuery
  maybeSingle: () => Promise<{ data: unknown; error: null }>
  single: () => Promise<{ data: unknown; error: null }>
  then: (resolve: (v: { data: unknown; error: null }) => unknown) => Promise<unknown>
}

function makeQuery(data: unknown): FakeQuery {
  const q: Partial<FakeQuery> = {}
  q.select = () => q as FakeQuery
  q.eq = () => q as FakeQuery
  q.neq = () => q as FakeQuery
  q.in = () => q as FakeQuery
  q.order = () => q as FakeQuery
  q.limit = () => q as FakeQuery
  q.maybeSingle = async () => ({ data, error: null })
  q.single = async () => ({ data, error: null })
  q.then = (resolve) => Promise.resolve({ data, error: null }).then(resolve)
  return q as FakeQuery
}

describe("getMatchCandidates", () => {
  it("returns empty array when the user has no hobbies", async () => {
    const fake: FakeSupabase = {
      from: (table) => {
        if (table === "user_hobbies") return makeQuery([])
        return makeQuery([])
      },
    }
    vi.mocked(createClient).mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof createClient>>)
    const result = await getMatchCandidates("user-a", 10)
    expect(result).toEqual([])
  })

  it("returns [] when no other user shares a hobby", async () => {
    const tables: Record<string, unknown> = {
      user_hobbies_self: [{ hobby_id: "h1" }],
      user_hobbies_shared: [],
      matches: [],
    }
    let call = 0
    const fake: FakeSupabase = {
      from: (table) => {
        if (table === "user_hobbies") {
          const data = call++ === 0 ? tables.user_hobbies_self : tables.user_hobbies_shared
          return makeQuery(data)
        }
        if (table === "matches") return makeQuery(tables.matches)
        return makeQuery([])
      },
    }
    vi.mocked(createClient).mockResolvedValue(fake as unknown as Awaited<ReturnType<typeof createClient>>)
    const result = await getMatchCandidates("user-a", 10)
    expect(result).toEqual([])
  })
})
