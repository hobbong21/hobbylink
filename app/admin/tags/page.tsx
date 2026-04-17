import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TagMergeForm } from "./tag-merge-form"

export default async function AdminTagsPage() {
  const supabase = await createClient()

  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">태그 관리</h1>
        <p className="text-muted-foreground mt-2">중복 태그를 병합하고 관리합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>태그 머지</CardTitle>
          <CardDescription>
            하나의 태그를 다른 태그로 병합합니다. 모든 post/event 링크가 대상 태그로 이전되고,
            원본 태그 행은 삭제됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagMergeForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>전체 태그 ({tags?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(tags ?? []).map((t) => (
            <Badge key={t.id} variant="outline" className="font-mono">
              #{t.name}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
