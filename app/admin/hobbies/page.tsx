import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NewHobbyForm } from "./new-hobby-form"
import type { Tables } from "@/lib/database.types"

export default async function AdminHobbiesPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("hobbies")
    .select("*")
    .order("member_count", { ascending: false })

  const hobbies = (data ?? []) as Tables<"hobbies">[]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">취미 관리</h1>
        <p className="text-muted-foreground mt-2">등록된 취미 {hobbies.length}개</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>새 취미 추가</CardTitle>
          <CardDescription>
            카테고리는 자유 입력입니다. 중복 생성을 피하려면 기존 카테고리와 정확히 같은 문자열을 사용하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewHobbyForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>전체 취미</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {hobbies.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between py-3 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium flex items-center gap-2">
                    {h.name}
                    {h.is_featured && <Badge>추천</Badge>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {h.category} · 회원 {h.member_count}명
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
