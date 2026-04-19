"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { generateApiKey } from "@/lib/api-keys"

const NameSchema = z.string().trim().min(1, "이름을 입력해주세요").max(60)
const MAX_KEYS_PER_USER = 5

export async function createApiKey(formData: FormData) {
  const nameRes = NameSchema.safeParse(formData.get("name"))
  if (!nameRes.success) {
    return { ok: false as const, message: nameRes.error.issues[0].message }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  // Cap active keys per user to keep things manageable.
  const { count } = await supabase
    .from("api_keys")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("revoked_at", null)
  if ((count ?? 0) >= MAX_KEYS_PER_USER) {
    return {
      ok: false as const,
      message: `활성 키는 최대 ${MAX_KEYS_PER_USER}개까지 생성할 수 있습니다. 사용하지 않는 키를 먼저 폐기하세요.`,
    }
  }

  const key = generateApiKey()
  const { error } = await supabase.from("api_keys").insert({
    user_id: user.id,
    name: nameRes.data,
    key_prefix: key.prefix,
    key_hash: key.hash,
    tier: "free",
    scopes: ["public:read"],
  })
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/settings/api-keys")
  return { ok: true as const, raw: key.raw }
}

export async function revokeApiKey(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/settings/api-keys")
  return { ok: true as const }
}
