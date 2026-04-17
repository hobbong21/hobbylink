import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VisibilityForm } from "./visibility-form"
import type { Tables } from "@/lib/database.types"

export default async function PrivacySettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("visibility")
    .eq("id", user.id)
    .single<Pick<Tables<"profiles">, "visibility">>()

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>프로필 공개 범위</CardTitle>
            <CardDescription>
              누가 내 프로필을 볼 수 있는지 선택하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VisibilityForm initial={profile?.visibility ?? "public"} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
