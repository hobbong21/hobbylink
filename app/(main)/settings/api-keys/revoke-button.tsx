"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { revokeApiKey } from "./actions"

export function RevokeButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onClick = () => {
    if (!window.confirm(`"${name}" 키를 폐기하시겠어요? 이 키로는 더 이상 API를 호출할 수 없습니다.`)) return
    startTransition(async () => {
      const r = await revokeApiKey(id)
      if (r.ok) router.refresh()
      else window.alert(r.message)
    })
  }

  return (
    <Button type="button" size="sm" variant="ghost" onClick={onClick} disabled={isPending}>
      {isPending ? "폐기 중..." : "폐기"}
    </Button>
  )
}
