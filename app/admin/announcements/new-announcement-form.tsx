"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createAnnouncement } from "./actions"

export function NewAnnouncementForm() {
  const [variant, setVariant] = useState<"info" | "warning" | "success">("info")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onSubmit = (formData: FormData) => {
    setError(null)
    formData.set("variant", variant)
    startTransition(async () => {
      const r = await createAnnouncement(formData)
      if (!r.ok) {
        setError(r.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
        <div className="space-y-1">
          <Label htmlFor="title">제목</Label>
          <Input id="title" name="title" required maxLength={120} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="variant">종류</Label>
          <Select value={variant} onValueChange={(v) => setVariant(v as typeof variant)}>
            <SelectTrigger id="variant">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">정보</SelectItem>
              <SelectItem value="warning">주의</SelectItem>
              <SelectItem value="success">성공/축하</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="body">본문</Label>
        <Textarea id="body" name="body" rows={3} required maxLength={1000} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="link_url">링크 URL (선택)</Label>
          <Input id="link_url" name="link_url" type="url" placeholder="https://..." />
        </div>
        <div className="space-y-1">
          <Label htmlFor="link_label">링크 라벨 (선택)</Label>
          <Input id="link_label" name="link_label" maxLength={60} placeholder="자세히 보기" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="starts_at">시작 시각 (선택)</Label>
          <Input id="starts_at" name="starts_at" type="datetime-local" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ends_at">종료 시각 (선택)</Label>
          <Input id="ends_at" name="ends_at" type="datetime-local" />
        </div>
      </div>
      {error && (
        <div role="alert" className="text-sm text-red-600">
          {error}
        </div>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "저장 중..." : "공지 발행"}
      </Button>
    </form>
  )
}
