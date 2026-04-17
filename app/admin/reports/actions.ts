"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null as null }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()
  if (!profile?.is_admin) return { supabase, user: null as null }
  return { supabase, user }
}

export async function resolveReport(
  reportId: string,
  status: "resolved" | "dismissed",
  notes?: string,
) {
  const { supabase, user } = await requireAdmin()
  if (!user) return { ok: false as const, message: "권한이 없습니다" }

  const { error } = await supabase
    .from("reports")
    .update({
      status,
      resolution_notes: notes ?? null,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId)

  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/admin/reports")
  return { ok: true as const }
}

export async function suspendUser(
  userId: string,
  until: string | null = null,
) {
  const { supabase, user } = await requireAdmin()
  if (!user) return { ok: false as const, message: "권한이 없습니다" }

  const { error } = await supabase
    .from("profiles")
    .update({
      is_suspended: true,
      suspended_until: until,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) return { ok: false as const, message: error.message }
  revalidatePath("/admin/users")
  return { ok: true as const }
}

export async function unsuspendUser(userId: string) {
  const { supabase, user } = await requireAdmin()
  if (!user) return { ok: false as const, message: "권한이 없습니다" }

  const { error } = await supabase
    .from("profiles")
    .update({
      is_suspended: false,
      suspended_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) return { ok: false as const, message: error.message }
  revalidatePath("/admin/users")
  return { ok: true as const }
}
