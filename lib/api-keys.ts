/**
 * API key helpers. We use `hbl_` as a prefix so leaked keys are trivially
 * greppable (à la GitHub's `ghp_`, Stripe's `sk_`).
 *
 * Raw form shown to the user exactly once:
 *   hbl_<base32-26chars>      → 30 chars total, ~130 bits entropy
 *
 * Stored form:
 *   - key_prefix = first 8 chars of the raw key (for UI display)
 *   - key_hash   = sha256 hex of the full raw key
 */
import { createHash, randomBytes } from "node:crypto"

const PREFIX = "hbl_"
const RAW_BYTES = 16 // 16 bytes → 32 hex chars → plenty of entropy

export interface NewApiKey {
  /** Raw key to show to the user once. Never store this. */
  raw: string
  /** First 8 chars, safe to display forever. */
  prefix: string
  /** sha256(raw) in hex. Store this. */
  hash: string
}

export function generateApiKey(): NewApiKey {
  const raw = PREFIX + randomBytes(RAW_BYTES).toString("hex")
  const prefix = raw.slice(0, 8)
  const hash = createHash("sha256").update(raw).digest("hex")
  return { raw, prefix, hash }
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex")
}

export const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  // Per key, per minute.
  free: { limit: 60, windowMs: 60_000 },
  pro: { limit: 600, windowMs: 60_000 },
}
