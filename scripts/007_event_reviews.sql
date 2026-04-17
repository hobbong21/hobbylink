-- ============================================================================
-- 007_event_reviews.sql
-- Post-event reviews from participants. One review per (event, author).
-- ============================================================================

create table if not exists public.event_reviews (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 2000),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (event_id, author_id)
);

create index if not exists event_reviews_event_idx on public.event_reviews(event_id);
create index if not exists event_reviews_author_idx on public.event_reviews(author_id);

alter table public.event_reviews enable row level security;

drop policy if exists "Reviews are viewable by everyone" on public.event_reviews;
create policy "Reviews are viewable by authenticated"
  on public.event_reviews for select
  using (auth.role() = 'authenticated');

-- Only actual participants of a past event can write a review.
drop policy if exists "Attendees can write reviews" on public.event_reviews;
create policy "Attendees can write reviews"
  on public.event_reviews for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1
      from public.event_participants ep
      join public.events e on e.id = ep.event_id
      where ep.event_id = event_reviews.event_id
        and ep.user_id = auth.uid()
        and ep.status in ('registered', 'attended')
        and e.event_date < now()
    )
  );

drop policy if exists "Authors can update own reviews" on public.event_reviews;
create policy "Authors can update own reviews"
  on public.event_reviews for update
  using (auth.uid() = author_id);

drop policy if exists "Authors can delete own reviews" on public.event_reviews;
create policy "Authors can delete own reviews"
  on public.event_reviews for delete
  using (auth.uid() = author_id);
