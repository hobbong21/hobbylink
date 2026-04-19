# 법무 문서 템플릿

이 폴더의 문서는 오프라인 모임 플랫폼 HobbyLink의 한국·영어권 동시 오픈을
전제로 작성한 **초안**입니다. 각 파일 최상단의 **`[법무 검토 필수]`**
섹션을 지우기 전까지는 실제 사용하지 마세요. 반드시:

1. 국내 변호사 1회 검토 (전자상거래법·개인정보보호법·정보통신망법·청소년 보호법)
2. 영문 템플릿은 GDPR/CCPA 전문 검토 1회
3. 문구 내 플레이스홀더(`{{COMPANY_NAME}}` 등)를 실제 값으로 교체

## 파일 구성

| 파일 | 대상 | 법적 근거 |
|---|---|---|
| `terms.ko.md` | 한국 사용자 | 전자상거래법, 약관규제법 |
| `terms.en.md` | 영어권 | common law terms of service |
| `privacy.ko.md` | 한국 | 개인정보보호법, 정보통신망법 |
| `privacy.en.md` | 영어권 | GDPR (EU) + CCPA (CA) |
| `cookies.md` | 양쪽 | ePrivacy Directive |
| `youth-protection.md` | 한국 | 청소년 보호법 |
| `community-guidelines.md` | 양쪽 | 내부 정책 |
| `sub-processors.md` | 양쪽 | GDPR Art. 28 |
| `dpa-template.md` | B2B | GDPR DPA |

## 플레이스홀더 일괄 치환

```bash
# 예시 — 실제 값으로 교체
sed -i 's/{{COMPANY_NAME}}/주식회사 하비링크/g' docs/legal/*.md
sed -i 's/{{REP_NAME}}/홍길동/g' docs/legal/*.md
sed -i 's/{{COMPANY_ADDRESS}}/서울특별시 강남구 테헤란로 ..../g' docs/legal/*.md
sed -i 's/{{BIZ_REG_NO}}/000-00-00000/g' docs/legal/*.md
sed -i 's/{{ECOMM_REG_NO}}/제0000-서울강남-00000호/g' docs/legal/*.md
sed -i 's/{{SUPPORT_EMAIL}}/support@hobbylink.kr/g' docs/legal/*.md
sed -i 's/{{DPO_NAME}}/김담당/g' docs/legal/*.md
sed -i 's/{{DPO_EMAIL}}/privacy@hobbylink.kr/g' docs/legal/*.md
sed -i 's/{{YOUTH_OFFICER_NAME}}/이보호/g' docs/legal/*.md
sed -i 's/{{EFFECTIVE_DATE}}/2026년 5월 1일/g' docs/legal/*.md
```

## 페이지 배치

최종본 확정 후 `app/(main)/privacy/page.tsx`, `app/(main)/terms/page.tsx`
에 MDX 또는 `react-markdown`으로 렌더링. 언어 탭은 `useLanguage()` 컨텍스트
와 연결.
