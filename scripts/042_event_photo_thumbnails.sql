-- ============================================================================
-- 042_event_photo_thumbnails.sql
-- Adds thumbnail columns to `event_photos` and a dedicated public bucket for
-- generated thumbnails. An Edge Function (`event-photo-thumbnails`) picks up
-- rows with thumb_status = 'pending' and fills these in asynchronously.
--
-- Layout mirrors the originals bucket so that an original at
--   event-photos/<event>/<uid>/<ts>.jpg
-- has its thumbnail at
--   event-photo-thumbnails/<event>/<uid>/<ts>.webp
-- ============================================================================

alter table public.event_photos
  add column if not exists thumb_path text,
  add column if not exists thumb_url text,
  add column if not exists thumb_status text
    check (thumb_status in ('pending', 'done', 'failed'))
    default 'pending'
    not null,
  add column if not exists thumb_error text;

-- Helpful index for the worker scan.
create index if not exists event_photos_thumb_status_idx
  on public.event_photos(thumb_status)
  where thumb_status = 'pending';

-- -------------------------------------------------------------
-- Storage bucket — thumbnails are public read. Writes happen
-- from the Edge Function using the service-role key so we only
-- need a read policy for public access.
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-photo-thumbnails', 'event-photo-thumbnails', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Event photo thumbnails are publicly readable'
  ) then
    create policy "Event photo thumbnails are publicly readable"
      on storage.objects for select
      using (bucket_id = 'event-photo-thumbnails');
  end if;
end $$;
