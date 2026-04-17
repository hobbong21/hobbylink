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
```

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
