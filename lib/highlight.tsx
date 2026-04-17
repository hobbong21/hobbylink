import type { ReactNode } from "react"

/**
 * Splits `text` into plain runs + highlighted runs matching `query` (case-
 * insensitive). Safe against regex special characters.
 *
 * Returns JSX nodes so the caller can render with `<mark>` styling.
 */
export function highlight(text: string, query: string): ReactNode[] {
  if (!query) return [text]
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(`(${escaped})`, "gi")
  const parts = text.split(re)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        className="bg-yellow-200 text-inherit dark:bg-yellow-900 dark:text-yellow-100 rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  )
}
