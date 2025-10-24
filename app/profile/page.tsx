import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Edit, Settings } from "lucide-react"

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
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch user hobbies
  const { data: userHobbies } = await supabase.from("user_hobbies").select("*, hobbies(*)").eq("user_id", user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/hobbylink-logo.png"
                alt="HobbyLink"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                홈
              </Link>
              <Link href="/explore" className="text-sm font-medium hover:text-primary transition-colors">
                탐색
              </Link>
              <Link href="/matching" className="text-sm font-medium hover:text-primary transition-colors">
                매칭
              </Link>
              <Link href="/community" className="text-sm font-medium hover:text-primary transition-colors">
                커뮤니티
              </Link>
              <Link href="/profile" className="text-sm font-medium text-primary">
                프로필
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-4xl font-bold text-white">
                    {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold">{profile?.display_name || "사용자"}</h1>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/settings">
                          <Settings className="w-4 h-4 mr-2" />
                          설정
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href="/profile/edit">
                          <Edit className="w-4 h-4 mr-2" />
                          프로필 수정
                        </Link>
                      </Button>
                    </div>
                  </div>
                  {profile?.bio && <p className="text-muted-foreground">{profile.bio}</p>}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      가입일: {new Date(profile?.created_at || "").toLocaleDateString("ko-KR")}
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
              {userHobbies && userHobbies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userHobbies.map((uh: any) => (
                    <Badge key={uh.id} variant="secondary" className="px-3 py-1">
                      {uh.hobbies.name}
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
                    <Link href="/explore">관심사 탐색하기</Link>
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
    </div>
  )
}
