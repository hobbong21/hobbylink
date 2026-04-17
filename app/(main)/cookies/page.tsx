import type { Metadata } from "next"

export const metadata: Metadata = { title: "쿠키 정책" }

export default function CookiesPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
        <h1>쿠키 정책</h1>
        <p className="text-muted-foreground">
          본 문서는 샘플 문구입니다. 실제 서비스 런칭 전 법무 검토를 거쳐 교체하세요.
        </p>
        <h2>1. 사용 목적</h2>
        <p>로그인 세션 유지, 언어 설정 기억, 서비스 품질 분석에 쿠키를 사용합니다.</p>
        <h2>2. 제3자 쿠키</h2>
        <p>Supabase 인증 쿠키, Vercel Analytics 외에 외부 추적 쿠키를 사용하지 않습니다.</p>
        <h2>3. 거부 권리</h2>
        <p>브라우저 설정에서 쿠키를 차단할 수 있습니다. 단, 일부 기능이 정상 동작하지 않을 수 있습니다.</p>
      </div>
    </main>
  )
}
