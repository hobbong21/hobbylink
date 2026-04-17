import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { OnboardingForm } from "./onboarding-form"
import type { Tables } from "@/lib/database.types"

/**
 * First-run wizard: collect display name + location + at least 3 hobbies.
 * Skips itself once the user has 3 or more hobbies and a profile name.
 */
export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")

  const [{ data: profile }, { count: hobbyCount }, { data: hobbies }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Tables<"profiles">>(),
    supabase
      .from("user_hobbies")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("hobbies")
      .select("id, name, category")
      .order("is_featured", { ascending: false })
      .limit(40),
  ])

  // Already onboarded? Fast-forward.
  if (profile?.display_name && (hobbyCount ?? 0) >= 3) {
    redirect("/matching")
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">환영합니다 👋</CardTitle>
            <CardDescription>
              더 정확한 매칭을 위해 간단한 프로필과 관심사 3개 이상을 선택해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm
              initial={{
                display_name: profile?.display_name ?? "",
                location: profile?.location ?? "",
              }}
              hobbies={(hobbies ?? []) as Pick<
                Tables<"hobbies">,
                "id" | "name" | "category"
              >[]}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
