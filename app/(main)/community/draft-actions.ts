"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const Schema = z.object({ content: z.string().max(5000) })

export async function saveDraft(content: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const }

  const parsed = Schema.safeParse({ content })
  if (!parsed.success) return { ok: false as const }

  await supabase
    .from("post_drafts")
    .upsert(
      {
        user_id: user.id,
        content: parsed.data.content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

  return { ok: true as const }
}

export async function clearDraft() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const }
  await supabase.from("post_drafts").delete().eq("user_id", user.id)
  return { ok: true as const }
}

export async function loadDraft(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ""
  const { data } = await supabase
    .from("post_drafts")
    .select("content")
    .eq("user_id", user.id)
    .maybeSingle()
  return data?.content ?? ""
}
