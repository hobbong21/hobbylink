import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "도움말" }

const sections = [
  { title: "시작하기", href: "/signup", description: "계정을 만들고 HobbyLink 시작하기" },
  { title: "관심사 추가", href: "/interests", description: "관심 있는 취미를 추가하면 매칭이 시작됩니다" },
  { title: "모임 만들기", href: "/events/new", description: "오프라인 모임을 기획하고 참가자를 모집" },
  { title: "자주 묻는 질문", href: "/faq", description: "다른 사용자들도 자주 궁금해하는 내용" },
  { title: "문의하기", href: "/contact", description: "해결이 안 되면 언제든 연락주세요" },
]

export default function HelpPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">도움말 센터</h1>
        <p className="text-muted-foreground mb-8">
          HobbyLink 이용에 필요한 안내를 모아두었습니다.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections.map((s) => (
            <Link key={s.href} href={s.href}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{s.title}</CardTitle>
                  <CardDescription>{s.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-primary">바로가기 →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
