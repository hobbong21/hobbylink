"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const ReviewSchema = z.object({
  eventId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().default(""),
})

export type ReviewResult = { ok: true } | { ok: false; message: string }

export async function submitReview(input: {
  eventId: string
  rating: number
  comment: string
}): Promise<ReviewResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "로그인이 필요합니다" }

  const parsed = ReviewSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다" }
  }

  // Upsert — one review per (event, author), RLS enforces participation.
  const { error } = await supabase.from("event_reviews").upsert(
    {
      event_id: parsed.data.eventId,
      author_id: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
    { onConflict: "event_id,author_id" },
  )
  if (error) return { ok: false, message: error.message }

  revalidatePath(`/events/${parsed.data.eventId}`)
  return { ok: true }
}
