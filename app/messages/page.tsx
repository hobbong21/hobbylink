import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Send } from "lucide-react"

export default async function MessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

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
              <Link href="/profile" className="text-sm font-medium hover:text-primary transition-colors">
                프로필
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Conversations List */}
            <Card className="md:col-span-1">
              <CardContent className="p-4 h-full flex flex-col">
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-3">메시지</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="대화 검색..." className="pl-9" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  <div className="text-center py-12 text-muted-foreground">
                    <p>아직 메시지가 없습니다</p>
                    <p className="text-sm mt-2">매칭된 사용자와 대화를 시작해보세요</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="md:col-span-2">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Send className="w-8 h-8" />
                    </div>
                    <p>대화를 선택하여 메시지를 시작하세요</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
