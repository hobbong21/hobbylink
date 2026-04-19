import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getMatchTuning, DEFAULT_TUNING } from "@/lib/matching-tuning"
import { TuningForm } from "./tuning-form"
import { LivePreview } from "./live-preview"

export const dynamic = "force-dynamic"

/**
 * Admin-only tuning page. The admin layout already enforces auth + is_admin,
 * so we just fetch the row and hand it to the client form/preview islands.
 *
 * Changes take effect on the next call to `getMatchCandidates` — no deploy
 * or server restart needed.
 */
export default async function AdminMatchingTuningPage() {
  const tuning = await getMatchTuning()
  const supabase = await createClient()

  const { data: meta } = await supabase
    .from("match_tuning")
    .select("updated_at, updated_by, profiles:updated_by(display_name)")
    .eq("id", "current")
    .maybeSingle()

  type MetaRow = {
    updated_at: string
    updated_by: string | null
    profiles: { display_name: string } | null
  }
  const m = meta as MetaRow | null

  const usingDefaults =
    tuning.overlap_weight === DEFAULT_TUNING.overlap_weight &&
    tuning.location_exact_bonus === DEFAULT_TUNING.location_exact_bonus &&
    tuning.location_region_bonus === DEFAULT_TUNING.location_region_bonus &&
    tuning.recency_48h_bonus === DEFAULT_TUNING.recency_48h_bonus &&
    tuning.recency_7d_bonus === DEFAULT_TUNING.recency_7d_bonus

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">매칭 추천 튜닝</h1>
        <p className="text-muted-foreground text-sm mt-1">
          슬라이더를 움직이면 오른쪽에서 샘플 후보들의 점수가 실시간으로 재계산됩니다.
          저장 버튼을 눌러야 실제 매칭 알고리즘에 반영됩니다.
        </p>
        {m && (
          <p className="text-xs text-muted-foreground mt-1">
            마지막 수정:{" "}
            {new Date(m.updated_at).toLocaleString("ko-KR")}{" "}
            {m.profiles?.display_name ? `(${m.profiles.display_name})` : ""}
            {usingDefaults && " · 현재 기본값 사용 중"}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>가중치</CardTitle>
            <CardDescription>각 항목의 점수 기여도</CardDescription>
          </CardHeader>
          <CardContent>
            <TuningForm initial={tuning} />
          </CardContent>
        </Card>

        <LivePreview initial={tuning} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">점수 공식</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p className="font-mono text-xs bg-muted p-3 rounded">
            total = min(100, overlap + locationBonus + recencyBonus)
          </p>
          <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
            <li>
              overlap = round((공통 관심사 / 내 관심사 수) × overlap_weight), 최대 100
            </li>
            <li>
              locationBonus: 정확히 일치 시 location_exact_bonus, 앞 단어만 일치 시 location_region_bonus
            </li>
            <li>
              recencyBonus: 피처 플래그 matching_v2_recency_boost 활성 대상자에게만 적용
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
