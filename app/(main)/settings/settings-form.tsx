"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateProfile } from "./actions"

interface SettingsFormProps {
  initialDisplayName: string
  initialBio: string
  initialLocation: string
}

export function SettingsForm({
  initialDisplayName,
  initialBio,
  initialLocation,
}: SettingsFormProps) {
  const [status, setStatus] = useState<{ kind: "ok" | "error"; message: string } | null>(
    null,
  )
  const [isPending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    setStatus(null)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.ok) {
        setStatus({ kind: "ok", message: "저장되었습니다." })
      } else {
        setStatus({ kind: "error", message: result.message })
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="display_name">표시 이름</Label>
        <Input
          id="display_name"
          name="display_name"
          type="text"
          defaultValue={initialDisplayName}
          required
          maxLength={50}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">자기소개</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={initialBio}
          maxLength={280}
          placeholder="간단히 자신을 소개해주세요"
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">지역</Label>
        <Input
          id="location"
          name="location"
          type="text"
          defaultValue={initialLocation}
          placeholder="예: 서울 강남구"
          maxLength={100}
        />
      </div>
      {status && (
        <div
          role={status.kind === "error" ? "alert" : "status"}
          aria-live="polite"
          className={
            status.kind === "ok"
              ? "p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md"
              : "p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
          }
        >
          {status.message}
        </div>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "저장 중..." : "변경사항 저장"}
      </Button>
    </form>
  )
}
