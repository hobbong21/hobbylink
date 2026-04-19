# HobbyLink 런치 런북

프로덕션 오픈까지 단계별로 따라갈 수 있는 체크리스트입니다. 2-4주 일정
기준으로 정리했으며, 각 단계마다 "완료 조건(DoD)"이 있어 어떤 상태가
되어야 다음으로 넘어갈 수 있는지 명확합니다.

**타겟 오픈 마켓**: 한국 + 영어권
**스택**: Next.js 15 (App Router) + Supabase + Vercel

---

## 체크리스트 한눈에

| 단계 | 소요 | 차단 위험 |
|---|---|---|
| 0. 오픈 전 의사결정 | 1일 | 시점·규모 혼선 |
| 1. 도메인 + 법인/사업자 | 2-5일 | 도메인 인증 딜레이 |
| 2. Supabase 프로덕션 세팅 | 반나절 | 마이그레이션 실패 |
| 3. Vercel 배포 | 반나절 | 환경변수 누락 |
| 4. 3rd-party 연결 | 1-2일 | 키 발급/승인 지연 |
| 5. Edge Function + Cron | 반나절 | pg_cron·pg_net 활성화 |
| 6. 법무 문서 배포 | 1-2일 | 변호사 검토 |
| 7. 초기 데이터 seed | 반나절 | SEED 품질 |
| 8. Smoke test + 접근성 | 1일 | 발견된 버그 수 |
| 9. 모니터링 + 알림 | 반나절 | Sentry·Uptime 연결 |
| 10. 오픈 D-day + 사후 24h | 1일 | 인시던트 대응 준비 |

---

## 0. 오픈 전 의사결정

먼저 아래 항목을 확정해주세요. 이후 단계에서 반복 등장합니다.

- [ ] **제품 이름 확정**: HobbyLink (변경 시 metadata·로고·이메일·OG 이미지 모두 수정)
- [ ] **도메인**: 예) `hobbylink.kr` (한국) + `hobbylink.app` (국제)
- [ ] **회사/대표자명**: 약관·특수거래법 표기에 사용
- [ ] **고객센터 이메일**: support@hobbylink.kr 등
- [ ] **청소년 보호 책임자**: 이름·연락처 (방통위 고시)
- [ ] **요금제 정책**: 무료 / Premium / 모임 결제 수수료
- [ ] **초기 지역 범위**: 서울 전역 / 서울+인천+경기 / 전국

---

## 1. 도메인 + 법인/사업자 서류

- [ ] 도메인 구매 (가비아·Cloudflare·Namecheap). DNS를 Cloudflare로
      넘기면 SSL·캐싱·봇 방어가 한번에 해결됩니다.
