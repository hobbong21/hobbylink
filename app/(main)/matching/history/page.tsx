import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UndoMatchButton } from "./undo-match-button"
import type { Tables } from "@/lib/database.types"

export default async function MatchingHistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { data } = await supabase
    .from("matches")
    .select("id, status, matched_user_id, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(200)

  type Row = Pick<Tables<"matches">, "id" | "status" | "matched_user_id" | "updated_at">
  const rows = (data ?? []) as Row[]

  const peerIds = Array.from(new Set(rows.map((r) => r.matched_user_id)))
  const { data: profiles } = peerIds.length
    ? await supabase.from("profiles").select("id, display_name, avatar_url").in("id", peerIds)
    : { data: [] as Pick<Tables<"profiles">, "id" | "display_name" | "avatar_url">[] }

  const profileById = new Map(
    ((profiles ?? []) as Pick<Tables<"profiles">, "id" | "display_name" | "avatar_url">[]).map(
      (p) => [p.id, p],
    ),
  )

  const buckets = {
    pending: rows.filter((r) => r.status === "pending"),
    accepted: rows.filter((r) => r.status === "accepted"),
    rejected: rows.filter((r) => r.status === "rejected"),
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-3xl font-bold">매칭 히스토리</h1>
          <p className="text-muted-foreground text-sm mt-1">
            지금까지 표현한 관심/패스를 되돌아보세요. 패스한 항목은 되돌려서 다시 매칭 추천에 올릴 수 있습니다.
          </p>
        </div>

        <Tabs defaultValue="accepted">
          <TabsList>
            <TabsTrigger value="accepted">수락됨 ({buckets.accepted.length})</TabsTrigger>
            <TabsTrigger value="pending">대기 ({buckets.pending.length})</TabsTrigger>
            <TabsTrigger value="rejected">패스 ({buckets.rejected.length})</TabsTrigger>
          </TabsList>

          {(["accepted", "pending", "rejected"] as const).map((key) => (
            <TabsContent key={key} value={key} className="space-y-2 mt-4">
              {buckets[key].length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    내역이 없습니다.
                  </CardContent>
                </Card>
              ) : (
                buckets[key].map((r) => {
                  const p = profileById.get(r.matched_user_id)
                  return (
                    <Card key={r.id}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={p?.avatar_url ?? "/placeholder-user.jpg"}
                            alt={`${p?.display_name ?? "사용자"}의 프로필 사진`}
                          />
                          <AvatarFallback>
                            {p?.display_name?.[0] ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/profile/${r.matched_user_id}`}
                            className="font-medium hover:underline"
                          >
                            {p?.display_name ?? "사용자"}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.updated_at).toLocaleString("ko-KR")}
                          </p>
                        </div>
                        <Badge
                          variant={
                            key === "accepted"
                              ? "default"
                              : key === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {key === "accepted" ? "매칭됨" : key === "rejected" ? "패스" : "대기"}
                        </Badge>
                        {key === "rejected" && <UndoMatchButton matchId={r.id} />}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  )
}
