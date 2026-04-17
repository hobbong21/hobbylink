"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ToggleResult {
  ok: boolean
  message?: string
}

export async function toggleInterest(hobbyId: string, add: boolean): Promise<ToggleResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "로그인이 필요합니다" }

  if (add) {
    const { error } = await supabase
      .from("user_hobbies")
      .upsert(
        { user_id: user.id, hobby_id: hobbyId },
        { onConflict: "user_id,hobby_id" },
      )
    if (error) return { ok: false, message: error.message }
  } else {
    const { error } = await supabase
      .from("user_hobbies")
      .delete()
      .eq("user_id", user.id)
      .eq("hobby_id", hobbyId)
    if (error) return { ok: false, message: error.message }
  }

  revalidatePath("/interests")
  revalidatePath("/profile")
  revalidatePath("/matching")
  return { ok: true }
}
