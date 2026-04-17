import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, Users } from "lucide-react"
import { AddHobbyButton } from "./add-hobby-button"
import type { Tables } from "@/lib/database.types"

interface ExplorePageProps {
  searchParams: Promise<{ q?: string; category?: string }>
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { q = "", category = "" } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: catRows } = await supabase
    .from("hobbies")
    .select("category")
    .order("category")
  const categories = Array.from(
    new Set(((catRows ?? []) as Pick<Tables<"hobbies">, "category">[]).map((r) => r.category)),
  )

  let query = supabase
    .from("hobbies")
    .select("*")
    .order("member_count", { ascending: false })
  if (category) query = query.eq("category", category)
  if (q) {
    const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`
    query = query.or(`name.ilike.${like},description.ilike.${like}`)
  }
  const { data: hobbiesData } = await query.limit(60)
  const hobbies = (hobbiesData ?? []) as Tables<"hobbies">[]

  let myHobbyIds = new Set<string>()
  if (user) {
    const { data: mine } = await supabase
      .from("user_hobbies")
      .select("hobby_id")
      .eq("user_id", user.id)
    myHobbyIds = new Set((mine ?? []).map((r) => r.hobby_id))
  }

  return (
    <>
      <section className="bg-gradient-to-b from-muted/50 to-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              관심사 탐색하기
            </h1>
            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              {hobbies.length}개 결과 · 당신에게 맞는 취미를 찾아보세요.
            </p>
            <form className="relative max-w-xl mx-auto">
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
              />
              <Input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="관심사 검색..."
                className="pl-12 h-12 text-base"
                aria-label="관심사 검색"
              />
              {category && <input type="hidden" name="category" value={category} />}
            </form>
          </div>
        </div>
      </section>

      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              asChild
              size="sm"
              variant={!category ? "default" : "outline"}
              className="flex-shrink-0"
            >
              <Link href={`/explore${q ? `?q=${encodeURIComponent(q)}` : ""}`}>
                전체
              </Link>
            </Button>
            {categories.map((cat) => {
              const params = new URLSearchParams()
              params.set("category", cat)
              if (q) params.set("q", q)
              return (
                <Button
                  asChild
                  key={cat}
                  size="sm"
                  variant={category === cat ? "default" : "outline"}
                  className="flex-shrink-0"
                >
                  <Link href={`/explore?${params.toString()}`}>{cat}</Link>
                </Button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {hobbies.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                {q ? `"${q}"에 대한 결과가 없습니다.` : "등록된 관심사가 없습니다."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {hobbies.map((h) => (
                <Card
                  key={h.id}
                  className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {h.image_url ? (
                      <Image
                        src={h.image_url}
                        alt={h.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Sparkles aria-hidden="true" className="w-8 h-8" />
                      </div>
                    )}
                    {h.is_featured && (
                      <Badge className="absolute top-3 right-3 bg-red-500 border-0">
                        추천
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg">
                        <Link
                          href={`/hobbies/${h.id}`}
                          className="hover:underline"
                        >
                          {h.name}
                        </Link>
                      </CardTitle>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {h.category}
                      </Badge>
                    </div>
                    {h.description && (
                      <CardDescription className="line-clamp-2">
                        {h.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users aria-hidden="true" className="w-4 h-4" />
                        <span>{h.member_count.toLocaleString()}명</span>
                      </div>
                      <AddHobbyButton
                        hobbyId={h.id}
                        initialAdded={myHobbyIds.has(h.id)}
                        disabled={!user}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {!user && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto border-2">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  마음에 드는 취미를 찾으셨나요?
                </h2>
                <p className="text-muted-foreground mb-6">
                  가입 후 관심사를 추가하고 사람들과 매칭되세요.
                </p>
                <Button size="lg" asChild>
                  <Link href="/signup">무료로 시작하기</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </>
  )
}
