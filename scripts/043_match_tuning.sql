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
