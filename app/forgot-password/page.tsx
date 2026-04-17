"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "success" }
    | { kind: "error"; message: string }
    | { kind: "loading" }
  >({ kind: "idle" })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ kind: "loading" })
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      })
      if (error) throw error
      setStatus({ kind: "success" })
    } catch (err: unknown) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "요청을 처리할 수 없습니다",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
            <Image src="/hobbylink-logo.png" alt="HobbyLink" width={120} height={40} className="h-10 w-auto" priority />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">비밀번호 찾기</CardTitle>
            <CardDescription>
              가입한 이메일 주소로 비밀번호 재설정 링크를 보내드립니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status.kind === "success" ? (
              <div
                role="status"
                aria-live="polite"
                className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md"
              >
                재설정 링크를 이메일로 보냈습니다. 받은 편지함을 확인해주세요.
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                    placeholder="your@email.com"
                  />
                </div>
                {status.kind === "error" && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
                  >
                    {status.message}
                  </div>
                )}
                <Button type="submit" className="w-full h-11" disabled={status.kind === "loading"}>
                  {status.kind === "loading" ? "전송 중..." : "재설정 링크 받기"}
                </Button>
              </form>
            )}
            <div className="mt-6 text-center text-sm">
              <Link href="/login" className="text-primary font-medium hover:underline">
                로그인으로 돌아가기
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
