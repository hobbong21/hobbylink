import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageCircle, MapPin } from "lucide-react"
import { BlockButton } from "@/components/moderation/block-button"
import { ReportDialog } from "@/components/moderation/report-dialog"
import type { Tables } from "@/lib/database.types"

export default async function MatchesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { data } = await supabase
    .from("matches")
    .select("id, status, user_id, matched_user_id, updated_at")
    .eq("status", "accepted")
    .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
    .order("updated_at", { ascending: false })

  type MatchRow = Pick<
    Tables<"matches">,
    "id" | "status" | "user_id" | "matched_user_id" | "updated_at"
  >
  const rows = (data ?? []) as MatchRow[]

  const peerIds = Array.from(
    new Set(rows.map((m) => (m.user_id === user.id ? m.matched_user_id : m.user_id))),
  )

  const { data: peerProfiles } = peerIds.length
    ? await supabase.from("profiles").select("*").in("id", peerIds)
    : { data: [] as Tables<"profiles">[] }

  const profileById = new Map(
    ((peerProfiles ?? []) as Tables<"profiles">[]).map((p) => [p.id, p]),
  )

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">매칭 목록</h1>
          <p className="text-muted-foreground mt-2">
            서로 관심을 표현하여 매칭된 사람들과 대화를 시작하세요.
          </p>
        </div>

        {peerIds.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground mb-4">아직 매칭된 사용자가 없습니다.</p>
              <Button asChild>
                <Link href="/matching">매칭 시작하기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {peerIds.map((peerId) => {
              const p = profileById.get(peerId)
              return (
                <Card key={peerId}>
                  <CardContent className="pt-6 flex items-start gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarImage
                        src={p?.avatar_url ?? "/placeholder-user.jpg"}
                        alt={`${p?.display_name ?? "사용자"}의 프로필 사진`}
                      />
                      <AvatarFallback>{p?.display_name?.[0] ?? "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold truncate">
                        {p?.display_name ?? "사용자"}
                      </h2>
                      {p?.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin aria-hidden="true" className="w-3 h-3" />
                          <span className="truncate">{p.location}</span>
                        </div>
                      )}
                      {p?.bio && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {p.bio}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button size="sm" asChild>
                          <Link href={`/messages/${peerId}`}>
                            <MessageCircle
                              aria-hidden="true"
                              className="w-4 h-4 mr-2"
                            />
                            대화하기
                          </Link>
                        </Button>
                        <ReportDialog targetType="profile" targetId={peerId} />
                        <BlockButton
                          targetId={peerId}
                          targetName={p?.display_name ?? undefined}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
