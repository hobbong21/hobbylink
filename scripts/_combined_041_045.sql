-- ========================================================================
-- Combined migration: 041 → 045
-- Generated 2026-04-18T12:12:34Z
-- Runs the P22 → P26 migrations in order inside a single transaction.
-- If any statement fails, the whole batch rolls back.
-- ========================================================================

begin;


-- >>> 041_user_levels.sql
-- ============================================================================
-- 041_user_levels.sql
-- Materializes the sum of achievement points per user into `profiles.xp`
-- and computes a simple level. Triggers keep it in sync.
--
-- Level formula: level = floor(sqrt(xp / 20)) + 1
--   level 1  :    0 xp
--   level 2  :   20 xp
--   level 3  :   80 xp
--   level 4  :  180 xp
--   level 5  :  320 xp  ...
-- ============================================================================

alter table public.profiles
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1;

create or replace function public.compute_level(p_xp integer)
returns integer
language sql
immutable
as $$
  select greatest(1, floor(sqrt(coalesce(p_xp, 0)::numeric / 20))::int + 1);
$$;

-- Backfill existing rows.
update public.profiles p
set xp = coalesce(
  (select sum(a.points) from public.user_achievements ua
   join public.achievements a on a.code = ua.code
   where ua.user_id = p.id),
  0
),
level = public.compute_level(
  coalesce(
    (select sum(a.points) from public.user_achievements ua
     join public.achievements a on a.code = ua.code
     where ua.user_id = p.id),
    0
  )
);

-- Trigger: recompute on unlock.
create or replace function public.recompute_user_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_new_xp int;
begin
  v_user := coalesce(new.user_id, old.user_id);
  select coalesce(sum(a.points), 0) into v_new_xp
  from public.user_achievements ua
  join public.achievements a on a.code = ua.code
  where ua.user_id = v_user;

  update public.profiles
  set xp = v_new_xp,
      level = public.compute_level(v_new_xp),
      updated_at = now()
  where id = v_user;

  return coalesce(new, old);
end;
$$;

drop trigger if exists user_achievements_xp_sync on public.user_achievements;
create trigger user_achievements_xp_sync
  after insert or delete on public.user_achievements
  for each row execute function public.recompute_user_xp();

-- <<< 041_user_levels.sql

-- >>> 042_event_photo_thumbnails.sql
-- ============================================================================
-- 042_event_photo_thumbnails.sql
-- Adds thumbnail columns to `event_photos` and a dedicated public bucket for
-- generated thumbnails. An Edge Function (`event-photo-thumbnails`) picks up
-- rows with thumb_status = 'pending' and fills these in asynchronously.
--
-- Layout mirrors the originals bucket so that an original at
--   event-photos/<event>/<uid>/<ts>.jpg
-- has its thumbnail at
--   event-photo-thumbnails/<event>/<uid>/<ts>.webp
-- ============================================================================

alter table public.event_photos
  add column if not exists thumb_path text,
  add column if not exists thumb_url text,
  add column if not exists thumb_status text
    check (thumb_status in ('pending', 'done', 'failed'))
    default 'pending'
    not null,
  add column if not exists thumb_error text;

-- Helpful index for the worker scan.
create index if not exists event_photos_thumb_status_idx
  on public.event_photos(thumb_status)
  where thumb_status = 'pending';

-- -------------------------------------------------------------
-- Storage bucket — thumbnails are public read. Writes happen
-- from the Edge Function using the service-role key so we only
-- need a read policy for public access.
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-photo-thumbnails', 'event-photo-thumbnails', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Event photo thumbnails are publicly readable'
  ) then
    create policy "Event photo thumbnails are publicly readable"
      on storage.objects for select
      using (bucket_id = 'event-photo-thumbnails');
  end if;
end $$;

-- <<< 042_event_photo_thumbnails.sql

-- >>> 043_match_tuning.sql
-- ============================================================================
-- 043_match_tuning.sql
-- Singleton row (id = 'current') that holds the weights used by the matching
-- scorer in `lib/matching.ts`. Admins adjust weights from
-- /admin/matching and the server reads them on each scoring pass so changes
-- take effect without a deploy.
-- ============================================================================

create table if not exists public.match_tuning (
  id text primary key,
  overlap_weight integer not null default 100,      -- base multiplier on (common / totalMy)
  location_exact_bonus integer not null default 10, -- +pts if location strings match exactly
  location_region_bonus integer not null default 5, -- +pts if first location token matches
  recency_48h_bonus integer not null default 8,     -- +pts if last_active within 48h
  recency_7d_bonus integer not null default 3,      -- +pts if last_active within 7d
  updated_at timestamptz not null default timezone('utc'::text, now()),
  updated_by uuid references public.profiles(id) on delete set null,
  -- Basic sanity rails so an admin can't save absurd values.
  constraint match_tuning_bounds check (
    overlap_weight between 0 and 500
    and location_exact_bonus between 0 and 100
    and location_region_bonus between 0 and 100
    and recency_48h_bonus between 0 and 100
    and recency_7d_bonus between 0 and 100
  )
);

insert into public.match_tuning (id) values ('current')
on conflict (id) do nothing;

alter table public.match_tuning enable row level security;

drop policy if exists "Admins read match tuning" on public.match_tuning;
create policy "Admins read match tuning"
  on public.match_tuning for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin
    )
  );

drop policy if exists "Admins write match tuning" on public.match_tuning;
create policy "Admins write match tuning"
  on public.match_tuning for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin
    )
  );

-- <<< 043_match_tuning.sql

-- >>> 044_phone_verification.sql
-- ============================================================================
-- 044_phone_verification.sql
-- Surfaces phone verification status on `profiles` so RLS, UI badges, and
-- "trusted action" gates don't need to join auth.users.
--
-- The source of truth is still `auth.users.phone` + `auth.users.phone_confirmed_at`.
-- We mirror only the boolean-ish fact (verified vs not) to avoid leaking the
-- full phone number into a table readable by other users.
-- ============================================================================

alter table public.profiles
  add column if not exists phone_verified_at timestamptz;

-- Mirror phone verification into profiles whenever auth.users.phone_confirmed_at
-- flips. Runs as security definer so we can write from the auth schema trigger.
create or replace function public.sync_phone_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set phone_verified_at = new.phone_confirmed_at,
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists auth_users_phone_sync on auth.users;
create trigger auth_users_phone_sync
  after update of phone_confirmed_at on auth.users
  for each row
  when (new.phone_confirmed_at is distinct from old.phone_confirmed_at)
  execute function public.sync_phone_verified();

-- Backfill existing verified users.
update public.profiles p
set phone_verified_at = u.phone_confirmed_at
from auth.users u
where u.id = p.id
  and u.phone_confirmed_at is not null
  and p.phone_verified_at is distinct from u.phone_confirmed_at;

-- Helper: is the currently-authenticated user phone-verified?
create or replace function public.is_phone_verified()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
      and phone_verified_at is not null
  );
$$;

grant execute on function public.is_phone_verified() to authenticated;

-- <<< 044_phone_verification.sql

-- >>> 045_api_keys.sql
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

-- <<< 045_api_keys.sql

commit;
