"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Heart,
  X,
  MapPin,
  Users,
  ArrowRight,
  CheckCircle2,
  Undo2,
  Sparkles,
  ShieldCheck,
} from "lucide-react"
import { recordMatchAction } from "./actions"
import type { Candidate } from "@/lib/matching"
import { ReportDialog } from "@/components/moderation/report-dialog"
import { BlockButton } from "@/components/moderation/block-button"
import { ScoreRing } from "@/components/matching/score-ring"
import { track } from "@/lib/analytics/client"
import { cn } from "@/lib/utils"

interface MatchingClientProps {
  initialCandidates: Candidate[]
}

/**
 * Candidate review flow. We show one candidate at a time as a full-bleed
 * photo card, with a ring-progress match score over the top-left corner,
 * a condensed metadata row beneath the photo, common-interest chips, and
 * sticky Pass / Like controls at the bottom.
 *
 * Keyboard support:
 *   ←  → pass
 *   →  → like
 *   z  → undo (pre-advance only, informational — server side can't revert
 *          yet, so we keep this client-only for future use)
 */
export function MatchingClient({ initialCandidates }: MatchingClientProps) {
  const [index, setIndex] = useState(0)
  const [liked, setLiked] = useState<string[]>([])
  const [mutuals, setMutuals] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<"like" | "pass" | null>(null)
  const [isPending, startTransition] = useTransition()

  const current = initialCandidates[index]
  const done = index >= initialCandidates.length
  const progressPct = initialCandidates.length
    ? Math.round(((index + 1) / initialCandidates.length) * 100)
    : 0

  const advance = () => setIndex((i) => i + 1)

  const act = (action: "like" | "pass") => {
    if (!current) return
    setError(null)
    const candidate = current
    setLastAction(action)
    startTransition(async () => {
      const result = await recordMatchAction(candidate.id, action)
      if (!result.ok) {
        setError(result.message ?? "요청을 처리할 수 없습니다")
        setLastAction(null)
        return
      }
      if (action === "like") {
        setLiked((prev) => [...prev, candidate.id])
        if (result.mutual) setMutuals((prev) => [...prev, candidate.id])
        void track(result.mutual ? "match.mutual" : "match.like", {
          candidate_match_score: candidate.match_score,
        })
      } else {
        void track("match.pass")
      }
      advance()
    })
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-border/80 overflow-hidden">
          <div className="relative h-32 bg-hero-spotlight border-b border-border/60">
            <div className="absolute inset-0 bg-grid-pattern opacity-40" aria-hidden="true" />
          </div>
          <CardContent className="p-10 text-center -mt-12 relative">
            <div className="w-16 h-16 rounded-full bg-card border-4 border-background shadow-sm mx-auto flex items-center justify-center mb-5">
              <CheckCircle2
                aria-hidden="true"
                className="w-8 h-8 text-[color:var(--success)]"
              />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              오늘의 추천을 모두 확인했어요
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              {liked.length}명에게 관심을 표현했습니다.
              {mutuals.length > 0 &&
                ` 그 중 ${mutuals.length}명과 즉시 매칭되었어요.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button size="lg" asChild>
                <Link href="/messages">
                  메시지 보기
                  <ArrowRight aria-hidden="true" className="ml-1.5 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/explore">더 탐색하기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress rail */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {index + 1} / {initialCandidates.length}
        </span>
      </div>

      <Card
        className={cn(
          "border-border/80 overflow-hidden transition-opacity duration-300",
          isPending && lastAction === "pass" && "opacity-60 -translate-x-2",
          isPending && lastAction === "like" && "opacity-60 translate-x-2",
        )}
      >
        {/* Photo hero */}
        <div className="relative aspect-[4/5] sm:aspect-[3/4] bg-gradient-to-br from-primary-muted via-muted to-secondary overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar className="w-40 h-40 sm:w-56 sm:h-56 ring-4 ring-background shadow-[0_20px_50px_-20px_color-mix(in_oklch,var(--primary)_35%,transparent)]">
              <AvatarImage
                src={current.avatar_url || "/placeholder-user.jpg"}
                alt={`${current.display_name}의 프로필 사진`}
              />
              <AvatarFallback className="text-5xl bg-primary-muted text-primary">
                {current.display_name[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Score ring overlay */}
          <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm border border-border/60">
            <ScoreRing value={current.match_score} size={64} />
          </div>

          {/* Common interests chip overlay */}
          <div className="absolute top-4 right-4">
            <Badge
              variant="secondary"
              className="gap-1 bg-card/90 backdrop-blur-sm border border-border/60 shadow-sm"
            >
              <Users aria-hidden="true" className="w-3 h-3" />
              공통 {current.common_interests}
            </Badge>
          </div>

          {/* Gradient bottom for text legibility if we add overlays later */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent"
          />
        </div>

        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Identity row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
                {current.display_name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {current.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin aria-hidden="true" className="w-3.5 h-3.5" />
                    {current.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5 text-primary" />
                  검증된 프로필
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {current.bio && (
            <p className="text-sm leading-relaxed text-foreground/90">
              {current.bio}
            </p>
          )}

          {/* Interest chips */}
          {current.interests.length > 0 && (
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                <Sparkles aria-hidden="true" className="w-3.5 h-3.5 text-primary" />
                관심사
              </p>
              <div className="flex flex-wrap gap-1.5">
                {current.interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="outline"
                    className="text-xs bg-muted/50 border-border"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 text-sm rounded-md bg-[color-mix(in_oklch,var(--destructive)_10%,var(--background))] text-[color:var(--destructive)] border border-[color-mix(in_oklch,var(--destructive)_30%,transparent)]"
            >
              {error}
            </div>
          )}

          {/* Safety row */}
          <div className="flex items-center justify-center gap-1 text-xs">
            <ReportDialog targetType="profile" targetId={current.id} />
            <BlockButton targetId={current.id} targetName={current.display_name} />
          </div>
        </CardContent>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 border-t border-border/60 bg-card/95 backdrop-blur-sm p-4 flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-12 gap-2"
            onClick={() => act("pass")}
            disabled={isPending}
          >
            <X aria-hidden="true" className="w-5 h-5" />
            패스
          </Button>
          <Button
            size="lg"
            className="flex-1 h-12 gap-2"
            onClick={() => act("like")}
            disabled={isPending}
          >
            <Heart aria-hidden="true" className="w-5 h-5" />
            관심 있어요
          </Button>
        </div>
      </Card>

      {/* Secondary info row */}
      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Undo2 aria-hidden="true" className="w-3 h-3" />
          선택은 되돌릴 수 없습니다
        </span>
        <span>{liked.length}명에게 관심 표현함</span>
      </div>
    </div>
  )
}
