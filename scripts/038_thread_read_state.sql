-- ============================================================================
-- 038_thread_read_state.sql
-- Per-thread read marker. Cheap way to render a "─── 여기까지 읽었어요 ───"
-- divider in a conversation and scroll to the first unread message on load.
-- ============================================================================

create table if not exists public.thread_read_state (
  user_id uuid references public.profiles(id) on delete cascade not null,
  peer_id uuid references public.profiles(id) on delete cascade not null,
  last_read_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, peer_id)
);

alter table public.thread_read_state enable row level security;

drop policy if exists "Users manage own thread state" on public.thread_read_state;
create policy "Users manage own thread state"
  on public.thread_read_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
