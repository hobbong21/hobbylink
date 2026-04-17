"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createHobby } from "./actions"

export function NewHobbyForm() {
  const router = useRouter()
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "ok" } | { kind: "error"; message: string }
  >({ kind: "idle" })
  const [isPending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    setStatus({ kind: "idle" })
    startTransition(async () => {
      const r = await createHobby(formData)
      if (r.ok) {
        setStatus({ kind: "ok" })
        router.refresh()
      } else {
        setStatus({ kind: "error", message: r.message })
      }
    })
  }

  return (
    <form
      action={onSubmit}
      className="space-y-3"
      onSubmit={() => setStatus({ kind: "idle" })}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="name">이름</Label>
          <Input id="name" name="name" required maxLength={50} placeholder="예: 수채화" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="category">카테고리</Label>
          <Input
            id="category"
            name="category"
            required
            maxLength={30}
            placeholder="예: 예술"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          maxLength={500}
          placeholder="간단한 소개"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="image_url">이미지 URL (선택)</Label>
        <Input id="image_url" name="image_url" type="url" placeholder="https://..." />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_featured"
          name="is_featured"
          className="w-4 h-4 rounded border-input"
        />
        <Label htmlFor="is_featured" className="text-sm font-normal">
          추천 취미로 표시
        </Label>
      </div>
      {status.kind === "ok" && (
        <div role="status" className="text-sm text-green-700">
          추가되었습니다.
        </div>
      )}
      {status.kind === "error" && (
        <div role="alert" className="text-sm text-red-600">
          {status.message}
        </div>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "추가 중..." : "취미 추가"}
      </Button>
    </form>
  )
}
