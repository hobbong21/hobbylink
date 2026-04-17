import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = { title: "채용" }

export default function CareersPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">채용</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            현재 공개된 포지션이 없습니다. 함께하고 싶다면{" "}
            <a
              className="text-primary underline"
              href="mailto:careers@hobbylink.example"
            >
              careers@hobbylink.example
            </a>
            로 제안을 주세요.
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
