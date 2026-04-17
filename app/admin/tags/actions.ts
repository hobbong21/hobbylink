"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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

export async function mergeTags(sourceName: string, targetName: string) {
  const { supabase, admin } = await requireAdmin()
  if (!admin) return { ok: false as const, message: "권한이 없습니다" }

  const src = sourceName.trim().toLowerCase()
  const tgt = targetName.trim().toLowerCase()
  if (!src || !tgt || src === tgt) {
    return { ok: false as const, message: "서로 다른 태그 이름을 입력하세요" }
  }

  const [{ data: source }, { data: target }] = await Promise.all([
    supabase.from("tags").select("id").eq("name", src).maybeSingle(),
    supabase.from("tags").select("id").eq("name", tgt).maybeSingle(),
  ])
  if (!source) return { ok: false as const, message: "원본 태그를 찾을 수 없습니다" }
  if (!target) return { ok: false as const, message: "대상 태그를 찾을 수 없습니다" }

  // Move all post/event links from source → target.
  // Use upsert semantics manually: delete conflicting rows first, then update.
  const { data: postLinks } = await supabase
    .from("post_tags")
    .select("post_id")
    .eq("tag_id", source.id)

  const { data: eventLinks } = await supabase
    .from("event_tags")
    .select("event_id")
    .eq("tag_id", source.id)

  // Remove any existing links to the target that would collide.
  if (postLinks && postLinks.length > 0) {
    await supabase
      .from("post_tags")
      .delete()
      .eq("tag_id", target.id)
      .in(
        "post_id",
        postLinks.map((r) => r.post_id),
      )
  }
  if (eventLinks && eventLinks.length > 0) {
    await supabase
      .from("event_tags")
      .delete()
      .eq("tag_id", target.id)
      .in(
        "event_id",
        eventLinks.map((r) => r.event_id),
      )
  }

  await supabase.from("post_tags").update({ tag_id: target.id }).eq("tag_id", source.id)
  await supabase.from("event_tags").update({ tag_id: target.id }).eq("tag_id", source.id)

  // Finally delete the source tag.
  const { error } = await supabase.from("tags").delete().eq("id", source.id)
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/admin/tags")
  return { ok: true as const }
}
