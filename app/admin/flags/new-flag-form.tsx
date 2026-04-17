"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createFlag } from "./actions"

export function NewFlagForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const r = await createFlag(formData)
      if (!r.ok) setError(r.message)
      else router.refresh()
    })
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="key">Flag key</Label>
        <Input
          id="key"
          name="key"
          required
          placeholder="premium_badge_v2"
          className="font-mono"
          pattern="^[a-z][a-z0-9_]*$"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">설명 (선택)</Label>
        <Input id="description" name="description" maxLength={200} />
      </div>
      {error && (
        <div role="alert" className="text-sm text-red-600">
          {error}
        </div>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "추가 중..." : "플래그 추가"}
      </Button>
    </form>
  )
}
