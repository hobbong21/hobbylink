# 런치 준비 인덱스

이번 세션에서 생성된 런치 관련 자료 전체 목록입니다.

## 📘 메인 문서

- [`docs/LAUNCH_RUNBOOK.md`](./LAUNCH_RUNBOOK.md) — 0단계부터 오픈 D-day까지
  10단계 체크리스트 (가장 먼저 읽기)

## ⚖️ 법무 문서 (법무 검토 필수)

- [`docs/legal/README.md`](./legal/README.md) — 플레이스홀더 치환 가이드
- [`docs/legal/terms.ko.md`](./legal/terms.ko.md) — 이용약관 (한)
- [`docs/legal/terms.en.md`](./legal/terms.en.md) — Terms (영)
- [`docs/legal/privacy.ko.md`](./legal/privacy.ko.md) — 개인정보처리방침 (한)
- [`docs/legal/privacy.en.md`](./legal/privacy.en.md) — Privacy Policy (영, GDPR+CCPA)
- [`docs/legal/cookies.md`](./legal/cookies.md) — 쿠키 정책 (한영 혼합)
- [`docs/legal/youth-protection.md`](./legal/youth-protection.md) — 청소년 보호방침
- [`docs/legal/community-guidelines.md`](./legal/community-guidelines.md) — 커뮤니티 가이드라인
- [`docs/legal/sub-processors.md`](./legal/sub-processors.md) — 수탁처리 목록 (GDPR Art. 28)

## 🗃️ 초기 데이터 Seed

- [`scripts/100_seed_hobbies.sql`](../scripts/100_seed_hobbies.sql) — 200+ 취미
- [`scripts/101_seed_tags.sql`](../scripts/101_seed_tags.sql) — 공통 해시태그 30종
- [`scripts/102_seed_achievements.sql`](../scripts/102_seed_achievements.sql) — 업적 12개
- [`scripts/103_seed_announcement.sql`](../scripts/103_seed_announcement.sql) — 오픈 공지 배너

실행 순서 (Supabase SQL Editor에서):
```sql
\i scripts/100_seed_hobbies.sql
\i scripts/101_seed_tags.sql
\i scripts/102_seed_achievements.sql
\i scripts/103_seed_announcement.sql
```
또는 대시보드에서 한 파일씩 붙여넣기 실행.

## 📧 이메일 템플릿

- [`content/email-templates/README.md`](../content/email-templates/README.md) — 브랜드 규칙
- `welcome.ko.html` / `welcome.en.html` — 가입 환영
- `event-reminder.ko.html` — 모임 24h 전
- `password-reset.ko.html` — 비밀번호 재설정

## 📖 운영 콘텐츠

- [`content/faq.md`](../content/faq.md) — FAQ 초안 (카테고리 6개, 질문 24개)

## ✅ 배포 직전 체크 (자기 점검)

### 환경 변수 (Vercel Production)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (server only)
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://hobbylink.kr`
- [ ] `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `RESEND_API_KEY` + `EMAIL_FROM`
- [ ] `NEXT_PUBLIC_KAKAO_MAP_KEY`
- [ ] `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN`
- [ ] `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY`
- [ ] `CRON_SECRET`

### DB 마이그레이션
- [ ] 001-045 순차 실행 완료
- [ ] 100-103 seed 실행
- [ ] `select count(*) from hobbies` 200+
- [ ] `select count(*) from achievements` 12
- [ ] 관리자 계정 승격 (`update profiles set is_admin = true where id = '...'`)

### 3rd-party 연결
- [ ] Stripe Live keys 확인, webhook 엔드포인트 200 응답
- [ ] Resend 도메인 verified, SPF+DKIM 확인
- [ ] Twilio Supabase Auth 연결, test OTP 수신
- [ ] Kakao Maps 도메인 등록, map 로드 OK
- [ ] Sentry test error 전송 OK

### Edge Functions + Cron
- [ ] 4개 함수 배포 완료
- [ ] `select count(*) from cron.job where active = true` = 4

### 법무 문서
- [ ] 변호사 검토 완료 (국내 + 영문)
- [ ] 플레이스홀더 전체 치환
- [ ] `/privacy`, `/terms`, `/cookies` 페이지 배포
- [ ] 회원가입 flow 동의 체크박스 연결

### Smoke Test
- [ ] 런북 8번 항목의 20개 시나리오 통과
- [ ] 접근성: Tab 순회, 스크린리더 기본 확인
- [ ] 모바일 뷰포트 (390×844) 주요 플로우 OK

## 🚀 D-day 실행 순서

1. **D-2**: Seed 실행, 관리자 승격, smoke test 완료
2. **D-1**: Vercel 프로덕션 배포 고정, Resend 발송 테스트
3. **D-day 09:00**: env 재검증, `/api/health` 200, cron 4개 active
4. **D-day 11:00**: announcements 배너 `is_active=true`
5. **D-day 12:00**: 공개 공지 (SNS·커뮤니티)
6. **D-day 12:00-24:00**: Sentry·Resend·Stripe 대시보드 상주 모니터링
7. **D+1 ~ D+7**: 일일 운영 리포트 확인, hot-fix만 배포

## 🆘 긴급 롤백

```
Vercel Dashboard → Deployments → 이전 commit → Promote to Production
```

DB 이슈 시:
```
Supabase Dashboard → Database → Backups → Point-in-time restore (7일)
```

## 📞 긴급 연락처 (본인 채우기)

| 역할 | 이름 | 연락처 | 채널 |
|---|---|---|---|
| 기술 온콜 | | | Slack #alerts |
| 디자인 | | | |
| 법무 검토 | | 변호사 | |
| 개인정보 보호책임자 | {{DPO_NAME}} | {{DPO_EMAIL}} | |
| 청소년 보호 책임자 | {{YOUTH_OFFICER_NAME}} | {{SUPPORT_EMAIL}} | |

---

**이 문서는 모든 런치 관련 자료의 진입점입니다.** 오픈 전 팀 전체가 한 번씩
읽어주세요.
