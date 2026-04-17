import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditPostForm } from "./edit-post-form"

interface EditPostProps {
  params: Promise<{ postId: string }>
}

export default async function EditPostPage({ params }: EditPostProps) {
  const { postId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: post } = await supabase
    .from("posts")
    .select("id, content, author_id")
    .eq("id", postId)
    .maybeSingle()
  if (!post) notFound()
  if (post.author_id !== user.id) redirect(`/community/${postId}`)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>게시글 수정</CardTitle>
          </CardHeader>
          <CardContent>
            <EditPostForm postId={postId} initialContent={post.content} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
