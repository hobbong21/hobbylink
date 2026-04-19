# Sub-Processors / 수탁처리 목록

Effective: {{EFFECTIVE_DATE}}

To operate HobbyLink we engage the following sub-processors. Each has signed
a Data Processing Addendum (DPA) with Standard Contractual Clauses (SCCs)
where applicable.

| Sub-processor | Service | Data categories | Location | Certifications |
|---|---|---|---|---|
| Supabase Inc. | Database, auth, storage | All personal data | AWS ap-northeast-2 (Seoul) | SOC 2 Type II, HIPAA |
| Vercel Inc. | Web hosting, CDN | Usage logs, cookies | Global edge (US primary) | SOC 2, ISO 27001 |
| Stripe, Inc. | Payments | Card, billing, email | US + EU | PCI-DSS Level 1, SOC 1/2/3 |
| Resend Inc. | Transactional email | Email, message content | US | SOC 2 Type II |
| Twilio Inc. | SMS & OTP | Phone number, IP | US | SOC 2, ISO 27001 |
| Sentry (Functional Software, Inc.) | Error monitoring | Stack traces, email, IP | US | SOC 2 Type II |
| Kakao Corp. | Map tiles | IP (no account data sent) | KR | - |
| Cloudflare Inc. | DDoS, DNS (if used) | IP, request headers | Global edge | SOC 2, ISO 27001 |

## 갱신 정책

- 신규 sub-processor 추가 시 최소 **30일 전** 본 페이지 게시
- 중대한 변경(데이터 카테고리 확대 등) 시 이메일 공지
- 목록 문의: {{DPO_EMAIL}}

## GDPR & CCPA Statements

- 모든 해외 이전은 SCC 2021 (Module 2) + 추가 보호조치 적용
- Stripe·Resend·Twilio·Sentry는 EU-US Data Privacy Framework 인증 검증 완료
- CCPA 목적상 위 수탁처리는 "sale" 또는 "sharing"에 해당하지 않음
