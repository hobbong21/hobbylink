"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Flag } from "lucide-react"
import { submitReport } from "@/lib/moderation/actions"

type ReportTargetType = "profile" | "post" | "comment" | "event" | "message"

interface ReportDialogProps {
  targetType: ReportTargetType
  targetId: string
  /** Optional custom trigger button. Defaults to a compact ghost button. */
  trigger?: React.ReactNode
}

export function ReportDialog({ targetType, targetId, trigger }: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "ok" } | { kind: "error"; message: string }
  >({ kind: "idle" })
  const [isPending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    setStatus({ kind: "idle" })
    formData.set("target_type", targetType)
    formData.set("target_id", targetId)
    startTransition(async () => {
      const result = await submitReport(formData)
      if (result.ok) {
        setStatus({ kind: "ok" })
        setTimeout(() => setOpen(false), 1500)
      } else {
        setStatus({ kind: "error", message: result.message })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Flag aria-hidden="true" className="w-4 h-4" />
            신고
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>신고하기</DialogTitle>
            <DialogDescription>
              부적절한 내용, 스팸, 괴롭힘 등을 신고해주세요. 담당자가 빠르게 검토합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label htmlFor="report-reason">신고 사유</Label>
            <Textarea
              id="report-reason"
              name="reason"
              rows={4}
              maxLength={500}
              required
              placeholder="어떤 부분이 문제였는지 구체적으로 알려주세요."
            />
            {status.kind === "error" && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
              >
                {status.message}
              </div>
            )}
            {status.kind === "ok" && (
              <div
                role="status"
                aria-live="polite"
                className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md"
              >
                신고가 접수되었습니다. 검토 후 조치하겠습니다.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isPending || status.kind === "ok"}>
              {isPending ? "전송 중..." : "신고하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
