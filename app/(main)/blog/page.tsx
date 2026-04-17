import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = { title: "블로그" }

export default function BlogPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">블로그</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            블로그 컨텐츠는 곧 추가될 예정입니다.
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
