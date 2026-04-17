"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Heart,
  X,
  MapPin,
  Star,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { recordMatchAction } from "./actions"
import type { Candidate } from "@/lib/matching"
import { ReportDialog } from "@/components/moderation/report-dialog"
import { BlockButton } from "@/components/moderation/block-button"
import { track } from "@/lib/analytics/client"

interface MatchingClientProps {
  initialCandidates: Candidate[]
}

export function MatchingClient({ initialCandidates }: MatchingClientProps) {
  const [index, setIndex] = useState(0)
  const [liked, setLiked] = useState<string[]>([])
  const [mutuals, setMutuals] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const current = initialCandidates[index]
  const done = index >= initialCandidates.length

  const advance = () => setIndex((i) => i + 1)

  const act = (action: "like" | "pass") => {
    if (!current) return
    setError(null)
    const candidate = current
    startTransition(async () => {
      const result = await recordMatchAction(candidate.id, action)
      if (!result.ok) {
        setError(result.message ?? "요청을 처리할 수 없습니다")
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
        <Card className="border-2">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2
                aria-hidden="true"
                className="w-8 h-8 text-green-600 dark:text-green-400"
              />
            </div>
            <h2 className="text-2xl font-bold mb-3">모든 추천을 확인했어요!</h2>
            <p className="text-muted-foreground mb-6">
              {liked.length}명에게 관심을 표현했습니다.
              {mutuals.length > 0 && ` 그 중 ${mutuals.length}명과 즉시 매칭되었어요!`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href="/messages">
                  메시지 보기
                  <ArrowRight aria-hidden="true" className="ml-2 w-5 h-5" />
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
      <Card className="overflow-hidden border-2 shadow-xl">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star aria-hidden="true" className="w-5 h-5 fill-current" />
              <span className="font-semibold">매칭 점수</span>
            </div>
            <span className="text-2xl font-bold">{current.match_score}%</span>
          </div>
          <Progress value={current.match_score} className="h-2 bg-white/20" />
        </div>

        <div className="relative aspect-[3/4] bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar className="w-64 h-64">
              <AvatarImage
                src={current.avatar_url || "/placeholder-user.jpg"}
                alt={`${current.display_name}의 프로필 사진`}
              />
              <AvatarFallback className="text-6xl">
                {current.display_name[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{current.display_name}</CardTitle>
              {current.location && (
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <MapPin aria-hidden="true" className="w-4 h-4" />
                  <span className="text-sm">{current.location}</span>
                </div>
              )}
            </div>
            <Badge variant="secondary" className="gap-1">
              <Users aria-hidden="true" className="w-3 h-3" />
              {current.common_interests}개 공통
            </Badge>
          </div>
          {current.bio && (
            <CardDescription className="text-base leading-relaxed">
              {current.bio}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {current.interests.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles
                  aria-hidden="true"
                  className="w-4 h-4 text-blue-600 dark:text-blue-400"
                />
                관심사
              </h3>
              <div className="flex flex-wrap gap-2">
                {current.interests.map((interest) => (
                  <Badge key={interest} variant="outline" className="text-sm">
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
              className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md"
            >
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 gap-2 h-14 text-base border-2 bg-transparent"
              onClick={() => act("pass")}
              disabled={isPending}
            >
              <X aria-hidden="true" className="w-5 h-5" />
              패스
            </Button>
            <Button
              size="lg"
              className="flex-1 gap-2 h-14 text-base"
              onClick={() => act("like")}
              disabled={isPending}
            >
              <Heart aria-hidden="true" className="w-5 h-5" />
              관심 있어요
            </Button>
          </div>

          <div className="mt-3 flex justify-center gap-1">
            <ReportDialog targetType="profile" targetId={current.id} />
            <BlockButton targetId={current.id} targetName={current.display_name} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {index + 1} / {initialCandidates.length}
      </div>
    </div>
  )
}
