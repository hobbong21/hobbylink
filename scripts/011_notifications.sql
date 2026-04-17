-- ============================================================================
-- 011_notifications.sql
-- In-app notifications feed. Triggers populate rows for common events so the
-- UI can query a single table instead of joining many sources.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum (
      'match_accepted',
      'new_message',
      'new_follower',
      'event_reminder',
      'event_cancelled',
      'system'
    );
  end if;
end $$;

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  type public.notification_type not null,
  /**
   * Loosely typed payload. UIs should read specific keys based on `type`:
   *   match_accepted: { match_id }
   *   new_message:    { peer_id, preview }
   *   new_follower:   {}
   *   event_reminder: { event_id, event_title, event_date }
   */
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, is_read) where is_read = false;
create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users see their notifications" on public.notifications;
create policy "Users see their notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can mark as read" on public.notifications;
create policy "Users can mark as read"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their notifications" on public.notifications;
create policy "Users can delete their notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- No INSERT policy — inserts happen via triggers (security definer).

-- Realtime subscription so bell icon lights up instantly.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      execute 'alter publication supabase_realtime add table public.notifications';
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Trigger: accepted match → both sides get a notification
-- ---------------------------------------------------------------------------
create or replace function public.notify_match_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'accepted')
     or (tg_op = 'INSERT' and new.status = 'accepted')
  then
    insert into public.notifications (user_id, actor_id, type, payload)
    values
      (new.user_id, new.matched_user_id, 'match_accepted', jsonb_build_object('match_id', new.id)),
      (new.matched_user_id, new.user_id, 'match_accepted', jsonb_build_object('match_id', new.id));
  end if;
  return new;
end;
$$;

drop trigger if exists matches_notify_accepted on public.matches;
create trigger matches_notify_accepted
  after insert or update on public.matches
  for each row
  execute function public.notify_match_accepted();

-- ---------------------------------------------------------------------------
-- Trigger: new message → receiver gets a notification
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, payload)
  values (
    new.receiver_id,
    new.sender_id,
    'new_message',
    jsonb_build_object(
      'peer_id', new.sender_id,
      'preview', left(coalesce(new.content, ''), 120)
    )
  );
  return new;
end;
$$;

drop trigger if exists messages_notify_new on public.messages;
create trigger messages_notify_new
  after insert on public.messages
  for each row
  execute function public.notify_new_message();

-- ---------------------------------------------------------------------------
-- Trigger: new follower → followed user gets a notification
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_follower()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, payload)
  values (new.followed_id, new.follower_id, 'new_follower', '{}'::jsonb);
  return new;
end;
$$;

drop trigger if exists follows_notify_new on public.follows;
create trigger follows_notify_new
  after insert on public.follows
  for each row
  execute function public.notify_new_follower();
