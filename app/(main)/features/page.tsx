import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MessageCircle, MapPin, Sparkles, Users, Shield } from "lucide-react"

export const metadata: Metadata = { title: "기능" }

const features = [
  {
    icon: Sparkles,
    title: "관심사 기반 스마트 매칭",
    description: "공유 관심사 수에 따른 매칭 점수로 가장 잘 맞는 사람을 찾아드립니다.",
  },
  {
    icon: MessageCircle,
    title: "실시간 메시지",
    description: "Supabase Realtime 기반의 즉각적인 메시지 전송·수신 경험.",
  },
  {
    icon: MapPin,
    title: "위치 기반 오프라인 모임",
    description: "Kakao Maps와 반경 필터로 주변의 모임을 바로 찾고 참가.",
  },
  {
    icon: Users,
    title: "커뮤니티 + 팔로잉 피드",
    description: "관심사가 비슷한 사람을 팔로우하고 피드에서 소식을 받아보세요.",
  },
  {
    icon: Heart,
    title: "이벤트 후기와 사진 갤러리",
    description: "모임 참가 후 별점과 후기를 남기고, 함께 찍은 사진을 공유합니다.",
  },
  {
    icon: Shield,
    title: "안전한 환경",
    description: "신고·차단·관리자 조치 + RLS 기반의 데이터 보안.",
  },
]

export default function FeaturesPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold">기능</h1>
          <p className="text-muted-foreground mt-2">HobbyLink가 제공하는 주요 기능들</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <Card key={f.title}>
                <CardHeader>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Icon aria-hidden="true" className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}
