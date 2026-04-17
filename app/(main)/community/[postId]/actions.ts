"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

const CommentSchema = z.object({
  post_id: z.string().uuid(),
  content: z.string().trim().min(1, "댓글을 입력하세요").max(2000),
})

export type CommentResult = { ok: true; id: string } | { ok: false; message: string }

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
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다" }
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: parsed.data.post_id,
      author_id: user.id,
      content: parsed.data.content,
    })
    .select("id")
    .single()
  if (error || !data) return { ok: false, message: error?.message ?? "생성에 실패했습니다" }

  revalidatePath(`/community/${parsed.data.post_id}`)
  return { ok: true, id: data.id }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  // Fetch for revalidation path; RLS also enforces the ownership check.
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
