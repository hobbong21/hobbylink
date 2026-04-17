import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { CheckoutButton } from "./checkout-button"

export const metadata: Metadata = {
  title: "요금제",
  description: "HobbyLink 무료 / 프리미엄 요금제 비교.",
}

const tiers = [
  {
    name: "무료",
    price: "₩0",
    period: "영원히",
    features: [
      "관심사 기반 매칭",
      "오프라인 모임 참여",
      "기본 커뮤니티 이용",
      "1일 10회 좋아요",
    ],
    cta: { label: "지금 시작하기", href: "/signup" },
    highlight: false,
  },
  {
    name: "프리미엄",
    price: "₩9,900",
    period: "월간",
    features: [
      "무제한 좋아요",
      "매칭 우선 노출",
      "읽음 확인 표시",
      "광고 없는 경험",
      "프리미엄 뱃지",
    ],
    cta: { label: "프리미엄 시작 (준비 중)", href: "#" },
    highlight: true,
  },
]

export default function PricingPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold">요금제</h1>
          <p className="text-muted-foreground mt-2">필요에 맞는 플랜을 선택하세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={tier.highlight ? "border-primary border-2 shadow-lg" : ""}
            >
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{tier.price}</span>{" "}
                  / {tier.period}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        aria-hidden="true"
                        className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                {tier.highlight ? (
                  <CheckoutButton />
                ) : (
                  <Button asChild className="w-full">
                    <Link href={tier.cta.href}>{tier.cta.label}</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-8">
          결제는 곧 지원될 예정입니다. Stripe 및 토스페이먼츠를 검토 중입니다.
        </p>
      </div>
    </main>
  )
}
