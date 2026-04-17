import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "이용약관",
}

export default function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
        <h1>이용약관</h1>
        <p className="text-muted-foreground">
          본 문서는 샘플 문구입니다. 실제 서비스 런칭 전 법무 검토를 거쳐 교체하세요.
        </p>
        <h2>1. 서비스 이용</h2>
        <p>회원은 HobbyLink가 제공하는 매칭, 커뮤니티, 모임 기능을 본 약관에 동의한 범위 내에서 이용할 수 있습니다.</p>
        <h2>2. 금지 행위</h2>
        <p>스팸, 괴롭힘, 타인 사칭, 불법 거래를 위한 이용은 금지되며 적발 시 계정이 정지될 수 있습니다.</p>
        <h2>3. 준거법</h2>
        <p>본 약관은 대한민국 법률에 따라 해석됩니다.</p>
      </div>
    </main>
  )
}
