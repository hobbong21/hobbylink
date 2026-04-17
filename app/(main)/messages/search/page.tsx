import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search } from "lucide-react"
import { highlight } from "@/lib/highlight"
import type { Tables } from "@/lib/database.types"

interface MessagesSearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function MessagesSearchPage({ searchParams }: MessagesSearchPageProps) {
  const { q = "" } = await searchParams
  const query = q.trim()

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  let rows: (Tables<"messages"> & {
    sender: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
    receiver: Pick<Tables<"profiles">, "display_name" | "avatar_url"> | null
  })[] = []

  if (query) {
    const like = `%${query.replace(/[%_]/g, (m) => `\\${m}`)}%`
    const { data } = await supabase
      .from("messages")
      .select(
        "*, sender:sender_id(display_name, avatar_url), receiver:receiver_id(display_name, avatar_url)",
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .ilike("content", like)
      .order("created_at", { ascending: false })
      .limit(50)
    rows = (data ?? []) as typeof rows
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-3xl font-bold">메시지 검색</h1>
          <p className="text-muted-foreground text-sm mt-1">
            내가 주고받은 메시지에서만 검색합니다.
          </p>
        </div>
        <form className="relative">
          <Search
            aria-hidden="true"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
          />
          <Input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="본문 검색"
            className="pl-12 h-11"
            aria-label="메시지 검색"
          />
        </form>

        {!query ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              검색어를 입력하세요.
            </CardContent>
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              &quot;{query}&quot;에 해당하는 메시지가 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((m) => {
              const mine = m.sender_id === user.id
              const peer = mine ? m.receiver : m.sender
              const peerId = mine ? m.receiver_id : m.sender_id
              return (
                <Card key={m.id}>
                  <CardContent className="p-3">
                    <Link
                      href={`/messages/${peerId}`}
                      className="flex gap-3 hover:bg-muted/40 -mx-1 px-1 py-1 rounded transition-colors"
                    >
                      <Avatar>
                        <AvatarImage
                          src={peer?.avatar_url ?? "/placeholder-user.jpg"}
                          alt={`${peer?.display_name ?? "사용자"}의 프로필 사진`}
                        />
                        <AvatarFallback>
                          {peer?.display_name?.[0] ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">
                            {mine ? "나 → " : ""}
                            {peer?.display_name ?? "사용자"}
                          </p>
                          <time
                            dateTime={m.created_at}
                            className="text-xs text-muted-foreground flex-shrink-0"
                          >
                            {new Date(m.created_at).toLocaleDateString("ko-KR")}
                          </time>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {highlight(m.content, query)}
                        </p>
                      </div>
                    </Link>
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
