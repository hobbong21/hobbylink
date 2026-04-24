import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getThread } from "@/lib/messaging"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThreadClient } from "./thread-client"
import { markThreadRead } from "../actions"
import { ReportDialog } from "@/components/moderation/report-dialog"
import { BlockButton } from "@/components/moderation/block-button"
import { getMySubscription } from "@/lib/billing/subscription"

interface ThreadPageProps {
  params: Promise<{ peerId: string }>
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { peerId } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { messages, peer } = await getThread(user.id, peerId)
  if (!peer) notFound()

  // Generate short-lived signed URLs for any message image attachments so the
  // private bucket is accessed only by the two conversation participants.
  const messagesWithSignedUrls = await Promise.all(
    messages.map(async (m) => {
      if (!m.image_path) return { ...m, image_url: null }
      const { data } = await supabase.storage
        .from("message-images")
        .createSignedUrl(m.image_path, 3600)
      return { ...m, image_url: data?.signedUrl ?? null }
    }),
  )

  // Grab the previous read marker *before* we advance it so the client can
  // draw a "read up to here" divider.
  const { data: prevReadRow } = await supabase
    .from("thread_read_state")
    .select("last_read_at")
    .eq("user_id", user.id)
    .eq("peer_id", peerId)
    .maybeSingle()
  const previousReadAt = prevReadRow?.last_read_at ?? null

  await markThreadRead(peerId)

  // Premium perk: read receipts. Free users can still *mark* messages read but
  // they don't see read state on their own outgoing messages.
  const sub = await getMySubscription()
  const showReadReceipts = sub.tier === "premium" && sub.status === "active"

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Card className="h-[calc(100vh-12rem)] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar>
                  <AvatarImage
                    src={peer.avatar_url ?? "/placeholder-user.jpg"}
                    alt={`${peer.display_name}의 프로필 사진`}
                  />
                  <AvatarFallback>{peer.display_name[0]}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg truncate">{peer.display_name}</CardTitle>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <ReportDialog targetType="profile" targetId={peer.id} />
                <BlockButton targetId={peer.id} targetName={peer.display_name} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ThreadClient
              currentUserId={user.id}
              peerId={peer.id}
              initialMessages={messagesWithSignedUrls.map((m) => ({
                id: m.id,
                sender_id: m.sender_id,
                content: m.content,
                created_at: m.created_at,
                is_read: m.is_read,
                image_url: m.image_url,
              }))}
              showReadReceipts={showReadReceipts}
              previousReadAt={previousReadAt}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
