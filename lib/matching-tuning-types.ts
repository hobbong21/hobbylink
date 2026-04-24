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
