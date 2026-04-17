"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function dismissAnnouncement(announcementId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const }

  await supabase
    .from("announcement_dismissals")
    .upsert(
      { user_id: user.id, announcement_id: announcementId },
      { onConflict: "user_id,announcement_id" },
    )

  revalidatePath("/", "layout")
  return { ok: true as const }
}
