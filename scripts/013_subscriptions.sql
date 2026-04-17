-- ============================================================================
-- 013_subscriptions.sql
-- Minimal subscription schema for future Stripe / Toss integration.
-- Creates a 'subscriptions' table the app can read and update when a webhook
-- fires.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_tier') then
    create type public.subscription_tier as enum ('free', 'premium');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum (
      'trialing', 'active', 'past_due', 'canceled', 'incomplete'
    );
  end if;
end $$;

create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  status public.subscription_status not null default 'active',
  provider text,                      -- e.g. 'stripe', 'toss'
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists subscriptions_status_idx on public.subscriptions(status);

alter table public.subscriptions enable row level security;

drop policy if exists "Users see their subscription" on public.subscriptions;
create policy "Users see their subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Writes happen only via webhook endpoint using the service role key.
-- No user-facing INSERT/UPDATE/DELETE policies on purpose.
