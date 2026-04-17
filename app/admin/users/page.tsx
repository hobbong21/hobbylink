import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import type { Tables } from "@/lib/database.types"
import { SuspendButton } from "./suspend-button"

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  const users = (data ?? []) as Tables<"profiles">[]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">사용자 관리</h1>
          <p className="text-muted-foreground mt-2">전체 사용자 목록 및 관리</p>
        </div>
        <Button>새 사용자 추가</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>전체 사용자 ({users.length})</CardTitle>
            <div className="relative w-64">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              />
              <Input placeholder="사용자 검색..." className="pl-9" aria-label="사용자 검색" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length > 0 ? (
              users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-lg">
                      {u.display_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {u.display_name || "사용자"}
                        {u.is_admin && <Badge variant="secondary">관리자</Badge>}
                        {u.is_suspended && <Badge variant="destructive">정지됨</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {u.location || "위치 미설정"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        가입일: {new Date(u.created_at).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                  </div>
                  <SuspendButton userId={u.id} isSuspended={u.is_suspended} />
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-muted-foreground">사용자가 없습니다</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
