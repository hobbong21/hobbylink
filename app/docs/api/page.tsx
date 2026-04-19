import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Key } from "lucide-react"

export const metadata = {
  title: "HobbyLink 공개 API",
  description: "HobbyLink 공개 읽기 전용 API 문서",
}

/**
 * Public, unauthenticated documentation page. Integrators land here from
 * their IDE, copy the curl snippets, and then sign in to get a key.
 */
export default function PublicApiDocsPage() {
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            공개 API · v1
          </div>
          <h1 className="text-4xl font-bold mt-1">HobbyLink Public API</h1>
          <p className="text-muted-foreground mt-2">
            모임/취미 카탈로그를 읽기 전용으로 노출하는 HTTP API입니다. 가입한
            계정에서 키를 발급해 사용합니다.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button asChild size="sm">
              <Link href="/settings/api-keys" className="gap-1">
                <Key className="w-4 h-4" aria-hidden="true" />
                API 키 발급
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/api/public/v1/openapi">OpenAPI 스펙 JSON</Link>
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>인증</CardTitle>
            <CardDescription>모든 요청에 API 키가 필요합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
              <code>{`curl https://hobbylink.example/api/public/v1/events \\
  -H "Authorization: Bearer hbl_xxxxxxxxxxxxxxxxxxxx"`}</code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>요금제</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">티어</th>
                  <th>분당 호출</th>
                  <th>가격</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">free</td>
                  <td>60</td>
                  <td>무료</td>
                </tr>
                <tr>
                  <td className="py-2">pro</td>
                  <td>600</td>
                  <td>문의</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-2">
              레이트 리밋 초과 시 429 응답과 `Retry-After` 헤더가 반환됩니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <code className="font-mono text-sm">GET /events</code>
            </CardTitle>
            <CardDescription>다가오는 공개 모임 목록</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">쿼리 파라미터</p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>
                <code>limit</code> — 1~100, 기본 20
              </li>
              <li>
                <code>cursor</code> — ISO 타임스탬프. 해당 시간 이후 이벤트만 반환
              </li>
              <li>
                <code>tag</code> — 태그 이름 필터 (대소문자 무시)
              </li>
            </ul>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto mt-3">
              <code>{`{
  "data": [
    {
      "id": "…",
      "title": "주말 배드민턴",
      "event_date": "2026-05-02T10:00:00Z",
      "location": "서울 강남구",
      "max_participants": 12,
      "price_cents": 0,
      "currency": "KRW"
    }
  ],
  "next_cursor": "2026-05-02T10:00:00Z"
}`}</code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <code className="font-mono text-sm">GET /hobbies</code>
            </CardTitle>
            <CardDescription>전체 취미 카탈로그 (회원 수 내림차순)</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
              <code>{`{
  "data": [
    {
      "id": "…",
      "name": "러닝",
      "category": "운동",
      "member_count": 5120,
      "is_featured": true
    }
  ]
}`}</code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>에러 형식</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
              <code>{`{
  "error": {
    "code": "rate_limited",
    "message": "Too many requests. Retry in 42s."
  }
}`}</code>
            </pre>
            <ul className="text-xs text-muted-foreground mt-3 space-y-1">
              <li>
                <code>missing_api_key</code> / <code>invalid_api_key</code> / <code>revoked_api_key</code> — 401
              </li>
              <li>
                <code>rate_limited</code> — 429 (`Retry-After` 헤더 포함)
              </li>
              <li>
                <code>query_failed</code> / <code>server_misconfigured</code> — 500
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
