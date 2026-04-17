"use client"

import { useEffect, useRef, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Suggestion {
  id: string
  display_name: string
  avatar_url: string | null
}

interface MentionTextareaProps
  extends Omit<React.ComponentProps<typeof Textarea>, "onChange" | "value"> {
  value: string
  onChange: (next: string) => void
}

/**
 * Textarea that shows a @-mention autocomplete popover when the user types
 * "@..." (stopped on whitespace). Arrow keys navigate, Enter inserts,
 * Escape closes.
 *
 * Intentionally stores the mention as plain-text (`@이름`). A full-featured
 * implementation would replace it with a resolvable marker like `@[uuid]`
 * and render it styled; for HobbyLink the text-only form matches existing
 * comment storage.
 */
export function MentionTextarea({
  value,
  onChange,
  onKeyDown,
  ...rest
}: MentionTextareaProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [cursor, setCursor] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  // Re-compute whether a mention token is active at the caret.
  const refreshState = () => {
    const ta = taRef.current
    if (!ta) return
    const pos = ta.selectionStart ?? 0
    const before = value.slice(0, pos)
    // Trigger only when the last @ is not escaped or after whitespace.
    const m = before.match(/(^|\s)@([^\s@]{0,30})$/)
    if (m) {
      setQuery(m[2])
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  useEffect(() => {
    refreshState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    if (!open) {
      setSuggestions([])
      return
    }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const params = new URLSearchParams({ q: query })
    fetch(`/api/mentions/suggest?${params.toString()}`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((body) => setSuggestions((body?.suggestions ?? []) as Suggestion[]))
      .catch(() => {
        // ignore abort
      })
  }, [open, query])

  const insertMention = (s: Suggestion) => {
    const ta = taRef.current
    if (!ta) return
    const pos = ta.selectionStart ?? value.length
    const before = value.slice(0, pos)
    const after = value.slice(pos)
    // Replace the in-progress @token with the selected mention.
    const replaced = before.replace(/(^|\s)@([^\s@]{0,30})$/, `$1@${s.display_name} `)
    const next = replaced + after
    onChange(next)
    setOpen(false)
    // Move caret to just after inserted mention.
    requestAnimationFrame(() => {
      const newPos = replaced.length
      ta.focus()
      ta.setSelectionRange(newPos, newPos)
    })
  }

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setCursor((c) => (c + 1) % suggestions.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setCursor((c) => (c - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        insertMention(suggestions[cursor])
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setOpen(false)
        return
      }
    }
    onKeyDown?.(e)
  }

  return (
    <div className="relative">
      <Textarea
        {...rest}
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && suggestions.length > 0 && (
        <div
          role="listbox"
          aria-label="멘션 제안"
          className="absolute left-0 bottom-full mb-1 w-64 max-h-64 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={i === cursor}
              onMouseDown={(e) => {
                e.preventDefault()
                insertMention(s)
              }}
              onMouseEnter={() => setCursor(i)}
              className={
                i === cursor
                  ? "w-full flex items-center gap-2 px-3 py-2 text-sm bg-accent"
                  : "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50"
              }
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={s.avatar_url ?? "/placeholder-user.jpg"} alt="" />
                <AvatarFallback>{s.display_name[0]}</AvatarFallback>
              </Avatar>
              <span className="truncate">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
