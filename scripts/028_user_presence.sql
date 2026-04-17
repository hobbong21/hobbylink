-- ============================================================================
-- 028_user_presence.sql
-- Adds `last_active_at` on profiles so we can show "방금 전 / 10분 전 / 온라인"
-- indicators without a dedicated presence server. Updated by the client via a
-- lightweight heartbeat endpoint.
-- ============================================================================

alter table public.profiles
  add column if not exists last_active_at timestamptz;

create index if not exists profiles_last_active_idx
  on public.profiles(last_active_at desc nulls last);
