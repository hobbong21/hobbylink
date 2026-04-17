import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { extractHashtags } from "@/lib/tags"

type Supa = SupabaseClient<Database>

/**
 * Parse hashtags from a post's content and ensure `post_tags` reflects them.
 * Uses the `get_or_create_tag` Postgres function (see scripts/015_tags.sql)
 * to upsert tag rows atomically.
 *
 * Safe to call on both create and update — existing links for removed tags
 * are deleted.
 */
export async function syncPostTags(
  supabase: Supa,
  postId: string,
  content: string,
) {
  const names = extractHashtags(content)

  if (names.length === 0) {
    // No tags — just clear any existing links.
    await supabase.from("post_tags").delete().eq("post_id", postId)
    return { ok: true as const, tagCount: 0 }
  }

  // Upsert tag rows via the helper function, one call per unique tag.
  const tagIds: string[] = []
  for (const name of names) {
    const { data, error } = await supabase.rpc("get_or_create_tag", { p_name: name })
    if (error) continue
    if (typeof data === "string") tagIds.push(data)
  }

  if (tagIds.length === 0) return { ok: false as const, message: "태그 생성 실패" }

  // Replace the post's tag links.
  await supabase.from("post_tags").delete().eq("post_id", postId)
  await supabase
    .from("post_tags")
    .insert(tagIds.map((tag_id) => ({ post_id: postId, tag_id })))

  return { ok: true as const, tagCount: tagIds.length }
}
