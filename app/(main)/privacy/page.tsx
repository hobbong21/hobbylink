import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "개인정보처리방침",
}

export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
        <h1>개인정보처리방침</h1>
        <p className="text-muted-foreground">
          본 문서는 샘플 문구로, 실제 서비스 런칭 전에 법무 검토를 거쳐 교체해야 합니다.
        </p>
        <h2>1. 수집 항목</h2>
        <p>
          HobbyLink는 이메일, 표시 이름, 프로필 이미지(선택), 관심사, 지역 정보를 수집합니다.
        </p>
        <h2>2. 수집 목적</h2>
        <p>서비스 제공, 매칭 알고리즘 개선, 고객 문의 응대.</p>
        <h2>3. 보유 기간</h2>
        <p>회원 탈퇴 시 지체 없이 파기합니다. 관련 법령에 따른 보관 의무가 있는 경우 해당 기간 동안 보관합니다.</p>
        <h2>4. 문의</h2>
        <p>개인정보 보호 책임자에게 이메일(privacy@hobbylink.example)로 문의해주세요.</p>
      </div>
    </main>
  )
}
