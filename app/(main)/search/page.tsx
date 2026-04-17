import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search as SearchIcon, Calendar, Users } from "lucide-react"
import type { Tables } from "@/lib/database.types"

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams
  const query = q.trim()
  const supabase = await createClient()

  const results = query ? await runSearch(supabase, query) : null

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">검색</h1>
          <form
            className="relative"
            // plain GET form → server component re-renders with q
          >
            <SearchIcon
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
            />
            <Input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="관심사, 모임, 사용자, #해시태그 검색"
              className="pl-12 h-12 text-base"
              aria-label="검색어"
            />
          </form>
        </div>

        {results === null ? (
          <p className="text-sm text-muted-foreground">
            검색어를 입력하면 취미·모임·사용자·해시태그가 함께 표시됩니다.
          </p>
        ) : (
          <SearchResults query={query} results={results} />
        )}
      </div>
    </main>
  )
}

async function runSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  query: string,
) {
  const like = `%${query.replace(/[%_]/g, (m) => `\\${m}`)}%`
  const tagName = query.startsWith("#") ? query.slice(1).toLowerCase() : null

  const [hobbies, events, profiles, tag] = await Promise.all([
    supabase
      .from("hobbies")
      .select("*")
      .or(`name.ilike.${like},description.ilike.${like}`)
      .limit(10),
    supabase
      .from("events")
      .select("*")
      .or(`title.ilike.${like},description.ilike.${like},location.ilike.${like}`)
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(10),
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, bio, is_suspended")
      .or(`display_name.ilike.${like},bio.ilike.${like}`)
      .limit(10),
    tagName
      ? supabase.from("tags").select("id, name").eq("name", tagName).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return {
    hobbies: (hobbies.data ?? []) as Tables<"hobbies">[],
    events: (events.data ?? []) as Tables<"events">[],
    profiles: ((profiles.data ?? []) as Array<
      Pick<Tables<"profiles">, "id" | "display_name" | "avatar_url" | "bio" | "is_suspended">
    >).filter((p) => !p.is_suspended),
    tag: tag.data,
  }
}

function SearchResults({
  query,
  results,
}: {
  query: string
  results: NonNullable<Awaited<ReturnType<typeof runSearch>>>
}) {
  const { hobbies, events, profiles, tag } = results
  const empty =
    hobbies.length === 0 && events.length === 0 && profiles.length === 0 && !tag

  if (empty) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          &quot;{query}&quot;에 대한 결과가 없습니다.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {tag && (
        <Card>
          <CardHeader>
            <CardTitle>해시태그</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/tags/${tag.name}`}
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              <Badge variant="secondary">#{tag.name}</Badge>
              <span className="text-sm">태그 페이지 보기</span>
            </Link>
          </CardContent>
        </Card>
      )}

      {hobbies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>관심사 ({hobbies.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {hobbies.map((h) => (
              <Badge key={h.id} variant="outline" className="px-3 py-1">
                {h.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>모임 ({events.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="flex items-center justify-between py-3 gap-3 hover:bg-muted/40 px-2 rounded transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{e.title}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar aria-hidden="true" className="w-3 h-3" />
                      {new Date(e.event_date).toLocaleDateString("ko-KR")}
                    </span>
                    {e.location && <span>{e.location}</span>}
                    <span className="flex items-center gap-1">
                      <Users aria-hidden="true" className="w-3 h-3" />
                      {e.current_participants ?? 0}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  보기
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {profiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>사용자 ({profiles.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {profiles.map((p) => (
              <Link
                key={p.id}
                href={`/profile/${p.id}`}
                className="flex items-center gap-3 py-3 hover:bg-muted/40 px-2 rounded transition-colors"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {p.avatar_url ? (
                    <Image
                      src={p.avatar_url}
                      alt={`${p.display_name}의 프로필 사진`}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-semibold">
                      {p.display_name[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.display_name}</p>
                  {p.bio && (
                    <p className="text-sm text-muted-foreground truncate">{p.bio}</p>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
