"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

export function CopyLink({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API may be blocked — silently ignore
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={onClick} className="gap-1">
      {copied ? (
        <>
          <Check aria-hidden="true" className="w-4 h-4" />
          복사됨
        </>
      ) : (
        <>
          <Copy aria-hidden="true" className="w-4 h-4" />
          복사
        </>
      )}
    </Button>
  )
}
