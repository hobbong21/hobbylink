import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InvitationActions } from "./invitation-actions"
import type { Tables } from "@/lib/database.types"

export default async function InvitationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { data } = await supabase
    .from("event_invitations")
    .select(
      "*, events(id, title, event_date, location), inviter:inviter_id(display_name)",
    )
    .eq("invitee_id", user.id)
    .order("created_at", { ascending: false })

  type Row = Tables<"event_invitations"> & {
    events: Pick<Tables<"events">, "id" | "title" | "event_date" | "location"> | null
    inviter: Pick<Tables<"profiles">, "display_name"> | null
  }
  const rows = (data ?? []) as Row[]

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-3xl font-bold">모임 초대</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            받은 초대를 수락하거나 거절하세요.
          </p>
        </div>

        {rows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              받은 초대가 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={r.events ? `/events/${r.events.id}` : "#"}
                        className="font-medium hover:underline"
                      >
                        {r.events?.title ?? "(삭제된 모임)"}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        초대한 사람: {r.inviter?.display_name ?? "알 수 없음"}
                      </p>
                      {r.events?.event_date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.events.event_date).toLocaleString("ko-KR")}
                          {r.events.location ? ` · ${r.events.location}` : ""}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        r.status === "accepted"
                          ? "default"
                          : r.status === "declined"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {r.status === "accepted"
                        ? "수락됨"
                        : r.status === "declined"
                          ? "거절"
                          : "대기"}
                    </Badge>
                  </div>
                  {r.status === "pending" && (
                    <InvitationActions invitationId={r.id} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
