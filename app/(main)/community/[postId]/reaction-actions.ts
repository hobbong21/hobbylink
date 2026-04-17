"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Reaction = "like" | "love" | "laugh" | "wow" | "sad" | "clap"

export async function toggleReaction(
  postId: string,
  reaction: Reaction,
  nextOn: boolean,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  if (nextOn) {
    const { error } = await supabase.from("post_reactions").upsert(
      { post_id: postId, user_id: user.id, reaction },
      { onConflict: "post_id,user_id,reaction" },
    )
    if (error) return { ok: false as const, message: error.message }
  } else {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .eq("reaction", reaction)
    if (error) return { ok: false as const, message: error.message }
  }

  revalidatePath(`/community/${postId}`)
  return { ok: true as const }
}
