"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const PrefsSchema = z.object({
  email_on_match: z.boolean(),
  email_on_new_message: z.boolean(),
  email_on_event_reminder: z.boolean(),
  inapp_on_follow: z.boolean(),
  play_sound: z.boolean(),
  vibrate: z.boolean(),
})

export type PrefsInput = z.infer<typeof PrefsSchema>

export async function updateNotificationPrefs(input: PrefsInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  const parsed = PrefsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, message: "입력이 올바르지 않습니다" }
  }

  const { error } = await supabase
    .from("notification_prefs")
    .upsert(
      { user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )

  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/settings/notifications")
  return { ok: true as const }
}
