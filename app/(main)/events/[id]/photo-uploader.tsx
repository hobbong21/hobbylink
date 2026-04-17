"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { recordEventPhoto } from "./photo-actions"
import { Upload } from "lucide-react"

interface PhotoUploaderProps {
  eventId: string
  userId: string
}

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"]

export function PhotoUploader({ eventId, userId }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [caption, setCaption] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onPick = () => inputRef.current?.click()

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (!ALLOWED.includes(file.type)) {
      setError("JPG, PNG, WebP 파일만 업로드할 수 있습니다.")
      return
    }
    if (file.size > MAX_SIZE) {
      setError("파일 크기는 5MB 이하여야 합니다.")
      return
    }

    startTransition(async () => {
      try {
        const supabase = createClient()
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
        const storagePath = `${eventId}/${userId}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from("event-photos")
          .upload(storagePath, file, { cacheControl: "3600", upsert: false })
        if (upErr) throw upErr

        const { data } = supabase.storage.from("event-photos").getPublicUrl(storagePath)
        const result = await recordEventPhoto({
          eventId,
          storagePath,
          url: data.publicUrl,
          caption: caption.trim() || undefined,
        })
        if (!result.ok) throw new Error(result.message)

        setCaption("")
        if (inputRef.current) inputRef.current.value = ""
        router.refresh()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "업로드에 실패했습니다")
      }
    })
  }

  return (
    <div className="rounded-md border border-dashed p-3 space-y-2">
      <Input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="간단한 설명 (선택, 300자 이내)"
        maxLength={300}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFile}
        className="hidden"
        aria-label="모임 사진 선택"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP · 최대 5MB</p>
        <Button
          type="button"
          size="sm"
          onClick={onPick}
          disabled={isPending}
          className="gap-2"
        >
          <Upload aria-hidden="true" className="w-4 h-4" />
          {isPending ? "업로드 중..." : "사진 추가"}
        </Button>
      </div>
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded"
        >
          {error}
        </div>
      )}
    </div>
  )
}
