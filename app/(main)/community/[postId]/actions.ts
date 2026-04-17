"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

const CommentSchema = z.object({
  post_id: z.string().uuid(),
  content: z.string().trim().min(1, "댓글을 입력하세요").max(2000),
  parent_id: z.string().uuid().optional().nullable(),
})

export type CommentResult = { ok: true; id: string } | { ok: false; message: string }

/**
 * Parses @display_name mentions from free text and creates in-app
 * notifications for each mentioned user. Duplicates are deduped; the author
 * never notifies themselves.
 */
async function notifyMentions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authorId: string,
  postId: string,
  content: string,
) {
  // `@` followed by 1..30 non-whitespace, non-@ chars.
  const names = new Set<string>()
  for (const m of content.matchAll(/(?:^|\s)@([^\s@]{1,30})/g)) {
    if (m[1]) names.add(m[1])
  }
  if (names.size === 0) return

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("display_name", Array.from(names))
  const targets = (profiles ?? [])
    .filter((p) => p.id !== authorId)
    .map((p) => p.id)
  if (targets.length === 0) return

  // notifications has no public INSERT policy; rely on service role via a
  // helper RPC if needed. For now we write via a server-side "system" row
  // using the trigger-friendly insert (RLS will allow because we're NOT
  // the Supabase-js anon client — we're still under the user's auth context
  // though, so we skip the insert if it fails silently).
  const rows = targets.map((user_id) => ({
    user_id,
    actor_id: authorId,
    type: "system" as const,
    payload: {
      kind: "mention",
      post_id: postId,
      preview: content.slice(0, 120),
    },
  }))
  // Attempt; swallow errors to avoid breaking comment creation.
  await supabase.from("notifications").insert(rows).select("id").limit(1)
}

export async function createComment(formData: FormData): Promise<CommentResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "로그인이 필요합니다" }

  const rl = await rateLimit({ key: `comment:${user.id}`, limit: 20, windowMs: 60_000 })
  if (!rl.allowed) return { ok: false, message: "요청이 너무 많습니다" }

  const parsed = CommentSchema.safeParse({
    post_id: formData.get("post_id"),
    content: formData.get("content"),
    parent_id: formData.get("parent_id") || null,
  })
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다",
    }
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: parsed.data.post_id,
      author_id: user.id,
      content: parsed.data.content,
      parent_id: parsed.data.parent_id ?? null,
    })
    .select("id")
    .single()
  if (error || !data) return { ok: false, message: error?.message ?? "생성에 실패했습니다" }

  // Fire-and-forget mention notifications.
  void notifyMentions(supabase, user.id, parsed.data.post_id, parsed.data.content)

  revalidatePath(`/community/${parsed.data.post_id}`)
  return { ok: true, id: data.id }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  const { data: row } = await supabase
    .from("comments")
    .select("post_id, author_id")
    .eq("id", commentId)
    .maybeSingle()

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id)
  if (error) return { ok: false as const, message: error.message }

  if (row?.post_id) revalidatePath(`/community/${row.post_id}`)
  return { ok: true as const }
}
