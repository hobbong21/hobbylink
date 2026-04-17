"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function bulkSuspend(idsText: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()
  if (!profile?.is_admin) return { ok: false as const, message: "권한이 없습니다" }

  const ids = Array.from(
    new Set(
      idsText
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter((t) => UUID_RE.test(t)),
    ),
  )
  if (ids.length === 0) return { ok: false as const, message: "유효한 UUID가 없습니다" }
  if (ids.length > 500) return { ok: false as const, message: "최대 500개까지 처리합니다" }

  const { error } = await supabase
    .from("profiles")
    .update({ is_suspended: true, updated_at: new Date().toISOString() })
    .in("id", ids)

  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/admin/users")
  return { ok: true as const, count: ids.length }
}
