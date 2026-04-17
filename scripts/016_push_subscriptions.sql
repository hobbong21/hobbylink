-- ============================================================================
-- 016_push_subscriptions.sql
-- Web Push subscriptions. One user can have many devices, each with its own
-- endpoint + keys.
-- ============================================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  last_seen_at timestamptz
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own push subs" on public.push_subscriptions;
create policy "Users manage own push subs"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
