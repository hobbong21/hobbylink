/**
 * Load the current matching scorer weights. Admin-tunable via
 * /admin/matching. Falls back to the shipped defaults if the row hasn't been
 * created yet (e.g. migration 043 not applied) or on any query error — so
 * matching never breaks because of a missing config table.
 */
import { createClient } from "@/lib/supabase/server"

export interface MatchTuning {
  overlap_weight: number
  location_exact_bonus: number
  location_region_bonus: number
  recency_48h_bonus: number
  recency_7d_bonus: number
}

export const DEFAULT_TUNING: MatchTuning = {
  overlap_weight: 100,
  location_exact_bonus: 10,
  location_region_bonus: 5,
  recency_48h_bonus: 8,
  recency_7d_bonus: 3,
}

export async function getMatchTuning(): Promise<MatchTuning> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("match_tuning")
      .select(
        "overlap_weight, location_exact_bonus, location_region_bonus, recency_48h_bonus, recency_7d_bonus",
      )
      .eq("id", "current")
      .maybeSingle()
    if (!data) return DEFAULT_TUNING
    return data as MatchTuning
  } catch {
    return DEFAULT_TUNING
  }
}
