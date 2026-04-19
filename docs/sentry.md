# Sentry 통합 가이드

HobbyLink의 Sentry 훅은 이미 코드에 준비되어 있지만, 실제 활성화하려면
SDK 설치와 프로젝트 키 연결이 필요합니다.

## 1. SDK 설치

```bash
pnpm add @sentry/nextjs
```

`@sentry/nextjs`는 `package.json`의 `optionalDependencies`에 이미 등록되어
있어서 CI 빌드는 설치 없이도 통과합니다. 위 명령이 동작 환경에 실제 설치를
추가합니다.

## 2. 환경변수

`.env.local` (또는 호스팅 프로바이더의 secret 저장소)에 다음을 설정하세요:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://<key>@o0.ingest.sentry.io/0
SENTRY_DSN=<동일 DSN>
SENTRY_AUTH_TOKEN=<sentry-cli upload용>
SENTRY_ORG=<org slug>
SENTRY_PROJECT=<project slug>

# 선택: 성능 트레이스 샘플링 비율 (0.0 ~ 1.0)
NEXT_PUBLIC_SENTRY_TRACES_RATE=0.1
SENTRY_TRACES_RATE=0.1
```

## 3. 초기화 훅

이미 아래 파일들이 있으므로 추가 수정은 불필요합니다:

- `sentry.client.config.ts` — 브라우저 측 init (DSN 있을 때만 동작)
- `sentry.server.config.ts` — Node 런타임 측 init
- `instrumentation.ts` — Next.js App Router boot hook이 server config를 import

## 4. `next.config.mjs` 래핑 (소스맵 업로드)

빌드 시 Sentry에 소스맵을 자동 업로드하려면 다음을 적용:

```js
import { withSentryConfig } from "@sentry/nextjs"

// ... existing nextConfig ...

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
})
```

CI 환경에서는 `SENTRY_AUTH_TOKEN`이 secret으로 제공되어야 합니다.

## 5. 구조화 로거와의 연동

`lib/observability/logger.ts`의 `logger.error()` / `logger.fatal()` 호출은
설치 여부와 상관없이 `globalThis.Sentry?.captureMessage?.`를 시도합니다.
`@sentry/nextjs`가 init되면 이 경로로 이벤트가 자동 전송됩니다.

## 6. 성능 모니터링 권장 설정

- `tracesSampleRate`: 초기 10%부터 시작 (`NEXT_PUBLIC_SENTRY_TRACES_RATE=0.1`)
- 고트래픽 경로(예: `/matching`, `/feed`)만 샘플링 높이려면 `tracesSampler`를
  `sentry.client.config.ts`의 `Sentry.init` 옵션으로 추가
- `replaysSessionSampleRate`는 0으로 시작하고 버그 재현이 필요한 구간만
  `replaysOnErrorSampleRate: 1.0`을 유지해 비용을 절감

## 7. Release & Environment 태그

배포 파이프라인에서 다음 환경 변수를 설정하면 Sentry 대시보드에서 버전별
에러 분포를 볼 수 있습니다:

```bash
SENTRY_RELEASE=$(git rev-parse --short HEAD)
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production   # or preview, development
```

## 8. Alert rules 권장

- **First seen**: 새로운 에러 `issue` 생성 즉시 Slack 알림
- **Spike protection**: 1시간 5+ 발생 시 Slack 알림
- **Release regression**: 새 release에 처음 나타난 에러를 별도 알림
- **Performance**: P95 latency on `/matching` 페이지가 2s 초과 시 알림
