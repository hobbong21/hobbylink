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
})

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
  })

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다" }
  }

  const iso = new Date(parsed.data.event_date).toISOString()
  if (new Date(iso).getTime() < Date.now()) {
    return { ok: false, message: "과거 시간은 선택할 수 없습니다" }
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      location_address: parsed.data.location_address || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      event_date: iso,
      organizer_id: user.id,
      hobby_id: parsed.data.hobby_id || null,
      max_participants: parsed.data.max_participants || null,
    })
    .select("id")
    .single()

  if (error || !data) return { ok: false, message: error?.message ?? "생성에 실패했습니다" }

  revalidatePath("/events")
  return { ok: true, eventId: data.id }
}

export async function joinEvent(eventId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Check capacity
  const { data: ev } = await supabase
    .from("events")
    .select("max_participants, current_participants")
    .eq("id", eventId)
    .single()
  if (!ev) return { ok: false as const, message: "모임을 찾을 수 없습니다" }

  const isFull =
    ev.max_participants !== null &&
    (ev.current_participants ?? 0) >= ev.max_participants

  // Full → waitlist instead of rejecting.
  const status = isFull ? "waitlisted" : "registered"

  const { error } = await supabase.from("event_participants").upsert(
    { event_id: eventId, user_id: user.id, status },
    { onConflict: "event_id,user_id" },
  )
  if (error) return { ok: false as const, message: error.message }

  revalidatePath(`/events/${eventId}`)
  revalidatePath("/events")
  return { ok: true as const, status }
}

export async function cancelEvent(eventId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "로그인이 필요합니다" }

  // RLS enforces organizer_id = auth.uid().
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("organizer_id", user.id)
  if (error) return { ok: false as const, message: error.message }

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

  // Accept → auto-register participant
  if (action === "accept") {
    await supabase
      .from("event_participants")
      .upsert(
        { event_id: invitation.event_id, user_id: user.id, status: "registered" },
        { onConflict: "event_id,user_id" },
      )
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
