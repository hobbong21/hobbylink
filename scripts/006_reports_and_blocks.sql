-- ============================================================================
-- 006_reports_and_blocks.sql
-- Adds reporting and blocking so users can flag abuse and the admin team
-- can review. Also adds the schema needed for moderation actions.
-- ============================================================================

-- Types of reportable content
do $$
begin
  if not exists (select 1 from pg_type where typname = 'report_target_type') then
    create type public.report_target_type as enum (
      'profile', 'post', 'comment', 'event', 'message'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum (
      'open', 'reviewing', 'resolved', 'dismissed'
    );
  end if;
end $$;

-- -------------------------------------------------------------
-- Reports
-- -------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 500),
  status public.report_status not null default 'open',
  resolution_notes text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists reports_target_idx on public.reports(target_type, target_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_reporter_idx on public.reports(reporter_id);

alter table public.reports enable row level security;

drop policy if exists "Users can file reports" on public.reports;
create policy "Users can file reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Users can see their own reports" on public.reports;
create policy "Users can see their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

drop policy if exists "Admins can manage reports" on public.reports;
create policy "Admins can manage reports"
  on public.reports for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- -------------------------------------------------------------
-- Blocks — symmetric application rule: if A blocks B, neither sees the other
-- -------------------------------------------------------------
create table if not exists public.user_blocks (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  reason text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint user_blocks_no_self_block check (blocker_id <> blocked_id),
  constraint user_blocks_unique_pair unique (blocker_id, blocked_id)
);

create index if not exists user_blocks_blocker_idx on public.user_blocks(blocker_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_id);

alter table public.user_blocks enable row level security;

drop policy if exists "Users can see their own blocks" on public.user_blocks;
create policy "Users can see their own blocks"
  on public.user_blocks for select
  using (auth.uid() = blocker_id or auth.uid() = blocked_id);

drop policy if exists "Users can block others" on public.user_blocks;
create policy "Users can block others"
  on public.user_blocks for insert
  with check (auth.uid() = blocker_id);

drop policy if exists "Users can unblock" on public.user_blocks;
create policy "Users can unblock"
  on public.user_blocks for delete
  using (auth.uid() = blocker_id);

-- The `reason` column is an internal moderation field; regular users have no
-- need to read it.  Restrict column access so it is only available to
-- service_role (admin/server-side tooling).
revoke select (reason) on public.user_blocks from authenticated;
revoke select (reason) on public.user_blocks from anon;

-- -------------------------------------------------------------
-- User status fields for moderation
-- -------------------------------------------------------------
alter table public.profiles
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_until timestamptz;

-- Prevent non-admins from editing moderation flags.
create or replace function public.prevent_self_moderation_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    old.is_suspended is distinct from new.is_suspended or
    old.suspended_until is distinct from new.suspended_until
  ) then
    if not exists (
      select 1 from public.profiles where id = auth.uid() and is_admin = true
    ) then
      raise exception 'Only admins can change moderation status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_moderation on public.profiles;
create trigger profiles_prevent_self_moderation
  before update on public.profiles
  for each row
  execute function public.prevent_self_moderation_change();
