-- ============================================================================
-- 032_post_drafts.sql
-- One auto-saved draft per user — the most recent "work in progress" post
-- body. Replaces itself on every save so storage stays bounded.
-- ============================================================================

create table if not exists public.post_drafts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.post_drafts enable row level security;

drop policy if exists "Users manage own draft" on public.post_drafts;
create policy "Users manage own draft"
  on public.post_drafts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
