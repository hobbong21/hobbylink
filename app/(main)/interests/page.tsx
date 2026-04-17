import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InterestsPicker } from "./interests-picker"
import type { Tables } from "@/lib/database.types"

export default async function InterestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) redirect("/login")

  const [{ data: hobbiesData }, { data: mineData }] = await Promise.all([
    supabase.from("hobbies").select("*").order("is_featured", { ascending: false }),
    supabase.from("user_hobbies").select("hobby_id").eq("user_id", user.id),
  ])

  const hobbies = (hobbiesData ?? []) as Tables<"hobbies">[]
  const mine = new Set((mineData ?? []).map((r) => r.hobby_id))

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">관심사 추가</h1>
          <p className="text-muted-foreground mt-2">
            당신이 즐기는 취미를 선택하세요. 선택한 관심사를 기반으로 추천이 제공됩니다.
          </p>
        </div>
        <InterestsPicker
          hobbies={hobbies.map((h) => ({
            id: h.id,
            name: h.name,
            category: h.category,
            description: h.description,
            image_url: h.image_url,
          }))}
          initialSelected={Array.from(mine)}
        />
      </div>
    </main>
  )
}
