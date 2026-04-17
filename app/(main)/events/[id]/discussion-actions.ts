"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

const Schema = z.object({
  event_id: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
})

export async function postDiscussionMessage(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  const rl = await rateLimit({
    key: `event-msg:${user.id}`,
    limit: 30,
    windowMs: 60_000,
  })
  if (!rl.allowed) return { ok: false as const, message: "요청이 너무 많습니다" }

  const parsed = Schema.safeParse({
    event_id: formData.get("event_id"),
    content: formData.get("content"),
  })
  if (!parsed.success) {
    return { ok: false as const, message: "입력이 올바르지 않습니다" }
  }

  // RLS enforces participant/organizer membership.
  const { error } = await supabase.from("event_messages").insert({
    event_id: parsed.data.event_id,
    author_id: user.id,
    content: parsed.data.content,
  })
  if (error) return { ok: false as const, message: error.message }

  revalidatePath(`/events/${parsed.data.event_id}`)
  return { ok: true as const }
}
