"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { updateFlag, deleteFlag } from "./actions"
import type { Tables } from "@/lib/database.types"

export function FlagRow({ flag }: { flag: Tables<"feature_flags"> }) {
  const [enabled, setEnabled] = useState(flag.enabled)
  const [percent, setPercent] = useState(flag.rollout_percent)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const save = (patch: { enabled?: boolean; rollout_percent?: number }) => {
    setError(null)
    startTransition(async () => {
      const r = await updateFlag(flag.key, patch)
      if (!r.ok) setError(r.message)
    })
  }

  const remove = () => {
    if (!confirm(`플래그 "${flag.key}"를 삭제할까요?`)) return
    startTransition(async () => {
      await deleteFlag(flag.key)
    })
  }

  return (
    <div className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm font-medium truncate">{flag.key}</p>
        {flag.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {flag.description}
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-red-600 mt-1">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs">
          <Switch
            checked={enabled}
            onCheckedChange={(v) => {
              setEnabled(v)
              save({ enabled: v })
            }}
            disabled={isPending}
          />
          {enabled ? "켜짐" : "꺼짐"}
        </label>

        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            onBlur={() => save({ rollout_percent: percent })}
            disabled={isPending || !enabled}
            className="w-16 h-8 text-xs"
            aria-label={`${flag.key} rollout percent`}
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={remove}
          disabled={isPending}
          className="text-destructive"
        >
          삭제
        </Button>
      </div>
    </div>
  )
}
