"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Check, Heart } from "lucide-react"
import { toggleInterest } from "../interests/actions"

interface AddHobbyButtonProps {
  hobbyId: string
  initialAdded: boolean
  disabled?: boolean
}

export function AddHobbyButton({
  hobbyId,
  initialAdded,
  disabled,
}: AddHobbyButtonProps) {
  const [added, setAdded] = useState(initialAdded)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (disabled) {
    return (
      <Button size="sm" variant="ghost" asChild>
        <Link href="/login" className="gap-1">
          <Heart aria-hidden="true" className="w-4 h-4" />
          관심
        </Link>
      </Button>
    )
  }

  const onClick = () => {
    setError(null)
    const next = !added
    setAdded(next)
    startTransition(async () => {
      const r = await toggleInterest(hobbyId, next)
      if (!r.ok) {
        setAdded(!next)
        setError(r.message ?? "요청 실패")
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant={added ? "default" : "ghost"}
        className="gap-1"
        onClick={onClick}
        disabled={isPending}
        aria-pressed={added}
      >
        {added ? (
          <>
            <Check aria-hidden="true" className="w-4 h-4" />
            추가됨
          </>
        ) : (
          <>
            <Heart aria-hidden="true" className="w-4 h-4" />
            관심
          </>
        )}
      </Button>
      {error && (
        <span role="alert" className="text-[10px] text-red-600">
          {error}
        </span>
      )}
    </div>
  )
}
