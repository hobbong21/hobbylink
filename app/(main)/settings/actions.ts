"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const AvatarUrlSchema = z
  .string()
  .url()
  .refine((u) => {
    // Only allow URLs from our Supabase Storage to prevent URL injection.
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supaUrl) return false
    try {
      return new URL(u).origin === new URL(supaUrl).origin
    } catch {
      return false
    }
  }, "올바른 업로드 URL이 아닙니다")

export async function updateAvatarUrl(url: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  const parsed = AvatarUrlSchema.safeParse(url)
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "올바른 URL이 아닙니다",
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: parsed.data, updated_at: new Date().toISOString() })
    .eq("id", user.id)
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/profile")
  revalidatePath("/settings")
  return { ok: true as const }
}

const ProfileSchema = z.object({
  display_name: z.string().trim().min(1, "이름을 입력하세요").max(50, "이름이 너무 깁니다"),
  bio: z.string().trim().max(280, "자기소개는 280자 이내로 작성하세요").optional().default(""),
  location: z.string().trim().max(100, "지역이 너무 깁니다").optional().default(""),
})

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; message: string }

export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: "로그인이 필요합니다" }
  }

  const parsed = ProfileSchema.safeParse({
    display_name: formData.get("display_name"),
    bio: formData.get("bio"),
    location: formData.get("location"),
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      bio: parsed.data.bio || null,
      location: parsed.data.location || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    return { ok: false, message: error.message }
  }

  revalidatePath("/profile")
  revalidatePath("/settings")
  return { ok: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

/**
 * Deletes the caller's own account. Relies on a server-only privileged client
 * (service role) since auth.admin.deleteUser requires elevated privileges.
 * For this to work, the caller must be authenticated; we verify that first,
 * then use the service role client to remove the auth user. The profile row
 * cascades via the FK.
 */
export async function deleteOwnAccount(): Promise<UpdateProfileResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, message: "로그인이 필요합니다" }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    return {
      ok: false,
      message: "계정 삭제는 서버 설정이 완료된 후 이용 가능합니다. 관리자에게 문의하세요.",
    }
  }

  // Lazy import to avoid bundling service-role client into the main chunk
  const { createClient: createAdminClient } = await import("@supabase/supabase-js")
  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { ok: false, message: error.message }

  await supabase.auth.signOut()
  redirect("/")
}
