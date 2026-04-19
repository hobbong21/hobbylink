/**
 * Level/XP helpers — mirror the SQL formula in scripts/041_user_levels.sql.
 * Use on the client when we only have `xp` available and want to show the
 * progress bar toward the next level without a round-trip.
 */

/** xp required to reach `level` (1-based). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.pow(level - 1, 2) * 20
}

export function computeLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt((xp ?? 0) / 20)) + 1)
}

/** Returns how many xp the user has in the current level + how many total they need for the next. */
export function levelProgress(xp: number): {
  level: number
  inLevel: number
  needed: number
  percent: number
  toNext: number
} {
  const level = computeLevel(xp)
  const base = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const inLevel = Math.max(0, xp - base)
  const needed = Math.max(1, next - base)
  return {
    level,
    inLevel,
    needed,
    percent: Math.min(100, Math.round((inLevel / needed) * 100)),
    toNext: Math.max(0, next - xp),
  }
}
