"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { markAllNotificationsRead } from "./actions"

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => markAllNotificationsRead().then(() => {}))}
    >
      {isPending ? "처리 중..." : "모두 읽음 처리"}
    </Button>
  )
}
