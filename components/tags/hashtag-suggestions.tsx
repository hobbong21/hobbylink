"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface HashtagSuggestionsProps {
  /** Current post body. Last `#token` determines the suggestion query. */
  content: string
  onInsert: (tagName: string) => void
}

/**
 * Watches the tail of the post body for an in-progress `#token` and shows
 * existing tag names that match. Clicking a suggestion inserts it (replacing
 * the active token).
 */
export function HashtagSuggestions({ content, onInsert }: HashtagSuggestionsProps) {
  const [query, setQuery] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    // Find an in-progress hashtag at the end of the content.
    const match = content.match(/(?:^|\s)#([\p{L}\p{N}_-]{1,40})$/u)
    setQuery(match ? match[1].toLowerCase() : null)
  }, [content])

  useEffect(() => {
    if (!query) {
      setSuggestions([])
      return
    }
    const ctrl = new AbortController()
    fetch(`/api/tags/suggest?q=${encodeURIComponent(query)}`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((body) => setSuggestions(body?.suggestions ?? []))
      .catch(() => {})
    return () => ctrl.abort()
  }, [query])

  if (!query || suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      <span className="text-[10px] text-muted-foreground self-center">추천 태그:</span>
      {suggestions.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onInsert(name)}
          className="transition-colors"
        >
          <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted">
            #{name}
          </Badge>
        </button>
      ))}
    </div>
  )
}
