"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Image as ImageIcon, X } from "lucide-react"
import { extractHashtags } from "@/lib/tags"
import { createPost } from "../actions"
import { createClient } from "@/lib/supabase/client"
import { track } from "@/lib/analytics/client"

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"]

export function NewPostForm() {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  const previewTags = extractHashtags(content)

  const onPick = () => fileRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    if (!ALLOWED.includes(file.type)) {
      setError("JPG, PNG, WebP만 업로드할 수 있습니다.")
      return
    }
    if (file.size > MAX_SIZE) {
      setError("파일 크기는 5MB 이하여야 합니다.")
      return
    }

    setIsUploading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("로그인이 필요합니다")
        return
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("post-images")
        .upload(path, file, { cacheControl: "3600", upsert: false })
      if (upErr) throw upErr
      const { data } = supabase.storage.from("post-images").getPublicUrl(path)
      setImageUrl(data.publicUrl)
      setImagePath(path)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "업로드 실패")
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = async () => {
    if (imagePath) {
      const supabase = createClient()
      await supabase.storage.from("post-images").remove([imagePath])
    }
    setImageUrl(null)
    setImagePath(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = content.trim()
    if (!trimmed) {
      setError("내용을 입력하세요")
      return
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.set("content", trimmed)
      if (imageUrl) fd.set("image_url", imageUrl)
      const result = await createPost(fd)
      if (!result.ok) {
        setError(result.message)
        return
      }
      void track("post.created", { has_image: !!imageUrl, tag_count: previewTags.length })
      router.push(`/community/${result.id}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        maxLength={5000}
        placeholder="어떤 이야기를 나누고 싶나요? #해시태그 도 함께 써보세요."
        aria-label="게시글 내용"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{content.length} / 5000</span>
        {previewTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {previewTags.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">
                #{t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFile}
        className="hidden"
        aria-label="게시글 이미지"
      />

      {imageUrl ? (
        <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
          <Image src={imageUrl} alt="업로드한 이미지" fill className="object-cover" sizes="600px" />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 w-7 h-7"
            onClick={removeImage}
            aria-label="이미지 제거"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPick}
          disabled={isUploading}
          className="gap-2"
        >
          <ImageIcon aria-hidden="true" className="w-4 h-4" />
          {isUploading ? "업로드 중..." : "이미지 추가 (선택)"}
        </Button>
      )}

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
        >
          {error}
        </div>
      )}
      <Button
        type="submit"
        disabled={isPending || isUploading || !content.trim()}
      >
        {isPending ? "작성 중..." : "게시하기"}
      </Button>
    </form>
  )
}
