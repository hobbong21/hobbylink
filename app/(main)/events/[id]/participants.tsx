import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Tables } from "@/lib/database.types"

interface ParticipantsProps {
  eventId: string
}

export async function Participants({ eventId }: ParticipantsProps) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("event_participants")
    .select("user_id, status, profiles:user_id(id, display_name, avatar_url)")
    .eq("event_id", eventId)
    .in("status", ["registered", "attended"])
    .order("created_at", { ascending: true })
    .limit(50)

  type Row = Pick<Tables<"event_participants">, "user_id" | "status"> & {
    profiles: Pick<Tables<"profiles">, "id" | "display_name" | "avatar_url"> | null
  }
  const rows = (data ?? []) as Row[]

  return (
    <Card>
      <CardHeader>
        <CardTitle>참가자 ({rows.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            아직 참가자가 없습니다. 첫 참가자가 되어보세요!
          </p>
        ) : (
          <ul className="flex flex-wrap gap-3">
            {rows.map((r) => (
              <li key={r.user_id}>
                <Link
                  href={`/profile/${r.user_id}`}
                  className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-muted transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={r.profiles?.avatar_url ?? "/placeholder-user.jpg"}
                      alt={`${r.profiles?.display_name ?? "사용자"}의 프로필 사진`}
                    />
                    <AvatarFallback>
                      {r.profiles?.display_name?.[0] ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {r.profiles?.display_name ?? "사용자"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