- [ ] **통신판매업 신고** — 전자상거래 모임 결제를 받는다면 필수
      ([정부24 신청](https://www.gov.kr/portal/service/serviceInfo/140103000004))
- [ ] 사업자등록증 (개인 / 법인)
- [ ] 개인정보 보호책임자 지정 (내부 1인)
- [ ] 청소년 보호 책임자 지정 (내부 1인)

**DoD**: 도메인이 `dig @1.1.1.1 hobbylink.kr` 에서 NS 응답 리턴 + 사업자등록증
PDF 확보.

---

## 2. Supabase 프로덕션 프로젝트

### 2-1. 프로젝트 생성
1. [supabase.com/dashboard](https://supabase.com/dashboard) → New project
2. Region: `Northeast Asia (Seoul)` (한국 사용자 레이턴시 최적)
3. Database password: 32자 난수 (1Password 저장)
4. Pricing: **Pro** (10 GB DB + 250 GB 밴드위드 + 일일 백업)

### 2-2. 마이그레이션 실행

```
scripts/README_MIGRATIONS_041_045.md
```
대로 001 → 045 까지 순차 실행. Dashboard → SQL Editor에서 한 파일씩.
대용량이면 `scripts/_combined_041_045.sql` 통합본 이용.

**DoD**:
```sql
select count(*) from public.hobbies;            -- > 0 (seed 이후)
select count(*) from pg_policies where schemaname = 'public';  -- 30+
select 1 from pg_proc where proname = 'is_phone_verified';     -- 1
```

### 2-3. Storage 버킷
다음이 모두 있어야 합니다 (마이그레이션이 자동 생성):
- `avatars` — public read, 사용자 업로드
- `event-photos` — public read, 참가자 업로드
- `event-photo-thumbnails` — public read, 워커 전용

### 2-4. Auth 프로바이더
- [ ] Email 활성화 + confirm-email 템플릿 커스터마이즈
- [ ] Google OAuth (GCP → OAuth client → Web 생성, Authorized redirect에
      `https://<ref>.supabase.co/auth/v1/callback` 추가)
- [ ] GitHub OAuth (필요 시)
- [ ] Phone / SMS 활성화 + Twilio 연결 (아래 4-3 참고)
- [ ] Rate limiting: Dashboard → Auth → Rate limits
  - OTP per phone: 3 / hour
  - Signups per IP: 30 / hour
  - OTP per IP: 30 / hour

---

## 3. Vercel 배포

### 3-1. 프로젝트 import
1. [vercel.com/new](https://vercel.com/new) → GitHub repo 연결
2. Framework: Next.js (자동 감지)
3. Build command: `next build` (기본값)
4. Node version: 20.x

### 3-2. 환경변수 (Production)

아래 15개 전부 필수. **절대 공개 레포/로그에 노출 금지**.

| 이름 | 값 예시 | 노출 | 비고 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | 공개 | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | 공개 | |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | **비공개** | 서버 전용 |
| `NEXT_PUBLIC_SITE_URL` | `https://hobbylink.kr` | 공개 | trailing slash 없이 |
| `STRIPE_SECRET_KEY` | `sk_live_...` | 비공개 | 결제 사용 시 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | 비공개 | |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | 공개 | |
| `RESEND_API_KEY` | `re_...` | 비공개 | 이메일 발송 |
| `EMAIL_FROM` | `HobbyLink <hello@hobbylink.kr>` | 비공개 | |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | `...` | 공개 | 도메인 제한 설정 필수 |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://...@...ingest.sentry.io/...` | 공개 | |
| `SENTRY_AUTH_TOKEN` | `sntrys_...` | 비공개 | source-map 업로드 |
| `VAPID_PUBLIC_KEY` | `...` | 공개 | Web Push |
| `VAPID_PRIVATE_KEY` | `...` | 비공개 | Web Push |
| `CRON_SECRET` | 32자 난수 | 비공개 | Edge Function 보호 |

### 3-3. 도메인 연결
- [ ] Vercel Dashboard → Domains → `hobbylink.kr` 추가
- [ ] Cloudflare DNS에서 `A` → `76.76.21.21` (또는 Vercel 안내대로)
- [ ] `www.hobbylink.kr` → 루트로 301 redirect
- [ ] `hobbylink.app` 도메인도 alias로 연결 (영어 사용자용)
- [ ] SSL 자동 발급 확인 (Vercel가 Let's Encrypt 자동 처리)

### 3-4. Vercel 프로젝트 설정
- [ ] Password Protection 끔 (오픈 전에는 켜두고 QA 후 해제)
- [ ] `Analytics` 활성화 (Vercel Analytics)
- [ ] `Speed Insights` 활성화
- [ ] Build & Development → Node version = 20.x

**DoD**: `https://hobbylink.kr/` 접속 시 랜딩 페이지가 뜨고, 헤더의 로그인
버튼이 클릭되며, DevTools Console에 에러 없음.

---

## 4. 3rd-party 연결

### 4-1. Stripe (결제)
- [ ] 대시보드에서 **Activate account**: 사업자 정보·계좌·세무 정보 입력
- [ ] Products → "Premium membership" 생성 (월 ₩4,900 등)
- [ ] Webhooks → `https://hobbylink.kr/api/stripe/webhook` 추가
  - Events: `checkout.session.completed`, `customer.subscription.*`,
    `invoice.payment_failed`
- [ ] Webhook signing secret을 `STRIPE_WEBHOOK_SECRET`에 저장
- [ ] Test mode에서 test card (4242 4242 4242 4242)로 한 번 전체 flow 검증

### 4-2. Resend (트랜잭션 이메일)
- [ ] [resend.com](https://resend.com) 프로젝트 생성
- [ ] `hobbylink.kr` DNS에 `TXT SPF` + `CNAME DKIM` 추가
- [ ] 도메인 verified 확인
- [ ] `RESEND_API_KEY` 발급
- [ ] **첫 발송은 Resend 대시보드의 "Send test email"** 로 직접 테스트
- [ ] 바운스·스팸율 모니터링 규칙 설정

### 4-3. Twilio (SMS/OTP)
- [ ] 계정 생성 + 신용카드 등록
- [ ] Messaging Service 생성 + 발신번호 (한국 번호 + 미국 번호 각 1)
- [ ] Supabase Dashboard → Auth → Providers → Phone → Twilio 연결
- [ ] 예산 한도 설정: Twilio Console → Usage → Triggers → 일일 $20 제한
- [ ] 템플릿: `[HobbyLink] 인증번호 {{code}} (5분 이내)`

### 4-4. Kakao Maps
- [ ] [developers.kakao.com](https://developers.kakao.com/) → 애플리케이션 생성
- [ ] JavaScript 키 발급
- [ ] 플랫폼 → Web → 사이트 도메인에 `https://hobbylink.kr` 등록 (필수)
- [ ] `카카오로그인`·`카카오로그인 API`는 사용 안함 (유료)

### 4-5. Sentry
- [ ] 프로젝트 생성 (Next.js 플랫폼)
- [ ] DSN 복사 → `NEXT_PUBLIC_SENTRY_DSN`
- [ ] Organization → Auth Tokens → `project:releases` scope로 생성 → `SENTRY_AUTH_TOKEN`
- [ ] Alert Rules:
  - Issue first seen → Slack/email 전체
  - High error frequency (>10/min) → PagerDuty 또는 전화
  - Performance degradation (p95 > 3s) → warning

### 4-6. Web Push (VAPID)
```bash
npx web-push generate-vapid-keys
```
출력된 public/private를 env 변수에 넣기.

---

## 5. Edge Function + Cron

### 5-1. 함수 배포
```bash
# 로컬에서
supabase link --project-ref <프로덕션 ref>
supabase secrets set RESEND_API_KEY=re_... EMAIL_FROM="HobbyLink <hello@hobbylink.kr>" \
  SITE_URL=https://hobbylink.kr

supabase functions deploy event-reminders
supabase functions deploy weekly-digest
supabase functions deploy daily-ops-report
supabase functions deploy event-photo-thumbnails
```

### 5-2. pg_cron 활성화 + 스케줄
Supabase SQL Editor에서 **한 번만** 실행:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 시크릿 저장 (service role key로 Edge Function 호출)
alter database postgres set app.cron_invoker_key = '<SUPABASE_SERVICE_ROLE_KEY>';

-- 1. 모임 리마인더 (매시 정각)
select cron.schedule('event-reminders-hourly', '0 * * * *', $$
  select net.http_post(
    url := 'https://<ref>.functions.supabase.co/event-reminders',
    headers := jsonb_build_object('Authorization','Bearer '||current_setting('app.cron_invoker_key'))
  );
$$);

-- 2. 주간 다이제스트 (월 09:00)
select cron.schedule('weekly-digest-mon', '0 9 * * 1', $$
  select net.http_post(
    url := 'https://<ref>.functions.supabase.co/weekly-digest',
    headers := jsonb_build_object('Authorization','Bearer '||current_setting('app.cron_invoker_key'))
  );
$$);

-- 3. 일일 운영 리포트 (매일 08:00)
select cron.schedule('daily-ops-08', '0 8 * * *', $$
  select net.http_post(
    url := 'https://<ref>.functions.supabase.co/daily-ops-report',
    headers := jsonb_build_object('Authorization','Bearer '||current_setting('app.cron_invoker_key'))
  );
$$);

-- 4. 썸네일 워커 (2분마다)
select cron.schedule('thumbnails-2min', '*/2 * * * *', $$
  select net.http_post(
    url := 'https://<ref>.functions.supabase.co/event-photo-thumbnails',
    headers := jsonb_build_object('Authorization','Bearer '||current_setting('app.cron_invoker_key'))
  );
$$);
```

**DoD**:
```sql
select jobname, schedule, active from cron.job order by jobname;
-- 4개 모두 active = true
```

---

## 6. 법무 문서 배포

`docs/legal/` 폴더의 템플릿을 조정한 뒤 **반드시 변호사 검토** (국내 1회,
영문 1회). 검토 완료본을:

- [ ] `app/privacy/page.tsx` — 한/영 탭
- [ ] `app/terms/page.tsx` — 한/영 탭
- [ ] `app/youth-protection/page.tsx`
- [ ] `app/cookies/page.tsx`
- [ ] 회원가입 flow에 "이용약관 동의" 체크박스 (이미 존재하는지 확인)

**한국 필수**: 개인정보처리방침은 [개인정보보호위원회 표준 양식](https://www.pipc.go.kr/np/cop/bbs/selectBoardList.do?bbsId=BS216&mCode=D010030000)
기반. 사업자 표기는 [전자상거래법 제10조](https://www.law.go.kr/법령/전자상거래등에서의소비자보호에관한법률)
기반.

**영어권**: GDPR cookie consent banner, CCPA "Do Not Sell" 링크,
Data Processing Addendum (DPA) 준비.

---

## 7. 초기 데이터 seed

### 7-1. 취미 카탈로그 (필수)
```
scripts/100_seed_hobbies.sql       -- 200+개 취미
scripts/101_seed_tags.sql           -- 공통 해시태그
scripts/102_seed_achievements.sql   -- 업적 10개
scripts/103_seed_announcement.sql   -- 오픈 공지 "베타 런칭 🎉"
```

### 7-2. 관리자 계정
```sql
-- 내 계정을 관리자로 승격 (가입 후)
update public.profiles set is_admin = true where id = '<내 user_id>';
```

### 7-3. 시드 모임 (선택, 하지만 텅 빈 인상 피함)
- 관리자 계정으로 "HobbyLink 팀" 프로필 만들고 1주 동안의 샘플 모임 5개
  생성 (카테고리별 1개씩).

---

## 8. Smoke test + 접근성

오픈 D-2일에 아래 20개 시나리오를 직접 밟아봄:

1. [ ] 비로그인 랜딩 → 회원가입 → 이메일 인증 → 온보딩
2. [ ] 관심사 5개 선택 → 매칭 첫 후보 표시
3. [ ] 후보 5명 pass/like → 상호 매칭 시 메시지 이동
4. [ ] 메시지 실시간 전송/수신 (2개 브라우저)
5. [ ] 모임 생성 → 지도 핀 → 게시
6. [ ] 다른 계정으로 모임 검색 → 참가 신청 → 주최자에게 알림
7. [ ] 모임 사진 업로드 → 썸네일 생성 확인 (2분 대기)
8. [ ] 모임 후기 작성 → 주최자 평점 반영
9. [ ] 커뮤니티 글 작성 → 해시태그 → 멘션
10. [ ] 좋아요 + 북마크 + 리액션
11. [ ] 알림 bell 실시간 업데이트
12. [ ] 푸시 구독 → 모바일에서 알림 수신
13. [ ] 프리미엄 결제 (테스트 카드) → webhook → UI 반영
14. [ ] 전화번호 인증 → 인증 배지 표시
15. [ ] API 키 발급 → `/api/public/v1/events` 호출 → 200 응답
16. [ ] 다크/라이트 모드 + 한/영 토글
17. [ ] 모바일 뷰포트 (390×844)로 주요 플로우
18. [ ] 키보드만으로 메인 flow 탐색 (tab / enter)
19. [ ] 스크린리더 (VoiceOver/NVDA) 헤더·링크 인식
20. [ ] 로그아웃 → 세션 쿠키 삭제 → 보호 페이지 접근 차단

### 자동화 QA (선택)
```bash
pnpm test:e2e        # Playwright
pnpm test:a11y       # axe-playwright
```

---

## 9. 모니터링 + 알림

| 도구 | 역할 | 알림 채널 |
|---|---|---|
| Vercel Analytics | Web vitals, traffic | 대시보드 |
| Sentry | 에러 + 성능 | Slack #alerts |
| Supabase Logs | DB 에러 + 쿼리 | Slack (webhook) |
| UptimeRobot | `/api/health` 1분 간격 | SMS + email |
| BetterStack | 상태 페이지 `status.hobbylink.kr` | 공개 |

### 핵심 대시보드
- [ ] `/admin` (내부): 일일 신규 가입·매칭·모임·활성 사용자 (이미 구현됨)
- [ ] Sentry issue board + release health
- [ ] Supabase DB size / queries / storage

---

## 10. 오픈 D-day + 사후 24h

### D-day 오전 ~09:00
- [ ] 모든 env 변수 프로덕션 재확인 (오타 하나도 치명적)
- [ ] `/api/health` 정상 응답
- [ ] cron jobs 4개 활성 확인
- [ ] Stripe test → Live 전환 (마지막 순간)
- [ ] Announcement 배너 "정식 오픈" 활성화

### 12:00 오픈 공지
- [ ] 개인 SNS / 커뮤니티
- [ ] 초기 지지자 DM (referral code 포함)

### 12:00 ~ 24:00 관찰
- [ ] Sentry 새 이슈 → 30분 이내 triage
- [ ] Supabase DB 쿼리 latency p95 모니터
- [ ] Resend 바운스율 < 2%
- [ ] Stripe 실패 결제 즉시 원인 파악
- [ ] #alerts Slack 알림 즉시 반응

### D+1 ~ D+7
- [ ] 일일 운영 리포트 확인
- [ ] 사용자 피드백 수집 (`support@`에 온 메일)
- [ ] 첫 주 배포는 hot-fix만, 기능 추가 금지

---

## 최후의 Rollback 플랜

큰 장애가 발생했을 때 복구 순서:

1. **Vercel Rollback**: Dashboard → Deployments → 이전 커밋 → "Promote to Production"
2. **DB 롤백**: Supabase → Database → Backups → Point-in-time restore (Pro plan 7일)
3. **배포 차단**: Vercel → Settings → Ignored Build Step 에 `exit 0` 추가
4. **기능 플래그 비활성화**: `/admin/flags`에서 문제 기능 off (이미 구현됨)
5. **점검 페이지**: `/api/health`가 503 반환하도록 env `MAINTENANCE=1` 추가 (필요 시 추가 구현)

---

## 팀 / 협력사 연락처 템플릿

```
[기술 온콜]         당번: ___  번호: ___
[Vercel 상태]       https://www.vercel-status.com
[Supabase 상태]     https://status.supabase.com
[Stripe 상태]       https://status.stripe.com
[Sentry 상태]       https://status.sentry.io
[법무 검토]         ___ 변호사: ___
[개인정보 분쟁]     개인정보보호위원회 국번없이 182
```

---

**다음 문서**: `docs/legal/` 폴더의 약관/개인정보처리방침 템플릿.
