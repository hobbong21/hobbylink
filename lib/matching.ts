import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/database.types"

export interface Candidate {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  location: string | null
  interests: string[]
  common_interests: number
  match_score: number
}

/**
 * Returns up to `limit` candidates for `userId` whose hobbies overlap with
 * the caller's. Scoring is a naive (overlap / total) * 100 so the caller
 * can present a "매칭 점수" percentage.
 *
 * This uses multiple queries instead of a single RPC for simplicity. When
 * user counts grow, replace with a SQL function that computes overlap in
 * a single round-trip.
 */
export async function getMatchCandidates(
  userId: string,
  limit = 10,
): Promise<Candidate[]> {
  const supabase = await createClient()

  // 1) My hobby ids
  const { data: myHobbyRows } = await supabase
    .from("user_hobbies")
    .select("hobby_id")
    .eq("user_id", userId)
  const myHobbyIds = (myHobbyRows ?? []).map((r) => r.hobby_id)

  if (myHobbyIds.length === 0) return []

  // 2) Candidate user ids that share any hobby, excluding self
  const { data: sharers } = await supabase
    .from("user_hobbies")
    .select("user_id, hobby_id")
    .in("hobby_id", myHobbyIds)
    .neq("user_id", userId)

  // 3a) Users I've already acted on (like/pass) — exclude them
  const { data: actedRows } = await supabase
    .from("matches")
    .select("matched_user_id")
    .eq("user_id", userId)
  const actedIds = new Set((actedRows ?? []).map((r) => r.matched_user_id))

  // 3b) Users I've blocked OR who've blocked me — exclude symmetrically
  const [{ data: myBlocks }, { data: blockedBy }] = await Promise.all([
    supabase.from("user_blocks").select("blocked_id").eq("blocker_id", userId),
    supabase.from("user_blocks").select("blocker_id").eq("blocked_id", userId),
  ])
  const blockedIds = new Set<string>([
    ...((myBlocks ?? []).map((r) => r.blocked_id)),
    ...((blockedBy ?? []).map((r) => r.blocker_id)),
  ])

  // 3c) Suspended users
  // We'll filter after profile fetch since `sharers` only has user_ids.

  // Aggregate overlap count per candidate
  const overlap = new Map<string, number>()
  for (const row of sharers ?? []) {
    if (actedIds.has(row.user_id)) continue
    if (blockedIds.has(row.user_id)) continue
    overlap.set(row.user_id, (overlap.get(row.user_id) ?? 0) + 1)
  }

  if (overlap.size === 0) return []

  const candidateIds = Array.from(overlap.keys()).slice(0, limit * 3)

  // 4) Fetch profiles and their hobbies
  const [{ data: profiles }, { data: theirHobbies }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", candidateIds),
    supabase
      .from("user_hobbies")
      .select("user_id, hobbies(name)")
      .in("user_id", candidateIds),
  ])

  type HobbyRow = { user_id: string; hobbies: Pick<Tables<"hobbies">, "name"> | null }
  const hobbiesByUser = new Map<string, string[]>()
  for (const row of (theirHobbies ?? []) as HobbyRow[]) {
    const list = hobbiesByUser.get(row.user_id) ?? []
    if (row.hobbies?.name) list.push(row.hobbies.name)
    hobbiesByUser.set(row.user_id, list)
  }

  // Fetch the caller's own location so we can upweight same-region candidates.
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("location")
    .eq("id", userId)
    .maybeSingle()
  const myLocation = myProfile?.location?.toLowerCase().trim() ?? ""

  const totalMy = myHobbyIds.length
  const candidates: Candidate[] = (profiles ?? [])
    .filter((p: Tables<"profiles">) => !p.is_suspended)
    .map((p: Tables<"profiles">) => {
      const common = overlap.get(p.id) ?? 0
      const overlapScore = Math.min(100, Math.round((common / totalMy) * 100))

      // Location bonus: exact match +10, same first-token (예: 서울) +5.
      let locationBonus = 0
      const theirs = p.location?.toLowerCase().trim() ?? ""
      if (myLocation && theirs) {
        if (theirs === myLocation) locationBonus = 10
        else if (theirs.split(/\s+/)[0] === myLocation.split(/\s+/)[0])
          locationBonus = 5
      }

      return {
        id: p.id,
        display_name: p.display_name,
        bio: p.bio,
        avatar_url: p.avatar_url,
        location: p.location,
        interests: hobbiesByUser.get(p.id) ?? [],
        common_interests: common,
        match_score: Math.min(100, overlapScore + locationBonus),
      }
    })

  candidates.sort((a, b) => b.match_score - a.match_score)
  return candidates.slice(0, limit)
}
