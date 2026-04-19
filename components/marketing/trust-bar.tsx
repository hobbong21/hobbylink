import { Shield, BadgeCheck, Star, Lock, Users } from "lucide-react"

/**
 * Trust signal strip rendered beneath the hero. Mirrors what fintech and
 * B2B SaaS landing pages use — small rows of verifiable metrics that
 * signal the product is real without shouting.
 */
export function TrustBar() {
  const items = [
    { icon: Shield, label: "전화번호 인증 98%", description: "실사용자 검증" },
    { icon: BadgeCheck, label: "평균 평점 4.8 / 5", description: "10,000+ 리뷰" },
    { icon: Users, label: "누적 모임 50,000+", description: "전국 76개 지역" },
    { icon: Lock, label: "신고·차단 24시간 대응", description: "전담 팀 운영" },
    { icon: Star, label: "주간 활성 사용자 92%", description: "재방문율 기준" },
  ]
  return (
    <section
      aria-label="신뢰 지표"
      className="border-y border-border/70 bg-elevated/60 backdrop-blur-sm"
    >
      <div className="container mx-auto px-4 py-4">
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {items.map((item) => (
            <li
              key={item.label}
              className="inline-flex items-center gap-2 text-xs sm:text-sm"
            >
              <item.icon
                aria-hidden="true"
                className="w-4 h-4 text-primary flex-shrink-0"
              />
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground hidden md:inline">
                · {item.description}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
