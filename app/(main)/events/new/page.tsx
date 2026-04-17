import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CreateEventForm } from "./create-event-form"
import type { Tables } from "@/lib/database.types"

export default async function NewEventPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: hobbiesData } = await supabase
    .from("hobbies")
    .select("id, name, category")
    .order("name", { ascending: true })

  const hobbies = (hobbiesData ?? []) as Pick<
    Tables<"hobbies">,
    "id" | "name" | "category"
  >[]

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>새 모임 만들기</CardTitle>
            <CardDescription>
              같은 관심사를 가진 사람들과 만날 오프라인 모임을 만들어보세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateEventForm hobbies={hobbies} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
