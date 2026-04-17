"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const Schema = z.object({
  visibility: z.enum(["public", "connections", "private"]),
})

export async function updateVisibility(value: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  const parsed = Schema.safeParse({ visibility: value })
  if (!parsed.success) {
    return { ok: false as const, message: "올바른 값이 아닙니다" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      visibility: parsed.data.visibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/settings/privacy")
  revalidatePath(`/profile/${user.id}`)
  return { ok: true as const }
}
