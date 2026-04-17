"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { rateLimit } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/email/send"
import { newMatchEmail } from "@/lib/email/templates"
import { sendPushToUser } from "@/lib/push/send"

export type MatchAction = "like" | "pass"

export async function undoMatch(matchId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  // Only the caller's own rejected (pass) rows can be undone. We do this by
  // deleting the match record so the candidate re-enters the recommendation
  // pool the next time getMatchCandidates runs.
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId)
    .eq("user_id", user.id)
    .eq("status", "rejected")
  if (error) return { ok: false as const, message: error.message }

  revalidatePath("/matching")
  revalidatePath("/matching/history")
  return { ok: true as const }
}

export interface MatchActionResult {
  ok: boolean
  message?: string
  /** True if this like completed a mutual match. */
  mutual?: boolean
}

/**
 * Records a like/pass on a candidate. If the counterpart has already liked
 * the caller (`pending` record with user_id=candidate, matched_user_id=caller),
 * both rows flip to `accepted` creating a mutual match.
 */
export async function recordMatchAction(
  candidateId: string,
  action: MatchAction,
): Promise<MatchActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, message: "로그인이 필요합니다" }
  if (user.id === candidateId) return { ok: false, message: "자기 자신에게는 매칭할 수 없습니다" }

  // Rate limit: 100 swipes per 10 minutes per user.
  const rl = await rateLimit({ key: `match:${user.id}`, limit: 100, windowMs: 10 * 60_000 })
  if (!rl.allowed) {
    return { ok: false, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }
  }

  // Daily "like" quota: free = 10 / day, premium = unlimited.
  if (action === "like") {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("tier, status")
      .eq("user_id", user.id)
      .maybeSingle()
    const isPremium = sub?.tier === "premium" && sub.status === "active"
    if (!isPremium) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const { count } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["pending", "accepted"])
        .gte("created_at", todayStart.toISOString())
      if ((count ?? 0) >= 10) {
        return {
          ok: false,
          message:
            "오늘의 무료 좋아요를 모두 사용했습니다. 프리미엄을 구독하면 무제한입니다.",
        }
      }
    }
  }

  if (action === "pass") {
    const { error } = await supabase.from("matches").upsert(
      {
        user_id: user.id,
        matched_user_id: candidateId,
        status: "rejected",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,matched_user_id" },
    )
    if (error) return { ok: false, message: error.message }
    return { ok: true }
  }

  // Does the candidate already like me?
  const { data: reverse } = await supabase
    .from("matches")
    .select("id,status")
    .eq("user_id", candidateId)
    .eq("matched_user_id", user.id)
    .maybeSingle()

  const mutual = reverse?.status === "pending" || reverse?.status === "accepted"
  const newStatus = mutual ? "accepted" : "pending"

  const { error: insertError } = await supabase.from("matches").upsert(
    {
      user_id: user.id,
      matched_user_id: candidateId,
      status: newStatus,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,matched_user_id" },
  )
  if (insertError) return { ok: false, message: insertError.message }

  if (mutual && reverse) {
    await supabase
      .from("matches")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", reverse.id)

    // Fire-and-forget email + web push to both sides. Any failure is swallowed
    // so the match itself still succeeds.
    void notifyMutualMatch(user.id, candidateId)
    void pushMutualMatch(user.id, candidateId)
  }

  revalidatePath("/matching")
  return { ok: true, mutual }
}

/**
 * Sends match emails using the service-role admin client to look up emails
 * (anon client cannot fetch other users' emails). If SUPABASE_SERVICE_ROLE_KEY
 * is not configured, this silently no-ops.
 */
async function notifyMutualMatch(userAId: string, userBId: string) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceRoleKey || !supabaseUrl) return

    const { createClient: createAdminClient } = await import("@supabase/supabase-js")
    const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const [a, b, profA, profB] = await Promise.all([
      admin.auth.admin.getUserById(userAId),
      admin.auth.admin.getUserById(userBId),
      admin.from("profiles").select("display_name").eq("id", userAId).single(),
      admin.from("profiles").select("display_name").eq("id", userBId).single(),
    ])

    const emailA = a.data?.user?.email
    const emailB = b.data?.user?.email
    if (emailA && profB.data?.display_name) {
      const tpl = newMatchEmail({ peerName: profB.data.display_name, siteUrl })
      await sendEmail({
        to: emailA,
        subject: `${profB.data.display_name}님과 매칭되었어요`,
        ...tpl,
      })
    }
    if (emailB && profA.data?.display_name) {
      const tpl = newMatchEmail({ peerName: profA.data.display_name, siteUrl })
      await sendEmail({
        to: emailB,
        subject: `${profA.data.display_name}님과 매칭되었어요`,
        ...tpl,
      })
    }
  } catch {
    // Email failures must not break the match flow.
  }
}

async function pushMutualMatch(userAId: string, userBId: string) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
    await Promise.all([
      sendPushToUser(userAId, {
        title: "새로운 매칭 🎉",
        body: "서로 관심을 표현했어요. 지금 대화를 시작해보세요.",
        url: `${siteUrl}/matches`,
      }),
      sendPushToUser(userBId, {
        title: "새로운 매칭 🎉",
        body: "서로 관심을 표현했어요. 지금 대화를 시작해보세요.",
        url: `${siteUrl}/matches`,
      }),
    ])
  } catch {
    // ignore
  }
}
