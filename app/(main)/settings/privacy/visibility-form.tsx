"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { updateVisibility } from "./actions"

type Visibility = "public" | "connections" | "private"

const OPTIONS: { value: Visibility; title: string; description: string }[] = [
  {
    value: "public",
    title: "공개",
    description:
      "로그인한 모든 사용자가 프로필을 볼 수 있습니다. 매칭에 가장 유리합니다.",
  },
  {
    value: "connections",
    title: "매칭·팔로워만",
    description:
      "상호 매칭된 사람 또는 나를 팔로우하는 사람만 프로필 상세를 볼 수 있습니다.",
  },
  {
    value: "private",
    title: "비공개",
    description:
      "본인 외에는 아무도 프로필을 볼 수 없습니다. 매칭 추천에서도 제외됩니다.",
  },
]

export function VisibilityForm({ initial }: { initial: Visibility }) {
  const [value, setValue] = useState<Visibility>(initial)
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "ok" } | { kind: "error"; message: string }
  >({ kind: "idle" })
  const [isPending, startTransition] = useTransition()

  const onSave = () => {
    setStatus({ kind: "idle" })
    startTransition(async () => {
      const r = await updateVisibility(value)
      setStatus(r.ok ? { kind: "ok" } : { kind: "error", message: r.message })
    })
  }

  return (
    <div className="space-y-4">
      <RadioGroup
        value={value}
        onValueChange={(v) => setValue(v as Visibility)}
        className="space-y-2"
      >
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            htmlFor={`vis-${opt.value}`}
            className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40"
          >
            <RadioGroupItem id={`vis-${opt.value}`} value={opt.value} className="mt-1" />
            <div className="min-w-0">
              <p className="font-medium text-sm">{opt.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {opt.description}
              </p>
            </div>
          </label>
        ))}
      </RadioGroup>
      <div className="flex items-center justify-between">
        <Button onClick={onSave} disabled={isPending || value === initial}>
          {isPending ? "저장 중..." : "변경사항 저장"}
        </Button>
        {status.kind === "ok" && (
          <Label className="text-xs text-green-700">저장되었습니다</Label>
        )}
        {status.kind === "error" && (
          <Label className="text-xs text-red-600">{status.message}</Label>
        )}
      </div>
    </div>
  )
}
