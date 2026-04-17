"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { rateLimit } from "@/lib/rate-limit"
import { sendPushToUser } from "@/lib/push/send"

export type FollowResult = { ok: true } | { ok: false; message: string }

export async function followUser(targetId: string): Promise<FollowResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "로그인이 필요합니다" }
  if (user.id === targetId) return { ok: false, message: "자기 자신은 팔로우할 수 없습니다" }

  const rl = await rateLimit({ key: `follow:${user.id}`, limit: 100, windowMs: 60 * 60_000 })
  if (!rl.allowed) return { ok: false, message: "요청이 너무 많습니다" }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, followed_id: targetId })
  if (error && !error.message.includes("duplicate key")) {
    return { ok: false, message: error.message }
  }

  // Best-effort push notification to the followed user.
  const { data: me } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  void sendPushToUser(targetId, {
    title: "새로운 팔로워",
    body: `${me?.display_name ?? "누군가"}님이 당신을 팔로우하기 시작했어요.`,
    url: `${siteUrl}/profile/${user.id}`,
  })

  revalidatePath(`/profile/${targetId}`)
  return { ok: true }
}

export async function unfollowUser(targetId: string): Promise<FollowResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "로그인이 필요합니다" }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followed_id", targetId)
  if (error) return { ok: false, message: error.message }

  revalidatePath(`/profile/${targetId}`)
  return { ok: true }
}
