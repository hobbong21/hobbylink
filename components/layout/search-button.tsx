"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

/**
 * Header search trigger. Opens a command-palette style dialog with an input;
 * Enter submits to /search?q=<query>. Also binds ⌘K / Ctrl+K to open.
 */
export function SearchButton() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="검색 열기"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Search aria-hidden="true" className="w-4 h-4" />
          <span className="hidden md:inline">검색</span>
          <kbd className="hidden md:inline rounded border bg-muted px-1 text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>검색</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-2">
          <Input
            autoFocus
            type="search"
            placeholder="관심사, 모임, 사용자, #해시태그"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="검색어"
          />
          <p className="text-xs text-muted-foreground">
            Enter를 눌러 검색 결과 페이지로 이동합니다.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
