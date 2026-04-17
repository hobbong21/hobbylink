-- ============================================================================
-- 010_follows.sql
-- Adds a simple follower/following graph so users can subscribe to each
-- other's community posts without requiring a mutual match.
-- ============================================================================

create table if not exists public.follows (
  id uuid primary key default uuid_generate_v4(),
  follower_id uuid references public.profiles(id) on delete cascade not null,
  followed_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint follows_no_self check (follower_id <> followed_id),
  constraint follows_unique_pair unique (follower_id, followed_id)
);

create index if not exists follows_follower_idx on public.follows(follower_id);
create index if not exists follows_followed_idx on public.follows(followed_id);

alter table public.follows enable row level security;

drop policy if exists "Follow rows are publicly readable" on public.follows;
create policy "Follow rows are readable by authenticated"
  on public.follows for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can follow others" on public.follows;
create policy "Users can follow others"
  on public.follows for insert
  with check (
    auth.uid() = follower_id
    and not exists (
      -- Cannot follow users who have blocked you or whom you've blocked.
      select 1 from public.user_blocks ub
      where (ub.blocker_id = follower_id and ub.blocked_id = followed_id)
         or (ub.blocker_id = followed_id and ub.blocked_id = follower_id)
    )
  );

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);
