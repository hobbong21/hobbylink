import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Check, Circle } from "lucide-react"

interface Step {
  key: string
  label: string
  href: string
  ctaLabel: string
}

/**
 * 5-step quickstart: display_name set, 3+ hobbies, avatar uploaded, first
 * like sent, first event joined/hosted. Renders a compact progress card
 * with the first unchecked step's CTA prominently shown.
 *
 * Returns null when everything's done so we don't clutter the dashboard.
 */
export async function OnboardingProgressCard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [profile, hobbyCount, likeCount, eventCount] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_hobbies")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["pending", "accepted"]),
    supabase
      .from("event_participants")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["registered", "attended"]),
  ])

  const steps: Array<{ step: Step; done: boolean }> = [
    {
      step: {
        key: "name",
        label: "표시 이름 설정",
        href: "/settings",
        ctaLabel: "이름 설정",
      },
      done: !!profile.data?.display_name,
    },
    {
      step: {
        key: "hobbies",
        label: "관심사 3개 이상",
        href: "/interests",
        ctaLabel: "관심사 추가",
      },
      done: (hobbyCount.count ?? 0) >= 3,
    },
    {
      step: {
        key: "avatar",
        label: "프로필 사진 업로드",
        href: "/settings",
        ctaLabel: "사진 업로드",
      },
      done: !!profile.data?.avatar_url,
    },
    {
      step: {
        key: "first_like",
        label: "첫 좋아요 표현",
        href: "/matching",
        ctaLabel: "매칭 시작",
      },
      done: (likeCount.count ?? 0) >= 1,
    },
    {
      step: {
        key: "first_event",
        label: "오프라인 모임 참가 또는 주최",
        href: "/events",
        ctaLabel: "모임 둘러보기",
      },
      done: (eventCount.count ?? 0) >= 1,
    },
  ]

  const completed = steps.filter((s) => s.done).length
  const total = steps.length
  const percent = Math.round((completed / total) * 100)
  if (completed === total) return null

  const nextStep = steps.find((s) => !s.done)!

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">빠른 시작</CardTitle>
          <span className="text-xs text-muted-foreground">
            {completed} / {total}
          </span>
        </div>
        <Progress value={percent} aria-label={`온보딩 진척 ${percent}%`} />
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-1 text-sm">
          {steps.map((s) => (
            <li
              key={s.step.key}
              className="flex items-center gap-2"
            >
              {s.done ? (
                <Check
                  aria-hidden="true"
                  className="w-4 h-4 text-green-600 flex-shrink-0"
                />
              ) : (
                <Circle
                  aria-hidden="true"
                  className="w-4 h-4 text-muted-foreground flex-shrink-0"
                />
              )}
              <span className={s.done ? "line-through text-muted-foreground" : ""}>
                {s.step.label}
              </span>
            </li>
          ))}
        </ul>
        <Button asChild size="sm" className="w-full">
          <Link href={nextStep.step.href}>{nextStep.step.ctaLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
