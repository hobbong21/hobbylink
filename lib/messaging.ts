import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/lib/database.types"

export interface Conversation {
  /** The other party in the conversation. */
  peer_id: string
  peer_display_name: string
  peer_avatar_url: string | null
  last_content: string
  last_created_at: string
  unread_count: number
}

/**
 * Returns the caller's conversation list grouped by the other party.
 * Implemented in application code for clarity; when message volume grows,
 * replace with a materialized view or Postgres function.
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  const supabase = await createClient()
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(500)

  if (!messages || messages.length === 0) return []

  const byPeer = new Map<
    string,
    { last: Tables<"messages">; unread: number }
  >()
  for (const m of messages as Tables<"messages">[]) {
    const peer = m.sender_id === userId ? m.receiver_id : m.sender_id
    const existing = byPeer.get(peer)
    if (!existing) {
      byPeer.set(peer, {
        last: m,
        unread: !m.is_read && m.receiver_id === userId ? 1 : 0,
      })
    } else if (!m.is_read && m.receiver_id === userId) {
      existing.unread += 1
    }
  }

  const peerIds = Array.from(byPeer.keys())
  if (peerIds.length === 0) return []

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", peerIds)

  type ProfileSlim = Pick<Tables<"profiles">, "id" | "display_name" | "avatar_url">
  const profileById = new Map<string, ProfileSlim>(
    ((profiles ?? []) as ProfileSlim[]).map((p) => [p.id, p]),
  )

  return Array.from(byPeer.entries())
    .map(([peer_id, { last, unread }]) => {
      const p = profileById.get(peer_id)
      return {
        peer_id,
        peer_display_name: p?.display_name ?? "사용자",
        peer_avatar_url: p?.avatar_url ?? null,
        last_content: last.content || (last.image_url ? "📷 사진" : ""),
        last_created_at: last.created_at,
        unread_count: unread,
      }
    })
    .sort((a, b) => (a.last_created_at < b.last_created_at ? 1 : -1))
}

export async function getThread(userId: string, peerId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`,
    )
    .order("created_at", { ascending: true })
    .limit(200)

  const { data: peer } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", peerId)
    .single()

  return {
    messages: (data ?? []) as Tables<"messages">[],
    peer: peer as Pick<Tables<"profiles">, "id" | "display_name" | "avatar_url"> | null,
  }
}
