"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { updateNotificationPrefs, type PrefsInput } from "./actions"

interface NotificationPrefsFormProps {
  initial: PrefsInput
}

export function NotificationPrefsForm({ initial }: NotificationPrefsFormProps) {
  const [prefs, setPrefs] = useState<PrefsInput>(initial)
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "ok" } | { kind: "error"; message: string }
  >({ kind: "idle" })
  const [isPending, startTransition] = useTransition()

  const toggle = (key: keyof PrefsInput) => (v: boolean) =>
    setPrefs((p) => ({ ...p, [key]: v }))

  const onSave = () => {
    setStatus({ kind: "idle" })
    startTransition(async () => {
      const r = await updateNotificationPrefs(prefs)
      setStatus(r.ok ? { kind: "ok" } : { kind: "error", message: r.message })
    })
  }

  const rows: {
    key: keyof PrefsInput
    title: string
    description: string
  }[] = [
    {
      key: "email_on_match",
      title: "매칭 성사 이메일",
      description: "서로 관심을 표현해 매칭되면 이메일을 받습니다",
    },
    {
      key: "email_on_new_message",
      title: "새 메시지 이메일",
      description: "새 메시지가 도착할 때마다 이메일을 받습니다 (빈번할 수 있음)",
    },
    {
      key: "email_on_event_reminder",
      title: "모임 리마인더 이메일",
      description: "참가 예정 모임의 하루 전에 이메일을 받습니다",
    },
    {
      key: "inapp_on_follow",
      title: "팔로우 인앱 알림",
      description: "누군가 나를 팔로우하면 알림 목록에 표시합니다",
    },
    {
      key: "play_sound",
      title: "새 알림 사운드",
      description: "인앱 알림이 도착하면 짧은 비프음을 재생합니다",
    },
    {
      key: "vibrate",
      title: "진동",
      description: "모바일 브라우저에서 알림 도착 시 120ms 진동합니다",
    },
  ]

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex items-start justify-between gap-4 py-2 border-b last:border-0"
        >
          <div className="min-w-0">
            <Label htmlFor={row.key} className="font-medium">
              {row.title}
            </Label>
            <p className="text-sm text-muted-foreground">{row.description}</p>
          </div>
          <Switch
            id={row.key}
            checked={prefs[row.key]}
            onCheckedChange={toggle(row.key)}
          />
        </div>
      ))}

      {status.kind === "ok" && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md"
        >
          저장되었습니다.
        </div>
      )}
      {status.kind === "error" && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
        >
          {status.message}
        </div>
      )}

      <Button onClick={onSave} disabled={isPending}>
        {isPending ? "저장 중..." : "변경사항 저장"}
      </Button>
    </div>
  )
}
