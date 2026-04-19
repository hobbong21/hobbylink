"use client"

import type React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthPending, setOauthPending] = useState<"google" | "github" | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Route new users to onboarding so matching works immediately.
      const { data: sessionUser } = await supabase.auth.getUser()
      let next = "/"
      if (sessionUser.user) {
        const [{ data: profile }, { count }] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name")
            .eq("id", sessionUser.user.id)
            .maybeSingle(),
          supabase
            .from("user_hobbies")
            .select("*", { count: "exact", head: true })
            .eq("user_id", sessionUser.user.id),
        ])
        if (!profile?.display_name || (count ?? 0) < 3) next = "/onboarding"
      }
      router.push(next)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuth = async (provider: "google" | "github") => {
    setError(null)
    setOauthPending(provider)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "소셜 로그인에 실패했습니다")
      setOauthPending(null)
    }
  }

  return (
    <div className="min-h-screen bg-hero-spotlight flex flex-col">
      {/* Header */}
      <header className="py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
            <Image src="/hobbylink-logo.png" alt="HobbyLink" width={120} height={40} className="h-8 w-auto" priority />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">로그인</CardTitle>
            <CardDescription>계정에 로그인하여 HobbyLink를 시작하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">비밀번호</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    비밀번호 찾기
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
                >
                  {error}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  로그인 상태 유지
                </label>
              </div>
              <Button type="submit" className="w-full h-11 text-base" size="lg" disabled={isLoading}>
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                또는
              </span>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-11 bg-transparent"
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={oauthPending !== null}
                aria-label="Google로 계속하기"
              >
                <svg aria-hidden="true" className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {oauthPending === "google" ? "이동 중..." : "Google로 계속하기"}
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 bg-transparent"
                type="button"
                onClick={() => handleOAuth("github")}
                disabled={oauthPending !== null}
                aria-label="GitHub로 계속하기"
              >
                <svg aria-hidden="true" className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                {oauthPending === "github" ? "이동 중..." : "GitHub로 계속하기"}
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">계정이 없으신가요? </span>
              <Link href="/signup" className="text-primary font-medium hover:underline">
                회원가입
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} HobbyLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
