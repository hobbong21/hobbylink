-- ============================================================================
-- 030_post_reactions.sql
-- Emoji reactions on community posts. Each user can have at most one
-- reaction of each type per post (enforced by unique index).
-- ============================================================================

create table if not exists public.post_reactions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reaction text not null check (reaction in ('like','love','laugh','wow','sad','clap')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (post_id, user_id, reaction)
);

create index if not exists post_reactions_post_idx on public.post_reactions(post_id, reaction);

alter table public.post_reactions enable row level security;

drop policy if exists "Reactions readable" on public.post_reactions;
create policy "Reactions readable"
  on public.post_reactions for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users toggle own reactions" on public.post_reactions;
create policy "Users toggle own reactions"
  on public.post_reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users remove own reactions" on public.post_reactions;
create policy "Users remove own reactions"
  on public.post_reactions for delete
  using (auth.uid() = user_id);
