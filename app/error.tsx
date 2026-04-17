"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log client-side errors for observability. If Sentry is configured, it
    // will also pick this up via its global error handler.
    // eslint-disable-next-line no-console
    console.error("[root-error-boundary]", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-bold">문제가 발생했어요</h1>
        <p className="text-muted-foreground">
          예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-muted-foreground">
            에러 ID: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <Button onClick={() => reset()}>다시 시도</Button>
          <Button variant="outline" asChild>
            <Link href="/">홈으로</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
