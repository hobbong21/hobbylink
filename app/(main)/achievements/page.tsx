import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Heart, Calendar, MessageSquare, Star, Users } from "lucide-react"
import type { Tables } from "@/lib/database.types"
import { XpProgress } from "@/components/profile/xp-progress"

const ICONS: Record<string, typeof Sparkles> = {
  Sparkles,
  Heart,
  Calendar,
  MessageSquare,
  Star,
  Users,
}

export default async function AchievementsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const [{ data: catalog }, { data: earnedRows }, { data: profileRow }] =
    await Promise.all([
      supabase
        .from("achievements")
        .select("*")
        .order("points", { ascending: true }),
      supabase
        .from("user_achievements")
        .select("code, earned_at")
        .eq("user_id", user.id),
      supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", user.id)
        .maybeSingle(),
    ])

  type Catalog = Tables<"achievements">
  const all = (catalog ?? []) as Catalog[]
  const earned = new Map(
    ((earnedRows ?? []) as { code: string; earned_at: string }[]).map((r) => [
      r.code,
      r.earned_at,
    ]),
  )

  const totalPoints = all
    .filter((a) => earned.has(a.code))
    .reduce((sum, a) => sum + a.points, 0)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">업적</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {earned.size} / {all.length} 획득 · {totalPoints} 포인트
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">내 레벨</CardTitle>
            <CardDescription>
              획득한 업적 포인트가 모여 레벨이 오릅니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <XpProgress xp={profileRow?.xp ?? totalPoints} />
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-3">
          {all.map((a) => {
            const gotIt = earned.has(a.code)
            // Explicit fallback so JSX sees a concrete component type rather
            // than a possibly-undefined lookup.
            const Icon: typeof Sparkles =
              (a.icon && ICONS[a.icon]) || Sparkles
            return (
              <Card
                key={a.code}
                className={gotIt ? "" : "opacity-60"}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={
                        gotIt
                          ? "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0"
                          : "w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0"
                      }
                    >
                      <Icon aria-hidden="true" className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        {a.label}
                        <Badge variant={gotIt ? "default" : "outline"} className="text-[10px]">
                          +{a.points}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {a.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  {gotIt
                    ? `획득: ${new Date(earned.get(a.code)!).toLocaleDateString("ko-KR")}`
                    : "아직 획득하지 않음"}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}
           