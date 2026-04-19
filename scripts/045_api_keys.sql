-- ============================================================================
-- 045_api_keys.sql
-- User-issued API keys for the read-only public API under /api/public/v1.
-- Raw keys are shown to the user only once at creation time; we store
-- SHA-256 hashes so a DB leak cannot be replayed against the API.
-- ============================================================================

create table if not exists public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null check (char_length(name) between 1 and 60),
  key_prefix text not null,                 -- first 8 chars, shown in UI
  key_hash text not null unique,            -- SHA-256(hex) of the full key
  tier text not null default 'free'
    check (tier in ('free', 'pro')),        -- caps requests/min at the middleware
  scopes text[] not null default array['public:read']::text[],
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists api_keys_user_idx on public.api_keys(user_id);
create index if not exists api_keys_hash_idx on public.api_keys(key_hash);

alter table public.api_keys enable row level security;

-- Owners read + revoke their own keys. Nobody reads the hash via select; the
-- public API auth path uses the service-role client, not the user session.
drop policy if exists "Owners read own api keys" on public.api_keys;
create policy "Owners read own api keys"
  on public.api_keys for select
  using (user_id = auth.uid());

drop policy if exists "Owners create own api keys" on public.api_keys;
create policy "Owners create own api keys"
  on public.api_keys for insert
  with check (user_id = auth.uid());

drop policy if exists "Owners update own api keys" on public.api_keys;
create policy "Owners update own api keys"
  on public.api_keys for update
  using (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- Simple usage counter (rolled up hourly). Used by the docs page to show
-- "used 1,248 / 10,000 this month" without needing a separate analytics pipeline.
-- --------------------------------------------------------------------------
create table if not exists public.api_key_usage (
  key_id uuid references public.api_keys(id) on delete cascade not null,
  window_hour timestamptz not null,  -- truncated to the hour, UTC
  request_count bigint not null default 0,
  primary key (key_id, window_hour)
);

alter table public.api_key_usage enable row level security;

drop policy if exists "Owners read own key usage" on public.api_key_usage;
create policy "Owners read own key usage"
  on public.api_key_usage for select
  using (
    exists (
      select 1 from public.api_keys k
      where k.id = api_key_usage.key_id and k.user_id = auth.uid()
    )
  );

-- Allow the middleware (which runs under service-role) to upsert freely.

-- Atomic increment used by the middleware when the initial upsert collides.
create or replace function public.increment_api_usage(
  p_key_id uuid,
  p_window_hour timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.api_key_usage (key_id, window_hour, request_count)
  values (p_key_id, p_window_hour, 1)
  on conflict (key_id, window_hour)
  do update set request_count = public.api_key_usage.request_count + 1;
end;
$$;
