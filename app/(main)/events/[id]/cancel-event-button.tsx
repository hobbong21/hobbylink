"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Trash2 } from "lucide-react"
import { cancelEvent } from "../actions"

interface CancelEventButtonProps {
  eventId: string
  /** If true, the event is part of a recurring series — show scope options. */
  isSeriesInstance?: boolean
}

type Scope = "one" | "series" | "future"

export function CancelEventButton({
  eventId,
  isSeriesInstance = false,
}: CancelEventButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<Scope>("one")
  const [isPending, startTransition] = useTransition()

  const onConfirm = () => {
    setError(null)
    startTransition(async () => {
      const r = await cancelEvent(eventId, { scope })
      if (!r.ok) {
        setError(r.message)
        return
      }
      setOpen(false)
      router.push("/my-events")
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 aria-hidden="true" className="w-4 h-4" />
          모임 취소
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>모임을 취소할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            이 작업은 되돌릴 수 없습니다. 참가자 정보, 사진, 후기가 모두 함께 삭제됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isSeriesInstance && (
          <RadioGroup
            value={scope}
            onValueChange={(v) => setScope(v as Scope)}
            className="space-y-2"
          >
            <label
              htmlFor="scope-one"
              className="flex items-start gap-3 rounded-md border p-3 cursor-pointer"
            >
              <RadioGroupItem id="scope-one" value="one" className="mt-1" />
              <div>
                <p className="text-sm font-medium">이 모임만</p>
                <p className="text-xs text-muted-foreground">
                  선택한 단일 회차만 삭제합니다.
                </p>
              </div>
            </label>
            <label
              htmlFor="scope-future"
              className="flex items-start gap-3 rounded-md border p-3 cursor-pointer"
            >
              <RadioGroupItem id="scope-future" value="future" className="mt-1" />
              <div>
                <p className="text-sm font-medium">이 모임과 이후 모든 반복</p>
                <p className="text-xs text-muted-foreground">
                  동일 시리즈의 이후 회차까지 일괄 삭제합니다.
                </p>
              </div>
            </label>
            <label
              htmlFor="scope-series"
              className="flex items-start gap-3 rounded-md border p-3 cursor-pointer"
            >
              <RadioGroupItem id="scope-series" value="series" className="mt-1" />
              <div>
                <p className="text-sm font-medium">시리즈 전체</p>
                <p className="text-xs text-muted-foreground">
                  과거·현재·미래 모든 회차를 삭제합니다.
                </p>
              </div>
            </label>
          </RadioGroup>
        )}

        {error && (
          <div role="alert" className="text-sm text-red-600">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? "삭제 중..." : "모임 삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
