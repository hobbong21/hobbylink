-- ============================================================================
-- 027_announcements.sql
-- Site-wide announcements authored by admins. Rendered as a dismissable
-- banner on the main layout.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'announcement_variant') then
    create type public.announcement_variant as enum ('info', 'warning', 'success');
  end if;
end $$;

create table if not exists public.announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 1000),
  variant public.announcement_variant not null default 'info',
  link_url text,
  link_label text,
  starts_at timestamptz not null default timezone('utc'::text, now()),
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists announcements_window_idx
  on public.announcements(starts_at, ends_at);

alter table public.announcements enable row level security;

drop policy if exists "Announcements are readable" on public.announcements;
create policy "Announcements are readable"
  on public.announcements for select
  using (true);

drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
  on public.announcements for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Track dismissals so a user doesn't see the same banner twice.
create table if not exists public.announcement_dismissals (
  user_id uuid references public.profiles(id) on delete cascade not null,
  announcement_id uuid references public.announcements(id) on delete cascade not null,
  dismissed_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, announcement_id)
);

alter table public.announcement_dismissals enable row level security;

drop policy if exists "Users see own dismissals" on public.announcement_dismissals;
create policy "Users see own dismissals"
  on public.announcement_dismissals for select
  using (auth.uid() = user_id);

drop policy if exists "Users dismiss for themselves" on public.announcement_dismissals;
create policy "Users dismiss for themselves"
  on public.announcement_dismissals for insert
  with check (auth.uid() = user_id);
