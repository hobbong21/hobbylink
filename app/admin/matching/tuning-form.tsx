"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { saveMatchTuning, resetMatchTuning } from "./actions"
import type { MatchTuning } from "@/lib/matching-tuning"
import { DEFAULT_TUNING } from "@/lib/matching-tuning"
import { RotateCcw, Save } from "lucide-react"

interface TuningFormProps {
  initial: MatchTuning
}

/**
 * Single-page tuning UI. Uses controlled sliders so the live preview
 * component can re-score as the admin drags the bars. Hits the server only
 * on explicit Save / Reset clicks.
 */
export function TuningForm({ initial }: TuningFormProps) {
  const [values, setValues] = useState<MatchTuning>(initial)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const dirty =
    values.overlap_weight !== initial.overlap_weight ||
    values.location_exact_bonus !== initial.location_exact_bonus ||
    values.location_region_bonus !== initial.location_region_bonus ||
    values.recency_48h_bonus !== initial.recency_48h_bonus ||
    values.recency_7d_bonus !== initial.recency_7d_bonus

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    const fd = new FormData()
    fd.set("overlap_weight", String(values.overlap_weight))
    fd.set("location_exact_bonus", String(values.location_exact_bonus))
    fd.set("location_region_bonus", String(values.location_region_bonus))
    fd.set("recency_48h_bonus", String(values.recency_48h_bonus))
    fd.set("recency_7d_bonus", String(values.recency_7d_bonus))
    startTransition(async () => {
      const r = await saveMatchTuning(fd)
      setMessage(r.ok ? "저장되었습니다" : r.message)
    })
  }

  const onReset = () => {
    setMessage(null)
    startTransition(async () => {
      const r = await resetMatchTuning()
      if (r.ok) {
        setValues(DEFAULT_TUNING)
        setMessage("기본값으로 되돌렸습니다")
      } else {
        setMessage(r.message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Row
        label="겹치는 관심사 가중치"
        description="(공통 관심사 / 내 관심사 수) × 이 값 = 기본 점수"
        min={0}
        max={200}
        step={5}
        value={values.overlap_weight}
        onChange={(v) => setValues((s) => ({ ...s, overlap_weight: v }))}
      />
      <Row
        label="위치 정확히 일치"
        description="지역 문자열이 완전히 같을 때 가산점"
        min={0}
        max={50}
        step={1}
        value={values.location_exact_bonus}
        onChange={(v) => setValues((s) => ({ ...s, location_exact_bonus: v }))}
      />
      <Row
        label="위치 앞 단어 일치"
        description="시/도 단위가 같을 때 (예: 서울 강남 vs 서울 종로)"
        min={0}
        max={50}
        step={1}
        value={values.location_region_bonus}
        onChange={(v) => setValues((s) => ({ ...s, location_region_bonus: v }))}
      />
      <Row
        label="최근 48시간 활동"
        description="활성 피처 플래그 하에서 적용"
        min={0}
        max={50}
        step={1}
        value={values.recency_48h_bonus}
        onChange={(v) => setValues((s) => ({ ...s, recency_48h_bonus: v }))}
      />
      <Row
        label="최근 7일 활동"
        description="활성 피처 플래그 하에서 적용"
        min={0}
        max={50}
        step={1}
        value={values.recency_7d_bonus}
        onChange={(v) => setValues((s) => ({ ...s, recency_7d_bonus: v }))}
      />

      {/* Hidden field so preview component can read current values via DOM. */}
      <input type="hidden" id="tuning-snapshot" data-tuning={JSON.stringify(values)} />

      <div className="flex items-center justify-between gap-3 pt-2 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          disabled={isPending}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          기본값으로 되돌리기
        </Button>
        <div className="flex items-center gap-3">
          {message && (
            <p className="text-xs text-muted-foreground" role="status">
              {message}
            </p>
          )}
          <Button type="submit" disabled={isPending || !dirty} className="gap-2">
            <Save className="w-4 h-4" />
            {isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </form>
  )
}

interface RowProps {
  label: string
  description: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}

function Row({ label, description, min, max, step, value, onChange }: RowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <Label className="text-sm font-medium">{label}</Label>
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)))
          }}
          className="w-20 h-8 text-right"
        />
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? 0)}
        aria-label={label}
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
