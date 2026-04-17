import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UnblockButton } from "./unblock-button"
import type { Tables } from "@/lib/database.types"

export default async function BlocksPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { data: blocks } = await supabase
    .from("user_blocks")
    .select("id, blocked_id, reason, created_at, profiles:blocked_id(display_name, avatar_url)")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false })

  type BlockRow = Pick<Tables<"user_blocks">, "id" | "blocked_id" | "reason" | "created_at"> & {
    profiles: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
  }
  const rows = (blocks ?? []) as BlockRow[]

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">차단 목록</h1>
          <p className="text-muted-foreground mt-2">
            차단한 사용자를 관리합니다. 차단을 해제하면 다시 매칭될 수 있습니다.
          </p>
        </div>

        {rows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              차단한 사용자가 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <Card key={row.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar>
                    <AvatarImage
                      src={row.profiles?.avatar_url ?? "/placeholder-user.jpg"}
                      alt={`${row.profiles?.display_name ?? "사용자"}의 프로필 사진`}
                    />
                    <AvatarFallback>
                      {row.profiles?.display_name?.[0] ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {row.profiles?.display_name ?? "사용자"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString("ko-KR")} 차단
                    </p>
                  </div>
                  <UnblockButton targetId={row.blocked_id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
