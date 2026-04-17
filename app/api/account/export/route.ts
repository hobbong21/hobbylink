import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GDPR-style account data export.
 * Returns a JSON bundle of everything tied to the calling user across the
 * core tables. Intended to be downloaded; Content-Disposition forces save.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, message: "로그인이 필요합니다" }, { status: 401 })
  }

  const uid = user.id

  const [
    profile,
    hobbies,
    matches,
    messages,
    posts,
    comments,
    bookmarks,
    follows,
    events,
    participations,
    photos,
    invitations,
    reviews,
    notifications,
    reports,
    subscriptions,
    achievements,
    prefs,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("user_hobbies").select("*, hobbies(name)").eq("user_id", uid),
    supabase
      .from("matches")
      .select("*")
      .or(`user_id.eq.${uid},matched_user_id.eq.${uid}`),
    supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`),
    supabase.from("posts").select("*").eq("author_id", uid),
    supabase.from("comments").select("*").eq("author_id", uid),
    supabase.from("bookmarks").select("*").eq("user_id", uid),
    supabase
      .from("follows")
      .select("*")
      .or(`follower_id.eq.${uid},followed_id.eq.${uid}`),
    supabase.from("events").select("*").eq("organizer_id", uid),
    supabase.from("event_participants").select("*").eq("user_id", uid),
    supabase.from("event_photos").select("*").eq("uploader_id", uid),
    supabase
      .from("event_invitations")
      .select("*")
      .or(`invitee_id.eq.${uid},inviter_id.eq.${uid}`),
    supabase.from("event_reviews").select("*").eq("author_id", uid),
    supabase.from("notifications").select("*").eq("user_id", uid),
    supabase.from("reports").select("*").eq("reporter_id", uid),
    supabase.from("subscriptions").select("*").eq("user_id", uid).maybeSingle(),
    supabase.from("user_achievements").select("*").eq("user_id", uid),
    supabase.from("notification_prefs").select("*").eq("user_id", uid).maybeSingle(),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    profile: profile.data,
    hobbies: hobbies.data,
    matches: matches.data,
    messages: messages.data,
    posts: posts.data,
    comments: comments.data,
    bookmarks: bookmarks.data,
    follows: follows.data,
    events_organized: events.data,
    event_participations: participations.data,
    event_photos: photos.data,
    event_invitations: invitations.data,
    event_reviews: reviews.data,
    notifications: notifications.data,
    reports_filed: reports.data,
    subscription: subscriptions.data,
    achievements: achievements.data,
    notification_prefs: prefs.data,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="hobbylink-export-${uid}-${Date.now()}.json"`,
      "Cache-Control": "no-store",
    },
  })
}
