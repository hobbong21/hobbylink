"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { DEFAULT_TUNING } from "@/lib/matching-tuning"

const TuningSchema = z.object({
  overlap_weight: z.coerce.number().int().min(0).max(500),
  location_exact_bonus: z.coerce.number().int().min(0).max(100),
  location_region_bonus: z.coerce.number().int().min(0).max(100),
  recency_48h_bonus: z.coerce.number().int().min(0).max(100),
  recency_7d_bonus: z.coerce.number().int().min(0).max(100),
})

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("로그인이 필요합니다")
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()
  if (!profile?.is_admin) throw new Error("관리자 권한이 필요합니다")
  return { supabase, userId: user.id }
}

export async function saveMatchTuning(formData: FormData) {
  const parsed = TuningSchema.safeParse({
    overlap_weight: formData.get("overlap_weight"),
    location_exact_bonus: formData.get("location_exact_bonus"),
    location_region_bonus: formData.get("location_region_bonus"),
    recency_48h_bonus: formData.get("recency_48h_bonus"),
    recency_7d_bonus: formData.get("recency_7d_bonus"),
  })
  if (!parsed.success) {
    return { ok: false as const, message: "값 범위가 올바르지 않습니다" }
  }

  const { supabase, userId } = await requireAdmin()

  // Upsert the singleton row.
  const { error } = await supabase
    .from("match_tuning")
    .upsert({
      id: "current",
      ...parsed.data,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/admin/matching")
  return { ok: true as const }
}

export async function resetMatchTuning() {
  const { supabase, userId } = await requireAdmin()
  const { error } = await supabase
    .from("match_tuning")
    .upsert({
      id: "current",
      ...DEFAULT_TUNING,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/admin/matching")
  return { ok: true as const }
}
