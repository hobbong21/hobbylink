import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageSquare } from "lucide-react"

export const metadata: Metadata = { title: "문의하기" }

export default function ContactPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">문의하기</h1>
        <p className="text-muted-foreground mb-8">
          아래 채널로 문의주시면 빠르게 답변드리겠습니다.
        </p>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail aria-hidden="true" className="w-5 h-5" />
                이메일
              </CardTitle>
              <CardDescription>
                일반 문의: <a href="mailto:support@hobbylink.example" className="text-primary underline">support@hobbylink.example</a>
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare aria-hidden="true" className="w-5 h-5" />
                신고·악용 관련
              </CardTitle>
              <CardDescription>
                계정 내 신고 버튼을 이용하거나{" "}
                <a href="mailto:safety@hobbylink.example" className="text-primary underline">
                  safety@hobbylink.example
                </a>
                로 연락주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                위 이메일 주소는 예시입니다. 배포 전에 실제 운영 이메일로 교체하세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
