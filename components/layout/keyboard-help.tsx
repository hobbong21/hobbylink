"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * Press "?" anywhere to open a cheat-sheet of keyboard shortcuts.
 * Intentionally standalone — no trigger button in the UI. Power users will
 * discover it; casual users won't have to see it.
 */
export function KeyboardHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when a text input is focused.
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>키보드 단축키</DialogTitle>
          <DialogDescription>
            빠르게 이동할 수 있는 핵심 단축키 모음입니다.
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y">
          {[
            { keys: ["⌘", "K"], altKeys: ["Ctrl", "K"], desc: "통합 검색 열기" },
            { keys: ["?"], desc: "이 도움말 열기" },
          ].map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <span>{row.desc}</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {row.keys.map((k) => (
                    <kbd
                      key={k}
                      className="rounded border bg-muted px-2 py-0.5 text-[11px] font-mono"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
                {row.altKeys && (
                  <>
                    <span className="text-muted-foreground text-xs">또는</span>
                    <div className="flex gap-1">
                      {row.altKeys.map((k) => (
                        <kbd
                          key={k}
                          className="rounded border bg-muted px-2 py-0.5 text-[11px] font-mono"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
