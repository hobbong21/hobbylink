"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const CreateEventSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요").max(100),
  description: z.string().trim().max(1000).optional().default(""),
  location: z.string().trim().max(200).optional().default(""),
  location_address: z.string().trim().max(500).optional().default(""),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  event_date: z.string().min(1, "일시를 선택하세요"),
  hobby_id: z.string().uuid().optional().nullable(),
  max_participants: z.coerce.number().int().min(2).max(10000).optional().nullable(),
  recurrence_frequency: z
    .enum(["weekly", "biweekly", "monthly"])
    .optional()
    .nullable(),
  recurrence_count: z.coerce.number().int().min(1).max(20).optional().nullable(),
})

/** Returns a date offset by `n` units based on the frequency. Monthly uses
 * calendar-aware arithmetic (handles 31→Feb 28 by falling back to last day). */
function addRecurrence(base: Date, freq: "weekly" | "biweekly" | "monthly", n: number) {
  const d = new Date(base.getTime())
  if (freq === "weekly") d.setDate(d.getDate() + 7 * n)
  else if (freq === "biweekly") d.setDate(d.getDate() + 14 * n)
  else if (freq === "monthly") {
    const target = new Date(d.getFullYear(), d.getMonth() + n, d.getDate())
    // If day-of-month overflowed, JS already rolled forward (e.g. Jan 31 + 1mo = Mar 3).
    // Clamp to last day of the target month for predictability.
    if (target.getMonth() !== (d.getMonth() + n) % 12 && target.getMonth() !== (d.getMonth() + n + 12) % 12) {
      target.setDate(0)
    }
    target.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds())
    return target
  }
  return d
}

export type CreateEventResult =
  | { ok: true; eventId: string }
  | { ok: false; message: string }

export async function createEvent(formData: FormData): Promise<CreateEventResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "로그인이 필요합니다" }

  const parsed = CreateEventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    location_address: formData.get("location_address"),
    latitude: formData.get("latitude") || null,
    longitude: formData.get("longitude") || null,
    event_date: formData.get("event_date"),
    hobby_id: formData.get("hobby_id") || null,
    max_participants: formData.get("max_participants") || null,
    recurrence_frequency: formData.get("recurrence_frequency") || null,
    recurrence_count: formData.get("recurrence_count") || null,
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다" }
  }

  const iso = new Date(parsed.data.event_date).toISOString()
  if (new Date(iso).getTime() < Date.now()) {
    return { ok: false, message: "과거 시간은 선택할 수 없습니다" }
  }

  const freq = parsed.data.recurrence_frequency ?? null
  const recurCount = Math.max(1, Math.min(20, parsed.data.recurrence_count ?? 1))

  // Build the list of events to insert. Non-recurring → 1 row. Recurring →
  // up to `recurCount` rows sharing a `series_id` (generated client-side).
  const seriesId =
    freq && recurCount > 1
      ? (globalThis.crypto?.randomUUID?.() ?? `s-${Date.now()}`)
      : null

  const base = new Date(iso)
  const rows = Array.from({ length: freq && recurCount > 1 ? recurCount : 1 }).map(
    (_, i) => ({
      title: parsed.data.title,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      location_address: parsed.data.location_address || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      event_date: (i === 0
        ? base
        : addRecurrence(base, freq!, i)
      ).toISOString(),
      organizer_id: user.id,
      hobby_id: parsed.data.hobby_id || null,
      max_participants: parsed.data.max_participants || null,
      series_id: seriesId,
      recurrence_frequency: freq,
    }),
  )

  const { data, error } = await supabase
    .from("events")
    .insert(rows)
    .select("id")

  if (error || !data || data.length === 0) {
    return { ok: false, message: error?.message ?? "생성에 실패했습니다" }
  }

  revalidatePath("/events")
  return { ok: true, eventId: data[0].id }
}

export async function joinEvent(eventId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Capacity check and registration are handled atomically by the
  // DB-level SECURITY DEFINER function; no direct table write here.
  const { data: rpcResult, error } = await supabase.rpc("join_event", {
    p_event_id: eventId,
  })
  if (error) return { ok: false as const, message: error.message }
  const result = rpcResult as { ok: boolean; status?: string; message?: string }
  if (!result.ok) return { ok: false as const, message: result.message ?? "참가 실패" }

  revalidatePath(`/events/${eventId}`)
  revalidatePath("/events")
  return { ok: true as const, status: result.status ?? "registered" }
}

export async function cancelEvent(
  eventId: string,
  opts: { scope?: "one" | "series" | "future" } = {},
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  const scope = opts.scope ?? "one"

  if (scope === "one") {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("organizer_id", user.id)
    if (error) return { ok: false as const, message: error.message }
  } else {
    const { data: anchor } = await supabase
      .from("events")
      .select("series_id, event_date")
      .eq("id", eventId)
      .maybeSingle()
    if (!anchor?.series_id) {
      return { ok: false as const, message: "시리즈 이벤트가 아닙니다" }
    }
    let q = supabase
      .from("events")
      .delete()
      .eq("series_id", anchor.series_id)
      .eq("organizer_id", user.id)
    if (scope === "future") q = q.gte("event_date", anchor.event_date)
    const { error } = await q
    if (error) return { ok: false as const, message: error.message }
  }

  revalidatePath("/events")
  revalidatePath("/my-events")
  return { ok: true as const }
}

export async function inviteUsersToEvent(eventId: string, inviteeIds: string[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  const unique = Array.from(new Set(inviteeIds.filter((id) => id && id !== user.id)))
  if (unique.length === 0) {
    return { ok: false as const, message: "초대할 사용자를 선택해주세요" }
  }
  if (unique.length > 50) {
    return { ok: false as const, message: "한 번에 최대 50명까지 초대할 수 있습니다" }
  }

  const rows = unique.map((invitee_id) => ({
    event_id: eventId,
    invitee_id,
    inviter_id: user.id,
  }))
  const { error } = await supabase
    .from("event_invitations")
    .upsert(rows, { onConflict: "event_id,invitee_id" })
  if (error) return { ok: false as const, message: error.message }

  revalidatePath(`/events/${eventId}`)
  return { ok: true as const, count: rows.length }
}

export async function respondToInvitation(
  invitationId: string,
  action: "accept" | "decline",
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  // Fetch the invitation to know which event it's for.
  const { data: invitation } = await supabase
    .from("event_invitations")
    .select("id, event_id, invitee_id, status")
    .eq("id", invitationId)
    .maybeSingle()
  if (!invitation || invitation.invitee_id !== user.id) {
    return { ok: false as const, message: "초대를 찾을 수 없습니다" }
  }

  const status = action === "accept" ? "accepted" : "declined"
  const { error } = await supabase
    .from("event_invitations")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", invitationId)
  if (error) return { ok: false as const, message: error.message }

  // Accept → register participant via the capacity-enforcing DB function.
  if (action === "accept") {
    const { data: rpcResult, error: joinError } = await supabase.rpc("join_event", {
      p_event_id: invitation.event_id,
    })
    if (joinError) return { ok: false as const, message: joinError.message }
    const joinData = rpcResult as { ok: boolean; status?: string; message?: string }
    if (!joinData?.ok) {
      return { ok: false as const, message: joinData?.message ?? "참가 등록 실패" }
    }
  }

  revalidatePath(`/events/${invitation.event_id}`)
  revalidatePath("/notifications")
  return { ok: true as const }
}

export async function leaveEvent(eventId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("event_participants")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("user_id", user.id)
  if (error) return { ok: false, message: error.message }

  revalidatePath(`/events/${eventId}`)
  revalidatePath("/events")
  return { ok: true }
}
