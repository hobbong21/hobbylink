"use client"

import { useMemo, useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Check, Plus, Search } from "lucide-react"
import { toggleInterest } from "./actions"

interface Hobby {
  id: string
  name: string
  category: string
  description: string | null
  image_url: string | null
}

interface InterestsPickerProps {
  hobbies: Hobby[]
  initialSelected: string[]
}

export function InterestsPicker({ hobbies, initialSelected }: InterestsPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [_, startTransition] = useTransition()

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const h of hobbies) set.add(h.category)
    return ["전체", ...Array.from(set).sort()]
  }, [hobbies])

  const [activeCategory, setActiveCategory] = useState("전체")

  const filtered = useMemo(() => {
    return hobbies.filter((h) => {
      const okCat = activeCategory === "전체" || h.category === activeCategory
      const okQuery =
        !query ||
        h.name.toLowerCase().includes(query.toLowerCase()) ||
        h.description?.toLowerCase().includes(query.toLowerCase())
      return okCat && okQuery
    })
  }, [hobbies, activeCategory, query])

  const handleToggle = (hobbyId: string) => {
    setError(null)
    const nowSelected = !selected.has(hobbyId)
    // Optimistic update
    setSelected((prev) => {
      const next = new Set(prev)
      if (nowSelected) next.add(hobbyId)
      else next.delete(hobbyId)
      return next
    })
    setPendingId(hobbyId)
    startTransition(async () => {
      const result = await toggleInterest(hobbyId, nowSelected)
      if (!result.ok) {
        // Revert on failure
        setSelected((prev) => {
          const next = new Set(prev)
          if (nowSelected) next.delete(hobbyId)
          else next.add(hobbyId)
          return next
        })
        setError(result.message ?? "요청을 처리할 수 없습니다")
      }
      setPendingId(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="관심사 검색..."
          className="pl-12 h-11"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="관심사 검색"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={cat === activeCategory ? "default" : "outline"}
            onClick={() => setActiveCategory(cat)}
            className="flex-shrink-0"
          >
            {cat}
          </Button>
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

      <p className="text-sm text-muted-foreground">
        선택한 관심사: {selected.size}개
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((h) => {
          const isSelected = selected.has(h.id)
          const isPending = pendingId === h.id
          return (
            <Card
              key={h.id}
              className={
                isSelected
                  ? "border-2 border-primary transition-colors"
                  : "border-2 hover:border-primary/50 transition-colors"
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg">{h.name}</CardTitle>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {h.category}
                  </Badge>
                </div>
                {h.description && (
                  <CardDescription className="line-clamp-2">{h.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => handleToggle(h.id)}
                  disabled={isPending}
                  aria-pressed={isSelected}
                >
                  {isSelected ? (
                    <>
                      <Check aria-hidden="true" className="w-4 h-4" />
                      선택됨
                    </>
                  ) : (
                    <>
                      <Plus aria-hidden="true" className="w-4 h-4" />
                      추가
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          일치하는 관심사가 없습니다. 다른 검색어를 시도해보세요.
        </p>
      )}
    </div>
  )
}
