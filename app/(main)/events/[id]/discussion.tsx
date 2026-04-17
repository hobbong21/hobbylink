import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscussionClient } from "./discussion-client"
import type { Tables } from "@/lib/database.types"

interface DiscussionProps {
  eventId: string
  organizerId: string
  currentUserId: string | null
}

export async function Discussion({
  eventId,
  organizerId,
  currentUserId,
}: DiscussionProps) {
  const supabase = await createClient()

  // Gate: same logic as the RLS so we skip rendering the section entirely
  // for non-participants.
  let canParticipate = false
  if (currentUserId) {
    if (currentUserId === organizerId) canParticipate = true
    else {
      const { data } = await supabase
        .from("event_participants")
        .select("status")
        .eq("event_id", eventId)
        .eq("user_id", currentUserId)
        .maybeSingle()
      canParticipate = data?.status === "registered" || data?.status === "attended"
    }
  }

  if (!canParticipate) return null

  const { data: msgData } = await supabase
    .from("event_messages")
    .select("*, profiles:author_id(display_name, avatar_url)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })
    .limit(200)

  type Row = Tables<"event_messages"> & {
    profiles: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
  }
  const messages = (msgData ?? []) as Row[]

  return (
    <Card>
      <CardHeader>
        <CardTitle>참가자 대화</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <DiscussionClient
          eventId={eventId}
          currentUserId={currentUserId ?? ""}
          initialMessages={messages.map((m) => ({
            id: m.id,
            author_id: m.author_id,
            content: m.content,
            created_at: m.created_at,
            author_name: m.profiles?.display_name ?? "사용자",
            author_avatar: m.profiles?.avatar_url ?? null,
          }))}
        />
      </CardContent>
    </Card>
  )
}
