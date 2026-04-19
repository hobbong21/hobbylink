"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Check, Loader2 } from "lucide-react"
import { sendPhoneOtp, verifyPhoneOtp } from "./actions"

interface PhoneFormProps {
  initialPhone: string | null
  verified: boolean
}

type Stage = "idle" | "awaiting-otp"

export function PhoneForm({ initialPhone, verified }: PhoneFormProps) {
  const [phone, setPhone] = useState(initialPhone ?? "")
  const [otp, setOtp] = useState("")
  const [stage, setStage] = useState<Stage>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [messageKind, setMessageKind] = useState<"error" | "success" | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onSend = () => {
    setMessage(null)
    setMessageKind(null)
    startTransition(async () => {
      const r = await sendPhoneOtp(phone)
      if (r.ok) {
        setStage("awaiting-otp")
        setMessageKind("success")
        setMessage("인증번호를 전송했습니다. 5분 이내 입력해주세요.")
      } else {
        setMessageKind("error")
        setMessage(r.message)
      }
    })
  }

  const onVerify = () => {
    setMessage(null)
    setMessageKind(null)
    startTransition(async () => {
      const r = await verifyPhoneOtp(phone, otp)
      if (r.ok) {
        setMessageKind("success")
        setMessage("인증이 완료되었습니다")
        setStage("idle")
        setOtp("")
        router.refresh()
      } else {
        setMessageKind("error")
        setMessage(r.message)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">전화번호</Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+821012345678"
              autoComplete="tel"
              disabled={isPending || stage === "awaiting-otp"}
              className="pl-9"
            />
          </div>
          {verified && (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
              <Check className="w-4 h-4" aria-hidden="true" /> 인증됨
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          국가번호 포함 국제 형식 (예: +821012345678)
        </p>
      </div>

      {stage === "awaiting-otp" && (
        <div className="space-y-2">
          <Label htmlFor="otp">인증번호</Label>
          <Input
            id="otp"
            inputMode="numeric"
            pattern="[0-9]*"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            maxLength={8}
            autoComplete="one-time-code"
            disabled={isPending}
          />
        </div>
      )}

      {message && (
        <div
          role={messageKind === "error" ? "alert" : "status"}
          aria-live="polite"
          className={
            messageKind === "error"
              ? "text-sm p-2 rounded border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
              : "text-sm p-2 rounded border border-green-200 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900"
          }
        >
          {message}
        </div>
      )}

      <div className="flex items-center gap-2">
        {stage === "idle" ? (
          <Button type="button" onClick={onSend} disabled={isPending || !phone}>
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />}
            {verified ? "번호 변경 / 재인증" : "인증번호 받기"}
          </Button>
        ) : (
          <>
            <Button type="button" onClick={onVerify} disabled={isPending || otp.length < 4}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />}
              확인
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStage("idle")
                setOtp("")
                setMessage(null)
                setMessageKind(null)
              }}
              disabled={isPending}
            >
              다시 받기
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
