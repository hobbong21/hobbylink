-- ============================================================================
-- 037_profile_language.sql
-- Adds a `language` column so transactional emails can be sent in the
-- recipient's preferred locale. Default 'ko' matches the current user base.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_language') then
    create type public.profile_language as enum ('ko', 'en');
  end if;
end $$;

alter table public.profiles
  add column if not exists language public.profile_language not null default 'ko';
