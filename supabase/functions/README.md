# Supabase Edge Functions

## 배포

```bash
# Supabase CLI 설치
brew install supabase/tap/supabase

# 로컬 프로젝트 링크
supabase link --project-ref <your-project-ref>

# 시크릿 설정
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set EMAIL_FROM="HobbyLink <noreply@hobbylink.example>"
supabase secrets set SITE_URL=https://hobbylink.example

# 배포
supabase functions deploy event-reminders
supabase functions deploy weekly-digest
supabase functions deploy daily-ops-report
supabase functions deploy event-photo-thumbnails
```

## 함수 목록

| 함수 | 주기 | 역할 |
|---|---|---|
| `event-reminders` | 매 시각 | 24시간 이내 예정 모임 참가자에게 리마인더 |
| `weekly-digest` | 매주 월요일 | 이번 주 추천 이벤트/커뮤니티 다이제스트 |
| `daily-ops-report` | 매일 오전 | 관리자에게 전일 지표 리포트 |
| `event-photo-thumbnails` | 2분마다 | 업로드된 이벤트 사진에 대해 600px JPEG 썸네일 생성 |

## 스케줄링

Supabase는 pg_cron + pg_net을 통해 주기 실행을 지원합니다.
`event-reminders` 함수를 매 시각 정각에 호출:

```sql
-- 1. 확장 활성화
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. 함수 URL과 service_role 키를 GUC로 저장하는 대신 Vault에 넣거나
--    함수 내부에서 secrets를 사용하세요.

-- 3. 스케줄 등록
select cron.schedule(
  'event-reminders-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.functions.supabase.co/event-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_invoker_key')
    )
  );
  $$
);
```

외부 uptime 서비스(Vercel Cron, GitHub Actions scheduled workflow 등)로
HTTP 호출을 대신할 수도 있습니다.

### 썸네일 워커 스케줄 예시

```sql
select cron.schedule(
  'event-photo-thumbnails-2min',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.functions.supabase.co/event-photo-thumbnails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_invoker_key')
    )
  );
  $$
);
```

실패한 행(`thumb_status = 'failed'`)은 관리자가 다음처럼 재시도할 수 있습니다:

```bash
curl -X GET "https://<project-ref>.functions.supabase.co/event-photo-thumbnails?photo_id=<uuid>" \
  -H "Authorization: Bearer $SERVICE_ROLE"
```
