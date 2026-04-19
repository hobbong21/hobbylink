-- ============================================================================
-- 040_ab_exposure.sql
-- Stores which users saw which flag evaluation + a conversion event so we
-- can compute lift. Writes happen through the `log_flag_exposure(key, on)`
-- RPC so we keep the write path on the server.
-- ============================================================================

create table if not exists public.flag_exposures (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  flag_key text not null,
  variant text not null check (variant in ('on', 'off')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, flag_key)
);

create index if not exists flag_exposures_flag_idx
  on public.flag_exposures(flag_key, variant);

alter table public.flag_exposures enable row level security;

drop policy if exists "Exposures readable" on public.flag_exposures;
create policy "Exposures readable"
  on public.flag_exposures for select
  using (auth.role() = 'authenticated');
-- No user-facing INSERT policy — use the RPC below.

create or replace function public.log_flag_exposure(p_key text, p_on boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then return; end if;
  insert into public.flag_exposures (user_id, flag_key, variant)
  values (v_user, p_key, case when p_on then 'on' else 'off' end)
  on conflict (user_id, flag_key) do nothing;
end;
$$;

-- Conversion events — generic bag. `kind` can be e.g. 'match.like',
-- 'event.joined', 'post.created'. The `flag_exposures` join happens at
-- query time in the admin UI.
create table if not exists public.ab_conversions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ab_conversions_kind_idx
  on public.ab_conversions(kind, created_at desc);

alter table public.ab_conversions enable row level security;

drop policy if exists "Conversions readable" on public.ab_conversions;
create policy "Conversions readable"
  on public.ab_conversions for select
  using (auth.role() = 'authenticated');

create or replace function public.log_ab_conversion(p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then return; end if;
  insert into public.ab_conversions (user_id, kind) values (v_user, p_kind);
end;
$$;

-- Aggregate view: per (flag, variant), how many distinct users saw it
-- and how many had at least one conversion of each `kind`.
create or replace view public.ab_flag_conversion_rates as
select
  e.flag_key,
  e.variant,
  c.kind as conversion_kind,
  count(distinct e.user_id) as exposures,
  count(distinct c.user_id) as converters,
  round(
    case when count(distinct e.user_id) = 0 then 0
         else count(distinct c.user_id)::numeric / count(distinct e.user_id)
    end * 100,
    2
  ) as conversion_pct
from public.flag_exposures e
left join public.ab_conversions c
  on c.user_id = e.user_id and c.created_at >= e.created_at
group by e.flag_key, e.variant, c.kind;
