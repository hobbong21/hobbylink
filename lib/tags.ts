/**
 * Extracts hashtags from free-form text. Korean + English + digits are
 * accepted in tag names; tags are normalized to lowercase and deduped.
 * Max length 40 (matches the CHECK in scripts/015_tags.sql).
 *
 *   extractHashtags("이번주 #한강 #등산 GO!") → ["한강", "등산"]
 */
export function extractHashtags(text: string): string[] {
  if (!text) return []
  const seen = new Set<string>()
  const out: string[] = []
  const pattern = /#([\p{L}\p{N}_-]{1,40})/gu
  for (const match of text.matchAll(pattern)) {
    const name = match[1]?.toLowerCase()
    if (!name || seen.has(name)) continue
    seen.add(name)
    out.push(name)
  }
  return out
}
