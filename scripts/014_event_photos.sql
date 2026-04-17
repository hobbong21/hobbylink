-- ============================================================================
-- 014_event_photos.sql
-- Multi-image gallery per event. Images themselves live in the
-- `event-photos` Storage bucket; this table tracks ownership, ordering, and
-- moderation metadata.
-- ============================================================================

create table if not exists public.event_photos (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  uploader_id uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  url text not null,
  caption text check (caption is null or char_length(caption) <= 300),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists event_photos_event_idx on public.event_photos(event_id, sort_order);

alter table public.event_photos enable row level security;

drop policy if exists "Event photos readable by auth" on public.event_photos;
create policy "Event photos readable by auth"
  on public.event_photos for select
  using (auth.role() = 'authenticated');

-- Only participants (or the organizer) can upload photos.
drop policy if exists "Participants can add photos" on public.event_photos;
create policy "Participants can add photos"
  on public.event_photos for insert
  with check (
    auth.uid() = uploader_id
    and (
      exists (
        select 1 from public.event_participants ep
        where ep.event_id = event_photos.event_id
          and ep.user_id = auth.uid()
          and ep.status in ('registered', 'attended')
      )
      or exists (
        select 1 from public.events e
        where e.id = event_photos.event_id and e.organizer_id = auth.uid()
      )
    )
  );

drop policy if exists "Uploader can delete" on public.event_photos;
create policy "Uploader can delete"
  on public.event_photos for delete
  using (auth.uid() = uploader_id);

-- -------------------------------------------------------------
-- Storage bucket — event-photos (public read, auth upload).
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Event photos are publicly readable'
  ) then
    create policy "Event photos are publicly readable"
      on storage.objects for select
      using (bucket_id = 'event-photos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated users upload event photos'
  ) then
    create policy "Authenticated users upload event photos"
      on storage.objects for insert
      with check (
        bucket_id = 'event-photos'
        and auth.role() = 'authenticated'
        -- Path convention: `<event_id>/<uid>/<filename>`
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Uploader can delete own event photo'
  ) then
    create policy "Uploader can delete own event photo"
      on storage.objects for delete
      using (
        bucket_id = 'event-photos'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;
end $$;
