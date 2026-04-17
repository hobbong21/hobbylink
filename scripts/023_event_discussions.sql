-- ============================================================================
-- 023_event_discussions.sql
-- Per-event discussion thread. Only the organizer + registered participants
-- can read/post. Great for coordinating the actual meetup.
-- ============================================================================

create table if not exists public.event_messages (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists event_messages_event_idx
  on public.event_messages(event_id, created_at desc);

alter table public.event_messages enable row level security;

-- Read: organizer + registered/attended participants.
drop policy if exists "Participants read discussion" on public.event_messages;
create policy "Participants read discussion"
  on public.event_messages for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_messages.event_id and e.organizer_id = auth.uid()
    )
    or exists (
      select 1 from public.event_participants ep
      where ep.event_id = event_messages.event_id
        and ep.user_id = auth.uid()
        and ep.status in ('registered','attended')
    )
  );

-- Post: same gating.
drop policy if exists "Participants post discussion" on public.event_messages;
create policy "Participants post discussion"
  on public.event_messages for insert
  with check (
    auth.uid() = author_id
    and (
      exists (
        select 1 from public.events e
        where e.id = event_messages.event_id and e.organizer_id = auth.uid()
      )
      or exists (
        select 1 from public.event_participants ep
        where ep.event_id = event_messages.event_id
          and ep.user_id = auth.uid()
          and ep.status in ('registered','attended')
      )
    )
  );

drop policy if exists "Authors delete own discussion msg" on public.event_messages;
create policy "Authors delete own discussion msg"
  on public.event_messages for delete
  using (auth.uid() = author_id);

-- Realtime
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'event_messages'
    ) then
      execute 'alter publication supabase_realtime add table public.event_messages';
    end if;
  end if;
end $$;
