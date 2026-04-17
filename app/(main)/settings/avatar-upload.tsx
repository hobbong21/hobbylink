"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { updateAvatarUrl } from "./actions"
import { Upload } from "lucide-react"

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
  displayName: string
}

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  displayName,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, startUpload] = useTransition()
  const router = useRouter()

  const onPick = () => inputRef.current?.click()

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("JPG, PNG, WebP 파일만 업로드할 수 있습니다.")
      return
    }
    if (file.size > MAX_SIZE) {
      setError("파일 크기는 2MB 이하여야 합니다.")
      return
    }

    // Local preview while uploading
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    startUpload(async () => {
      try {
        const supabase = createClient()
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
        const path = `${userId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true, cacheControl: "3600" })
        if (uploadError) throw uploadError

        const { data } = supabase.storage.from("avatars").getPublicUrl(path)
        const result = await updateAvatarUrl(data.publicUrl)
        if (!result.ok) throw new Error(result.message)

        router.refresh()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "업로드에 실패했습니다")
        setPreview(currentAvatarUrl)
      } finally {
        URL.revokeObjectURL(localUrl)
      }
    })
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground">
        {preview ? (
          <Image
            src={preview}
            alt={`${displayName}의 프로필 사진`}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <span>{displayName[0]?.toUpperCase() ?? "U"}</span>
        )}
      </div>
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFile}
          className="hidden"
          aria-label="프로필 사진 선택"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPick}
          disabled={isUploading}
          className="gap-2"
        >
          <Upload aria-hidden="true" className="w-4 h-4" />
          {isUploading ? "업로드 중..." : "사진 변경"}
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP · 최대 2MB</p>
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="text-xs text-red-600"
          >
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
