import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getConversations } from "@/lib/messaging"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send } from "lucide-react"

export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const conversations = await getConversations(user.id)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">메시지</h1>
            <p className="text-muted-foreground mt-2">
              매칭된 사용자와 나눈 대화 목록입니다.
            </p>
          </div>
          <Link
            href="/messages/search"
            className="text-sm text-primary hover:underline whitespace-nowrap"
          >
            검색
          </Link>
        </div>

        {conversations.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Send aria-hidden="true" className="w-8 h-8" />
              </div>
              <p className="text-muted-foreground">아직 메시지가 없습니다.</p>
              <p className="text-sm text-muted-foreground mt-2">
                매칭이 성사되면 대화를 시작할 수 있어요.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y p-0">
              {conversations.map((c) => (
                <Link
                  key={c.peer_id}
                  href={`/messages/${c.peer_id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors"
                >
                  <Avatar>
                    <AvatarImage
                      src={c.peer_avatar_url ?? "/placeholder-user.jpg"}
                      alt={`${c.peer_display_name}의 프로필 사진`}
                    />
                    <AvatarFallback>{c.peer_display_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate">{c.peer_display_name}</p>
                      <time
                        dateTime={c.last_created_at}
                        className="text-xs text-muted-foreground flex-shrink-0"
                      >
                        {new Date(c.last_created_at).toLocaleDateString("ko-KR")}
                      </time>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {c.last_content}
                    </p>
                  </div>
                  {c.unread_count > 0 && (
                    <Badge className="flex-shrink-0">{c.unread_count}</Badge>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
