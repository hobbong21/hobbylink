"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { followUser, unfollowUser } from "@/lib/follows/actions"
import { UserPlus, UserMinus } from "lucide-react"

interface FollowButtonProps {
  targetId: string
  initialFollowing: boolean
}

export function FollowButton({ targetId, initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const onClick = () => {
    setError(null)
    const next = !following
    setFollowing(next) // optimistic
    startTransition(async () => {
      const result = next ? await followUser(targetId) : await unfollowUser(targetId)
      if (!result.ok) {
        setFollowing(!next) // revert
        setError(result.message)
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size="sm"
        variant={following ? "outline" : "default"}
        onClick={onClick}
        disabled={isPending}
        className="gap-2"
      >
        {following ? (
          <>
            <UserMinus aria-hidden="true" className="w-4 h-4" />
            {isPending ? "처리 중..." : "팔로잉"}
          </>
        ) : (
          <>
            <UserPlus aria-hidden="true" className="w-4 h-4" />
            {isPending ? "처리 중..." : "팔로우"}
          </>
        )}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  )
}
