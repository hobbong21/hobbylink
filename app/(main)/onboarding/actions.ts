"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const OnboardSchema = z.object({
  display_name: z.string().trim().min(1).max(50),
  location: z.string().trim().max(100).optional().default(""),
  hobby_ids: z.array(z.string().uuid()).min(3, "관심사를 3개 이상 선택해주세요").max(20),
})

export type OnboardResult = { ok: true } | { ok: false; message: string }

export async function completeOnboarding(input: {
  display_name: string
  location: string
  hobby_ids: string[]
}): Promise<OnboardResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "로그인이 필요합니다" }

  const parsed = OnboardSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다" }
  }

  // 1) Update profile
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      location: parsed.data.location || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
  if (profileErr) return { ok: false, message: profileErr.message }

  // 2) Replace hobbies.
  // Delete existing, then insert new. This is a small list so batch is fine.
  await supabase.from("user_hobbies").delete().eq("user_id", user.id)
  const { error: insertErr } = await supabase.from("user_hobbies").insert(
    parsed.data.hobby_ids.map((hobby_id) => ({
      user_id: user.id,
      hobby_id,
    })),
  )
  if (insertErr) return { ok: false, message: insertErr.message }

  revalidatePath("/profile")
  revalidatePath("/matching")
  redirect("/matching")
}
