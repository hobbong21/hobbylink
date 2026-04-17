import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "소개",
  description:
    "HobbyLink는 취미로 연결되는 새로운 세상을 지향합니다. 같은 관심사를 가진 사람들과 오프라인 모임을 만들어보세요.",
}

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-4">HobbyLink 소개</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            HobbyLink는 취미를 중심으로 오프라인 모임을 쉽게 찾고 만들 수 있는 플랫폼입니다.
            관심사가 겹치는 사람을 추천하고, 지역과 시간대에 맞는 모임을 제안하여 실제 만남을
            이끌어냅니다.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-semibold">우리가 추구하는 가치</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>안전하고 신뢰할 수 있는 오프라인 만남</li>
              <li>관심사 기반 스마트 매칭</li>
              <li>누구나 쉽게 주최하고 참여할 수 있는 모임 경험</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
