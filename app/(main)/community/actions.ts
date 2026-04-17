"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"
import { syncPostTags } from "@/lib/posts/tag-sync"

const PostSchema = z.object({
  content: z.string().trim().min(1, "내용을 입력하세요").max(5000),
  image_url: z
    .string()
    .url()
    .refine(
      (url) => {
        const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!supaUrl) return false
        try {
          return new URL(url).origin === new URL(supaUrl).origin
        } catch {
          return false
        }
      },
      { message: "올바른 이미지 URL이 아닙니다" },
    )
    .optional()
    .nullable(),
})

export type NewPostResult = { ok: true; id: string } | { ok: false; message: string }

export async function createPost(formData: FormData): Promise<NewPostResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "로그인이 필요합니다" }

  const rl = await rateLimit({ key: `post:${user.id}`, limit: 20, windowMs: 60 * 60_000 })
  if (!rl.allowed) return { ok: false, message: "요청이 너무 많습니다" }

  const parsed = PostSchema.safeParse({
    content: formData.get("content"),
    image_url: formData.get("image_url") || null,
  })
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다" }
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content: parsed.data.content,
      image_url: parsed.data.image_url ?? null,
    })
    .select("id")
    .single()
  if (error || !data) return { ok: false, message: error?.message ?? "생성 실패" }

  // Sync hashtags from content.
  await syncPostTags(supabase, data.id, parsed.data.content)

  revalidatePath("/community")
  revalidatePath("/feed")
  return { ok: true, id: data.id }
}

const UpdatePostSchema = z.object({
  post_id: z.string().uuid(),
  content: z.string().trim().min(1).max(5000),
})

export async function updatePost(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  const parsed = UpdatePostSchema.safeParse({
    post_id: formData.get("post_id"),
    content: formData.get("content"),
  })
  if (!parsed.success) {
    return { ok: false as const, message: "입력이 올바르지 않습니다" }
  }

  // RLS enforces author_id = auth.uid() on update.
  const { error } = await supabase
    .from("posts")
    .update({
      content: parsed.data.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.post_id)
    .eq("author_id", user.id)
  if (error) return { ok: false as const, message: error.message }

  // Re-sync hashtags from the new content.
  await syncPostTags(supabase, parsed.data.post_id, parsed.data.content)

  revalidatePath(`/community/${parsed.data.post_id}`)
  revalidatePath("/community")
  return { ok: true as const }
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // RLS enforces author-only delete.
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id)
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/community")
  return { ok: true as const }
}
