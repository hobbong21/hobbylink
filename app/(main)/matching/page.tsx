import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMatchCandidates } from "@/lib/matching"
import { MatchingClient } from "./matching-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles, Users, Heart } from "lucide-react"

export default async function MatchingPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) redirect("/login")

  const candidates = await getMatchCandidates(user.id, 10)

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4 text-sm font-medium">
              <Sparkles aria-hidden="true" className="w-4 h-4" />
              <span>관심사 기반 매칭</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
              당신을 위한 완벽한 매칭
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              공유하는 관심사가 많을수록 매칭 점수가 높아집니다
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/matching/history">히스토리</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/matches">매칭된 사람들</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {candidates.length > 0 ? (
            <MatchingClient initialCandidates={candidates} />
          ) : (
            <div className="max-w-2xl mx-auto">
              <Card className="border-2">
                <CardContent className="p-12 text-center">
                  <h2 className="text-2xl font-bold mb-3">추천할 사용자가 없습니다</h2>
                  <p className="text-muted-foreground mb-6">
                    관심사를 추가하면 더 많은 사람을 추천해드릴 수 있어요.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button size="lg" asChild>
                      <Link href="/interests">관심사 추가하기</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link href="/explore">취미 탐색하기</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">매칭은 어떻게 이루어지나요?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Sparkles aria-hidden="true" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>1. 관심사 분석</CardTitle>
                  <CardDescription>
                    당신이 선택한 관심사와 겹치는 사용자를 우선 추천합니다
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Users aria-hidden="true" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>2. 점수화 추천</CardTitle>
                  <CardDescription>
                    공유하는 관심사 수를 기반으로 매칭 점수를 산출합니다
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Heart aria-hidden="true" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>3. 연결</CardTitle>
                  <CardDescription>
                    서로 관심을 표현하면 메시지로 대화를 시작할 수 있습니다
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
