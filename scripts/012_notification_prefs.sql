-- ============================================================================
-- 012_notification_prefs.sql
-- Per-user notification channel preferences.
-- ============================================================================

create table if not exists public.notification_prefs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_on_match boolean not null default true,
  email_on_new_message boolean not null default false,
  email_on_event_reminder boolean not null default true,
  inapp_on_follow boolean not null default true,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.notification_prefs enable row level security;

drop policy if exists "Users manage own prefs" on public.notification_prefs;
create policy "Users manage own prefs"
  on public.notification_prefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
