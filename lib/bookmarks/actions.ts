"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type BookmarkTarget = "post" | "event"

export async function toggleBookmark(
  targetType: BookmarkTarget,
  targetId: string,
  nextSaved: boolean,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  if (nextSaved) {
    const { error } = await supabase.from("bookmarks").upsert(
      { user_id: user.id, target_type: targetType, target_id: targetId },
      { onConflict: "user_id,target_type,target_id" },
    )
    if (error) return { ok: false as const, message: error.message }
  } else {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
    if (error) return { ok: false as const, message: error.message }
  }

  revalidatePath("/bookmarks")
  if (targetType === "post") revalidatePath(`/community/${targetId}`)
  else revalidatePath(`/events/${targetId}`)
  return { ok: true as const }
}
