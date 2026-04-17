-- ============================================================================
-- 017_bookmarks.sql
-- Saved items — posts and events that a user has bookmarked for later.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'bookmark_target_type') then
    create type public.bookmark_target_type as enum ('post', 'event');
  end if;
end $$;

create table if not exists public.bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_type public.bookmark_target_type not null,
  target_id uuid not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, target_type, target_id)
);

create index if not exists bookmarks_user_idx on public.bookmarks(user_id, created_at desc);

alter table public.bookmarks enable row level security;

drop policy if exists "Users see own bookmarks" on public.bookmarks;
create policy "Users see own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

drop policy if exists "Users add bookmarks" on public.bookmarks;
create policy "Users add bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users remove bookmarks" on public.bookmarks;
create policy "Users remove bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);
