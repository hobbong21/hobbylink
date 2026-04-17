-- ============================================================================
-- 005_realtime_and_counters.sql
-- Enables Supabase Realtime on the messages table so the thread view can
-- subscribe to live INSERTs. Also adds triggers that keep denormalized
-- counters in sync instead of relying on the client to update them.
--
-- Run after 004_security_hardening.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Realtime publication for messages (and posts / events for future use)
-- ---------------------------------------------------------------------------
-- `supabase_realtime` is the default publication created by Supabase.
-- Adding a table to it makes INSERT/UPDATE/DELETE events broadcastable.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    -- messages
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      execute 'alter publication supabase_realtime add table public.messages';
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Auto-sync posts.likes_count
-- ---------------------------------------------------------------------------
create or replace function public.sync_post_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
      set likes_count = coalesce(likes_count, 0) + 1
      where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts
      set likes_count = greatest(coalesce(likes_count, 0) - 1, 0)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists post_likes_sync on public.post_likes;
create trigger post_likes_sync
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_likes_count();

-- ---------------------------------------------------------------------------
-- 3) Auto-sync posts.comments_count
-- ---------------------------------------------------------------------------
create or replace function public.sync_post_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
      set comments_count = coalesce(comments_count, 0) + 1
      where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts
      set comments_count = greatest(coalesce(comments_count, 0) - 1, 0)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_sync on public.comments;
create trigger comments_sync
  after insert or delete on public.comments
  for each row execute function public.sync_post_comments_count();

-- ---------------------------------------------------------------------------
-- 4) Auto-sync events.current_participants
-- ---------------------------------------------------------------------------
create or replace function public.sync_event_participants_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'registered' or new.status = 'attended' then
      update public.events
        set current_participants = coalesce(current_participants, 0) + 1
        where id = new.event_id;
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if old.status in ('registered','attended') and new.status = 'cancelled' then
      update public.events
        set current_participants = greatest(coalesce(current_participants, 0) - 1, 0)
        where id = new.event_id;
    elsif old.status = 'cancelled' and new.status in ('registered','attended') then
      update public.events
        set current_participants = coalesce(current_participants, 0) + 1
        where id = new.event_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.status in ('registered','attended') then
      update public.events
        set current_participants = greatest(coalesce(current_participants, 0) - 1, 0)
        where id = old.event_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists event_participants_sync on public.event_participants;
create trigger event_participants_sync
  after insert or update or delete on public.event_participants
  for each row execute function public.sync_event_participants_count();
