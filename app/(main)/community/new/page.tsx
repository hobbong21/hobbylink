import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewPostForm } from "./new-post-form"

export default async function NewPostPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>새 글 작성</CardTitle>
            <CardDescription>
              본문에 #태그 형식으로 해시태그를 넣으면 자동으로 태그가 생성됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewPostForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
