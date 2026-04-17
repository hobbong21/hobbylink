"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const HobbySchema = z.object({
  name: z.string().trim().min(1).max(50),
  category: z.string().trim().min(1).max(30),
  description: z.string().trim().max(500).optional().default(""),
  image_url: z.string().url().optional().nullable(),
  is_featured: z.boolean().default(false),
})

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, admin: false as const }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()
  return { supabase, admin: !!profile?.is_admin }
}

export async function createHobby(formData: FormData) {
  const { supabase, admin } = await requireAdmin()
  if (!admin) return { ok: false as const, message: "권한이 없습니다" }

  const parsed = HobbySchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    image_url: formData.get("image_url") || null,
    is_featured: formData.get("is_featured") === "on",
  })
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다",
    }
  }

  const { error } = await supabase.from("hobbies").insert({
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description || null,
    image_url: parsed.data.image_url ?? null,
    is_featured: parsed.data.is_featured,
  })
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/admin/hobbies")
  revalidatePath("/explore")
  return { ok: true as const }
}

export async function toggleHobbyFeatured(hobbyId: string, next: boolean) {
  const { supabase, admin } = await requireAdmin()
  if (!admin) return { ok: false as const, message: "권한이 없습니다" }

  const { error } = await supabase
    .from("hobbies")
    .update({ is_featured: next })
    .eq("id", hobbyId)
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/admin/hobbies")
  revalidatePath("/explore")
  return { ok: true as const }
}
