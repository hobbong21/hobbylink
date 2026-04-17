"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, admin: false as const }
  const { data: p } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()
  return { supabase, admin: !!p?.is_admin }
}

const NewSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, "소문자 + 숫자 + 언더스코어만 가능"),
  description: z.string().trim().max(200).optional().default(""),
})

export async function createFlag(formData: FormData) {
  const { supabase, admin } = await requireAdmin()
  if (!admin) return { ok: false as const, message: "권한이 없습니다" }

  const parsed = NewSchema.safeParse({
    key: formData.get("key"),
    description: formData.get("description"),
  })
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다",
    }
  }

  const { error } = await supabase.from("feature_flags").insert({
    key: parsed.data.key,
    description: parsed.data.description || null,
  })
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/admin/flags")
  return { ok: true as const }
}

export async function updateFlag(
  key: string,
  patch: { enabled?: boolean; rollout_percent?: number },
) {
  const { supabase, admin } = await requireAdmin()
  if (!admin) return { ok: false as const, message: "권한이 없습니다" }

  const { error } = await supabase
    .from("feature_flags")
    .update({
      ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
      ...(patch.rollout_percent !== undefined
        ? { rollout_percent: Math.max(0, Math.min(100, patch.rollout_percent)) }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("key", key)
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/admin/flags")
  return { ok: true as const }
}

export async function deleteFlag(key: string) {
  const { supabase, admin } = await requireAdmin()
  if (!admin) return { ok: false as const, message: "권한이 없습니다" }

  const { error } = await supabase.from("feature_flags").delete().eq("key", key)
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/admin/flags")
  return { ok: true as const }
}
