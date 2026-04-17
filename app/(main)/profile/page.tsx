import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Edit, Settings, Sparkles } from "lucide-react"
import type { Tables } from "@/lib/database.types"
import { getMySubscription } from "@/lib/billing/subscription"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Tables<"profiles">>()

  // Fetch user hobbies with joined hobby row
  const { data: userHobbies } = await supabase
    .from("user_hobbies")
    .select("*, hobbies(*)")
    .eq("user_id", user.id)

  type UserHobbyRow = Tables<"user_hobbies"> & { hobbies: Tables<"hobbies"> | null }
  const hobbies = (userHobbies as UserHobbyRow[] | null) ?? []

  const sub = await getMySubscription()

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-4xl font-bold text-white">
                  {profile?.display_name?.[0]?.toUpperCase() ||
                    user.email?.[0]?.toUpperCase()}
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                      {profile?.display_name || "사용자"}
                      {sub.tier === "premium" && (
                        <Badge className="gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                          <Sparkles aria-hidden="true" className="w-3 h-3" />
                          Premium
                        </Badge>
                      )}
                    </h1>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/settings">
                        <Settings aria-hidden="true" className="w-4 h-4 mr-2" />
                        설정
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/profile/edit">
                        <Edit aria-hidden="true" className="w-4 h-4 mr-2" />
                        프로필 수정
                      </Link>
                    </Button>
                  </div>
                </div>
                {profile?.bio && <p className="text-muted-foreground">{profile.bio}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin aria-hidden="true" className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar aria-hidden="true" className="w-4 h-4" />
                    가입일:{" "}
                    {new Date(profile?.created_at || "").toLocaleDateString("ko-KR")}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hobbies */}
        <Card>
          <CardHeader>
            <CardTitle>내 관심사</CardTitle>
          </CardHeader>
          <CardContent>
            {hobbies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {hobbies.map((uh) => (
                  <Badge key={uh.id} variant="secondary" className="px-3 py-1">
                    {uh.hobbies?.name ?? "알 수 없음"}
                    {uh.skill_level && (
                      <span className="ml-2 text-xs opacity-70">
                        {uh.skill_level === "beginner" && "초급"}
                        {uh.skill_level === "intermediate" && "중급"}
                        {uh.skill_level === "advanced" && "고급"}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>아직 추가된 관심사가 없습니다</p>
                <Button asChild className="mt-4">
                  <Link href="/interests">관심사 추가하기</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground mt-1">매칭</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground mt-1">게시글</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground mt-1">참여 이벤트</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
