"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Volume2 } from "lucide-react"

/**
 * Plays the same short beep that BellRealtime uses, so the user can
 * preview what the notification sound will be like before enabling it.
 */
export function TestSoundButton() {
  const ctxRef = useRef<AudioContext | null>(null)

  const play = () => {
    try {
      const AC = (globalThis as { AudioContext?: typeof AudioContext }).AudioContext
      if (!AC) return
      if (!ctxRef.current) ctxRef.current = new AC()
      const ctx = ctxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.22)
      if (
        typeof navigator !== "undefined" &&
        "vibrate" in navigator
      ) {
        ;(navigator as Navigator).vibrate?.(80)
      }
    } catch {
      // ignore — autoplay may still block until user gesture, but this
      // runs from a click so it should always be allowed.
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={play}
      className="gap-2"
    >
      <Volume2 aria-hidden="true" className="w-4 h-4" />
      사운드 테스트
    </Button>
  )
}
