"use client"

import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { completeOnboarding } from "./actions"

interface OnboardingFormProps {
  initial: { display_name: string; location: string }
  hobbies: { id: string; name: string; category: string }[]
}

export function OnboardingForm({ initial, hobbies }: OnboardingFormProps) {
  const [name, setName] = useState(initial.display_name)
  const [location, setLocation] = useState(initial.location)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const categories = useMemo(() => {
    const set = new Set<string>()
    hobbies.forEach((h) => set.add(h.category))
    return Array.from(set)
  }, [hobbies])

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (selected.size < 3) {
      setError("관심사를 3개 이상 선택해주세요")
      return
    }
    startTransition(async () => {
      const r = await completeOnboarding({
        display_name: name,
        location,
        hobby_ids: Array.from(selected),
      })
      if (!r.ok) setError(r.message)
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="display_name">이름</Label>
        <Input
          id="display_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          required
          placeholder="홍길동"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">지역 (선택)</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={100}
          placeholder="예: 서울 마포구"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>관심사 (최소 3개)</Label>
          <span className="text-sm text-muted-foreground">선택: {selected.size}</span>
        </div>
        {categories.map((cat) => (
          <div key={cat} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{cat}</p>
            <div className="flex flex-wrap gap-2">
              {hobbies
                .filter((h) => h.category === cat)
                .map((h) => {
                  const isOn = selected.has(h.id)
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggle(h.id)}
                      aria-pressed={isOn}
                      className="transition-colors"
                    >
                      <Badge
                        variant={isOn ? "default" : "outline"}
                        className="px-3 py-1 gap-1 cursor-pointer"
                      >
                        {isOn && <Check aria-hidden="true" className="w-3 h-3" />}
                        {h.name}
                      </Badge>
                    </button>
                  )
                })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
        >
          {error}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full h-11">
        {isPending ? "저장 중..." : "시작하기"}
      </Button>
    </form>
  )
}
