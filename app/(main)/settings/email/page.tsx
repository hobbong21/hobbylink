import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChangeEmailForm } from "./change-email-form"

export default async function ChangeEmailPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>이메일 변경</CardTitle>
            <CardDescription>
              새 이메일 주소로 확인 메일이 전송됩니다. 링크를 클릭하면 변경이 완료됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              현재 이메일:{" "}
              <span className="font-mono">{user.email}</span>
            </p>
            <ChangeEmailForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
