"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

const ReportSchema = z.object({
  target_type: z.enum(["profile", "post", "comment", "event", "message"]),
  target_id: z.string().uuid(),
  reason: z.string().trim().min(1, "신고 사유를 입력하세요").max(500),
})

export type ActionResult = { ok: true } | { ok: false; message: string }

export async function submitReport(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "로그인이 필요합니다" }

  // Rate limit: 10 reports per hour per user.
  const rl = await rateLimit({ key: `report:${user.id}`, limit: 10, windowMs: 60 * 60_000 })
  if (!rl.allowed) {
    return { ok: false, message: "신고 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }
  }

  const parsed = ReportSchema.safeParse({
    target_type: formData.get("target_type"),
    target_id: formData.get("target_id"),
    reason: formData.get("reason"),
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다" }
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: parsed.data.target_type,
    target_id: parsed.data.target_id,
    reason: parsed.data.reason,
  })
  if (error) return { ok: false, message: error.message }

  return { ok: true }
}

export async function blockUser(targetId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "로그인이 필요합니다" }
  if (user.id === targetId) return { ok: false, message: "자기 자신은 차단할 수 없습니다" }

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: user.id,
    blocked_id: targetId,
  })
  if (error && !error.message.includes("duplicate key")) {
    return { ok: false, message: error.message }
  }

  // When a user is blocked, mark any active matches as rejected so they no
  // longer appear in match lists or can message.
  await supabase
    .from("matches")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .or(
      `and(user_id.eq.${user.id},matched_user_id.eq.${targetId}),and(user_id.eq.${targetId},matched_user_id.eq.${user.id})`,
    )

  revalidatePath("/matches")
  revalidatePath("/matching")
  revalidatePath("/messages")
  return { ok: true }
}

export async function unblockUser(targetId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "로그인이 필요합니다" }

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId)
  if (error) return { ok: false, message: error.message }

  revalidatePath("/settings/blocks")
  return { ok: true }
}
