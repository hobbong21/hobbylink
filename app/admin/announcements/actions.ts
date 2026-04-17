"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const Schema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(1000),
  variant: z.enum(["info", "warning", "success"]).default("info"),
  link_url: z.string().url().optional().nullable(),
  link_label: z.string().trim().max(60).optional().nullable(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional().nullable(),
})

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, admin: false as const, user: null }
  const { data: p } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()
  return { supabase, admin: !!p?.is_admin, user }
}

export async function createAnnouncement(formData: FormData) {
  const { supabase, admin, user } = await requireAdmin()
  if (!admin || !user) return { ok: false as const, message: "권한이 없습니다" }

  const parsed = Schema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    variant: formData.get("variant") ?? "info",
    link_url: formData.get("link_url") || null,
    link_label: formData.get("link_label") || null,
    starts_at: formData.get("starts_at") || undefined,
    ends_at: formData.get("ends_at") || null,
  })
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다",
    }
  }

  const { error } = await supabase.from("announcements").insert({
    title: parsed.data.title,
    body: parsed.data.body,
    variant: parsed.data.variant,
    link_url: parsed.data.link_url ?? null,
    link_label: parsed.data.link_label ?? null,
    starts_at: parsed.data.starts_at
      ? new Date(parsed.data.starts_at).toISOString()
      : new Date().toISOString(),
    ends_at: parsed.data.ends_at
      ? new Date(parsed.data.ends_at).toISOString()
      : null,
    created_by: user.id,
  })
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/admin/announcements")
  revalidatePath("/", "layout")
  return { ok: true as const }
}

export async function deleteAnnouncement(id: string) {
  const { supabase, admin } = await requireAdmin()
  if (!admin) return { ok: false as const, message: "권한이 없습니다" }

  const { error } = await supabase.from("announcements").delete().eq("id", id)
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/admin/announcements")
  revalidatePath("/", "layout")
  return { ok: true as const }
}
