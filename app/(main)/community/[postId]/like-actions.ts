"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { rateLimit } from "@/lib/rate-limit"

export async function toggleLike(postId: string, nextLiked: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  const rl = await rateLimit({ key: `like:${user.id}`, limit: 60, windowMs: 60_000 })
  if (!rl.allowed) return { ok: false as const, message: "요청이 너무 많습니다" }

  if (nextLiked) {
    // Upsert (idempotent). The DB trigger from scripts/005 updates posts.likes_count.
    const { error } = await supabase
      .from("post_likes")
      .upsert({ post_id: postId, user_id: user.id }, { onConflict: "post_id,user_id" })
    if (error) return { ok: false as const, message: error.message }
  } else {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)
    if (error) return { ok: false as const, message: error.message }
  }

  revalidatePath(`/community/${postId}`)
  revalidatePath("/community")
  revalidatePath("/feed")
  return { ok: true as const }
}
