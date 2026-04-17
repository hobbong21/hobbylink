"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

const SendSchema = z.object({
  receiver_id: z.string().uuid(),
  content: z.string().trim().min(1, "메시지를 입력하세요").max(2000),
})

export type SendResult = { ok: true } | { ok: false; message: string }

export async function sendMessage(formData: FormData): Promise<SendResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "로그인이 필요합니다" }

  // Rate limit: 30 messages per minute per user.
  const rl = await rateLimit({ key: `msg:${user.id}`, limit: 30, windowMs: 60_000 })
  if (!rl.allowed) {
    return { ok: false, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }
  }

  const parsed = SendSchema.safeParse({
    receiver_id: formData.get("receiver_id"),
    content: formData.get("content"),
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다" }
  }

  if (parsed.data.receiver_id === user.id) {
    return { ok: false, message: "자기 자신에게는 메시지를 보낼 수 없습니다" }
  }

  // Require an accepted match to prevent message spam between strangers.
  const { data: mutual } = await supabase
    .from("matches")
    .select("id")
    .eq("status", "accepted")
    .or(
      `and(user_id.eq.${user.id},matched_user_id.eq.${parsed.data.receiver_id}),and(user_id.eq.${parsed.data.receiver_id},matched_user_id.eq.${user.id})`,
    )
    .maybeSingle()

  if (!mutual) {
    return { ok: false, message: "매칭된 사용자에게만 메시지를 보낼 수 있습니다" }
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    receiver_id: parsed.data.receiver_id,
    content: parsed.data.content,
  })
  if (error) return { ok: false, message: error.message }

  revalidatePath(`/messages/${parsed.data.receiver_id}`)
  revalidatePath("/messages")
  return { ok: true }
}

export async function markThreadRead(peerId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", user.id)
    .eq("sender_id", peerId)
    .eq("is_read", false)

  revalidatePath("/messages")
  return { ok: true }
}
