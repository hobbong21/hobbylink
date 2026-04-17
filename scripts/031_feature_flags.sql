-- ============================================================================
-- 031_feature_flags.sql
-- Lightweight feature flag table. Each flag has a rollout percentage (0-100)
-- and optional per-user allowlist. Backed by a deterministic hash of
-- (flag_key, user_id) so the same user consistently ends up in the same
-- cohort across requests.
-- ============================================================================

create table if not exists public.feature_flags (
  key text primary key,
  description text,
  enabled boolean not null default false,
  rollout_percent smallint not null default 0 check (rollout_percent between 0 and 100),
  allowlist uuid[] not null default '{}'::uuid[],
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.feature_flags enable row level security;

drop policy if exists "Flags readable" on public.feature_flags;
create policy "Flags readable"
  on public.feature_flags for select
  using (true);

drop policy if exists "Admins manage flags" on public.feature_flags;
create policy "Admins manage flags"
  on public.feature_flags for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Deterministic cohort check. Returns true when the flag is on and either
-- the user is in allowlist, or falls into the rollout percentile.
create or replace function public.is_flag_enabled(
  p_key text,
  p_user_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_flag record;
  v_hash bigint;
begin
  select * into v_flag from public.feature_flags where key = p_key;
  if not found or not v_flag.enabled then return false; end if;
  if p_user_id is null then return v_flag.rollout_percent >= 100; end if;
  if p_user_id = any(v_flag.allowlist) then return true; end if;

  -- Stable 0..99 bucket from md5(key || user_id).
  v_hash := ('x' || substr(md5(p_key || p_user_id::text), 1, 8))::bit(32)::bigint;
  return (abs(v_hash) % 100) < v_flag.rollout_percent;
end;
$$;
