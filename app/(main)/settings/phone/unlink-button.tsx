"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { unlinkPhone } from "./actions"

export function UnlinkButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onClick = () => {
    if (!window.confirm("전화번호 인증을 해제하시겠어요? 다시 인증할 수 있습니다.")) {
      return
    }
    startTransition(async () => {
      const r = await unlinkPhone()
      if (r.ok) router.refresh()
      else window.alert(r.message)
    })
  }

  return (
    <Button variant="outline" size="sm" type="button" onClick={onClick} disabled={isPending}>
      {isPending ? "해제 중..." : "인증 해제"}
    </Button>
  )
}
