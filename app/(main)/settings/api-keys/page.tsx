import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen } from "lucide-react"
import { CreateKeyForm } from "./create-form"
import { RevokeButton } from "./revoke-button"
import type { Tables } from "@/lib/database.types"

export const dynamic = "force-dynamic"

export default async function ApiKeysPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { data: rows } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, tier, revoked_at, last_used_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  type KeyRow = Pick<
    Tables<"api_keys">,
    "id" | "name" | "key_prefix" | "tier" | "revoked_at" | "last_used_at" | "created_at"
  >
  const keys = (rows ?? []) as KeyRow[]

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings" className="gap-1">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            설정으로 돌아가기
          </Link>
        </Button>

        <div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">API 키</h1>
            <Button variant="outline" size="sm" asChild>
              <Link href="/docs/api" className="gap-1">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                API 문서
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            공개 이벤트/취미 카탈로그를 읽기 위한 개인 키입니다. 기본 요금제는
            분당 60회 호출로 제한됩니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">새 키 발급</CardTitle>
            <CardDescription>
              최대 5개까지 활성 키를 가질 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateKeyForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">발급된 키</CardTitle>
          </CardHeader>
          <CardContent>
            {keys.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                아직 발급된 키가 없습니다.
              </p>
            ) : (
              <ul className="divide-y">
                {keys.map((k) => (
                  <li key={k.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{k.name}</p>
                        <Badge variant={k.revoked_at ? "outline" : "secondary"}>
                          {k.revoked_at ? "폐기됨" : k.tier}
                        </Badge>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        {k.key_prefix}…
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        생성: {new Date(k.created_at).toLocaleDateString("ko-KR")}
                        {k.last_used_at &&
                          ` · 마지막 사용: ${new Date(k.last_used_at).toLocaleDateString("ko-KR")}`}
                      </p>
                    </div>
                    {!k.revoked_at && <RevokeButton id={k.id} name={k.name} />}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
