"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check } from "lucide-react"
import { createApiKey } from "./actions"

/**
 * Two-phase UI:
 *   1. Before creation   → name input + "키 생성" button.
 *   2. After creation    → show the raw key with a one-time "copy" button,
 *                          plus a warning that it won't be shown again.
 */
export function CreateKeyForm() {
  const [name, setName] = useState("")
  const [rawKey, setRawKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData()
    fd.set("name", name)
    startTransition(async () => {
      const r = await createApiKey(fd)
      if (r.ok) {
        setRawKey(r.raw)
        setName("")
        router.refresh()
      } else {
        setError(r.message)
      }
    })
  }

  const onCopy = () => {
    if (!rawKey) return
    navigator.clipboard.writeText(rawKey).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }

  if (rawKey) {
    return (
      <div className="space-y-3 p-4 border rounded-md bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
        <p className="text-sm font-medium">새 API 키가 생성되었습니다</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 font-mono text-xs break-all bg-background p-2 rounded border">
            {rawKey}
          </code>
          <Button type="button" size="sm" variant="outline" onClick={onCopy} className="gap-1">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "복사됨" : "복사"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          이 키는 지금 한 번만 표시됩니다. 안전한 곳에 보관하세요. 분실 시 새 키를 발급하고
          이전 키를 폐기해야 합니다.
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={() => setRawKey(null)}>
          닫기
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <Label htmlFor="apikey-name">키 이름</Label>
        <Input
          id="apikey-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 제 블로그 연동"
          maxLength={60}
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending || !name.trim()}>
        {isPending ? "생성 중..." : "키 생성"}
      </Button>
      {error && (
        <p className="text-xs text-red-600 absolute mt-16" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
