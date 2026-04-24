"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { MatchTuning } from "@/lib/matching-tuning-types"

/**
 * Client-side preview that mirrors the server scorer in `lib/matching.ts`.
 * It reads the admin's pending tuning values from the hidden
 * `#tuning-snapshot` node dropped by TuningForm, re-scores a fixed sample
 * of candidates, and renders them sorted. No network call — just a sanity
 * check before the admin hits Save.
 *
 * Sample shape matches `Candidate` minus fields the scorer doesn't need.
 */

export interface PreviewCandidate {
  id: string
  display_name: string
  bio: string | null
  my_location: string
  their_location: string | null
  total_my_hobbies: number
  common_hobbies: number
  last_active_at: string | null
}

const SAMPLES: PreviewCandidate[] = [
  {
    id: "sample-1",
    display_name: "강남 배드민턴 러버",
    bio: "주말에 배드민턴·러닝 같이 하실 분!",
    my_location: "서울 강남구",
    their_location: "서울 강남구",
    total_my_hobbies: 5,
    common_hobbies: 4,
    last_active_at: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
  },
  {
    id: "sample-2",
    display_name: "부산 보드게임 모임장",
    bio: "신생 보드게임 모임 운영 중",
    my_location: "서울 강남구",
    their_location: "부산 해운대구",
    total_my_hobbies: 5,
    common_hobbies: 4,
    last_active_at: new Date(Date.now() - 20 * 60 * 60_000).toISOString(),
  },
  {
    id: "sample-3",
    display_name: "관심사 겹침 낮음 (하나만)",
    bio: "대체로 혼자 등산",
    my_location: "서울 강남구",
    their_location: "서울 종로구",
    total_my_hobbies: 5,
    common_hobbies: 1,
    last_active_at: new Date(Date.now() - 4 * 24 * 60 * 60_000).toISOString(),
  },
  {
    id: "sample-4",
    display_name: "휴면 사용자 (30일 전)",
    bio: "한동안 접속 안 함",
    my_location: "서울 강남구",
    their_location: "서울 강남구",
    total_my_hobbies: 5,
    common_hobbies: 3,
    last_active_at: new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString(),
  },
  {
    id: "sample-5",
    display_name: "관심사 풍부 + 원거리",
    bio: "모든 것을 좋아함",
    my_location: "서울 강남구",
    their_location: "제주 서귀포시",
    total_my_hobbies: 5,
    common_hobbies: 5,
    last_active_at: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
]

function score(c: PreviewCandidate, t: MatchTuning): {
  total: number
  overlap: number
  locationBonus: number
  recencyBonus: number
} {
  const overlap = Math.min(
    100,
    Math.round((c.common_hobbies / c.total_my_hobbies) * t.overlap_weight),
  )
  let locationBonus = 0
  const mine = c.my_location.toLowerCase().trim()
  const theirs = (c.their_location ?? "").toLowerCase().trim()
  if (mine && theirs) {
    if (mine === theirs) locationBonus = t.location_exact_bonus
    else if (mine.split(/\s+/)[0] === theirs.split(/\s+/)[0])
      locationBonus = t.location_region_bonus
  }
  let recencyBonus = 0
  if (c.last_active_at) {
    const delta = Date.now() - new Date(c.last_active_at).getTime()
    if (delta <= 48 * 60 * 60_000) recencyBonus = t.recency_48h_bonus
    else if (delta <= 7 * 24 * 60 * 60_000) recencyBonus = t.recency_7d_bonus
  }
  return {
    overlap,
    locationBonus,
    recencyBonus,
    total: Math.min(100, overlap + locationBonus + recencyBonus),
  }
}

interface LivePreviewProps {
  initial: MatchTuning
}

export function LivePreview({ initial }: LivePreviewProps) {
  const [tuning, setTuning] = useState<MatchTuning>(initial)

  // Poll the hidden form snapshot every 250ms — cheap, avoids prop drilling
  // and keeps TuningForm as its own island.
  useEffect(() => {
    const id = window.setInterval(() => {
      const node = document.getElementById("tuning-snapshot")
      const raw = node?.getAttribute("data-tuning")
      if (!raw) return
      try {
        const parsed = JSON.parse(raw) as MatchTuning
        setTuning((prev) =>
          JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed,
        )
      } catch {
        /* ignore parse errors */
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [])

  const scored = SAMPLES.map((c) => ({ ...c, ...score(c, tuning) })).sort(
    (a, b) => b.total - a.total,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>실시간 미리보기</CardTitle>
        <CardDescription>
          현재 슬라이더 값으로 샘플 후보들의 매칭 점수를 계산합니다. 실제 사용자
          데이터가 아닙니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {scored.map((c) => (
            <li key={c.id} className="border rounded-md p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm truncate">{c.display_name}</p>
                <span
                  className={
                    c.total >= 70
                      ? "text-lg font-bold text-green-600 dark:text-green-400"
                      : c.total >= 40
                        ? "text-lg font-bold text-amber-600 dark:text-amber-400"
                        : "text-lg font-bold text-muted-foreground"
                  }
                >
                  {c.total}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                겹침 {c.common_hobbies}/{c.total_my_hobbies} · {c.their_location ?? "지역 없음"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <Chip label={`겹침 ${c.overlap}`} />
                <Chip label={`위치 +${c.locationBonus}`} />
                <Chip label={`최근 +${c.recencyBonus}`} />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-[2px] bg-muted/40">
      {label}
    </span>
  )
}
