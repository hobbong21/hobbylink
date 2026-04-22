# HobbyLink

취미로 연결되는 오프라인 모임 플랫폼. Next.js 15 App Router + React 19 + Supabase + Tailwind CSS 기반.

이 디렉토리는 웹 앱 전용 워크스페이스입니다. 현재 상위 작업 폴더는 `web/`(Next.js)와 `mobile/`(모바일 앱)로 분리되어 있으며, 아래 명령은 모두 `web/` 디렉토리 기준입니다.

## 빠른 시작

```bash
# 1. 의존성 설치 (pnpm 권장)
pnpm install

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local에 Supabase 프로젝트 키 입력

# 3. DB 마이그레이션 실행
# Supabase SQL Editor에서 scripts/ 내 파일을 번호 순서대로 실행
#   001_create_tables.sql
#   002_create_profile_trigger.sql
#   003_seed_hobbies.sql
#   004_security_hardening.sql
#   005_realtime_and_counters.sql
#   006_reports_and_blocks.sql
#   007_event_reviews.sql
#   008_event_location_coords.sql
#   009_avatars_bucket.sql

# 4. 개발 서버
pnpm dev
```

## 주요 스크립트

| 명령             | 설명                              |
| ---------------- | --------------------------------- |
| `pnpm dev`       | 개발 서버 (http://localhost:3000) |
| `pnpm build`     | 프로덕션 빌드                     |
| `pnpm start`     | 프로덕션 서버                     |
| `pnpm lint`      | ESLint 검사                       |
| `pnpm lint:fix`  | ESLint 자동 수정                  |
| `pnpm format`    | Prettier 포맷                     |
| `pnpm typecheck` | TypeScript 타입 검사              |
| `pnpm test`      | Vitest 단위 테스트                |
| `pnpm test:e2e`  | Playwright E2E 테스트             |

## 프로젝트 구조

```
app/
├── (main)/               # 사이트 공용 레이아웃 (헤더·푸터)
│   ├── community/
│   ├── events/           # 목록, 상세, 생성, /nearby
│   ├── explore/
│   ├── interests/
│   ├── matches/
│   ├── matching/
│   ├── messages/         # 목록 + [peerId] 스레드 (Realtime)
│   ├── profile/
│   └── settings/         # 프로필, 아바타 업로드, 차단 목록
├── admin/                # 관리자 전용 (layout에서 권한 체크)
│   ├── hobbies, posts, events, users, reports
├── api/health/           # 헬스체크 JSON
├── auth/callback/        # OAuth 코드 교환 route
├── error.tsx             # 전역 에러 바운더리
├── layout.tsx            # root layout (metadata, LanguageProvider)
└── page.tsx              # 랜딩

components/
├── layout/               # SiteHeader, SiteFooter, AdminSidebar, SignOutButton
├── moderation/           # ReportDialog, BlockButton
├── ui/                   # shadcn/ui 컴포넌트 (자동 생성, 건드리지 말 것)
└── html-lang-sync.tsx    # <html lang> ↔ 언어 컨텍스트 동기화

lib/
├── supabase/             # client / server / middleware 클라이언트
├── database.types.ts     # Supabase 스키마 타입 (수동; npx supabase gen types로 교체 가능)
├── matching.ts           # 공통 관심사 기반 매칭
├── messaging.ts          # 대화 목록 + 스레드
├── events.ts             # 주변 이벤트 검색
├── moderation/           # 신고·차단 서버 액션
├── email/                # Resend 래퍼 + 템플릿
├── observability/        # 구조화 로거
├── rate-limit.ts         # 인메모리 rate limiter
└── geo.ts                # Haversine, 바운딩박스

scripts/*.sql             # DB 마이그레이션
tests/                    # Vitest 단위 + Playwright E2E
```

## 환경변수

`.env.example` 참고. 최소 실행에 필요한 것은 `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` 두 가지입니다.

## 보안 참고

- RLS 기반 인증 체크. `004_security_hardening.sql` 필수 적용 (admin 권한 상승 방지)
- Rate limiter는 현재 인메모리 → 프로덕션에서는 Upstash Redis로 교체
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출하지 말 것
- CSP 헤더는 `next.config.mjs`에 정의. 외부 서비스 연동 시 해당 origin 추가

## 개발 가이드

- 페이지는 기본적으로 서버 컴포넌트. 상호작용이 필요한 작은 조각만 client로 분리하세요 (`"use client"`).
- DB 쿼리는 `lib/` 헬퍼를 거쳐 재사용하세요. 한 번만 쓰이는 쿼리는 페이지 내 직접 호출도 OK.
- 서버 액션은 `app/<route>/actions.ts`에 두고 Zod 스키마로 입력 검증.
- 커밋 전 husky가 lint-staged를 통해 `eslint --fix` + `prettier --write`를 자동 실행합니다.

## 기여

PR 전 체크리스트:

- [ ] `pnpm typecheck` 통과
- [ ] `pnpm lint` 통과
- [ ] `pnpm test` 통과
- [ ] 관련 SQL 마이그레이션 번호 증가
- [ ] 새 환경변수는 `.env.example` 반영
