-- ============================================================================
-- 048_fix_storage_security.sql
-- Converts the three media buckets from public to private and replaces
-- open-to-the-internet SELECT policies with properly scoped ones.
--
--   message-images        → only the sender/receiver of the containing message
--   event-photos          → any authenticated user
--   event-photo-thumbnails → any authenticated user
-- ============================================================================

-- ── message-images ───────────────────────────────────────────────────────────
update storage.buckets
  set public = false
  where id = 'message-images';

drop policy if exists "DM images are publicly readable" on storage.objects;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename   = 'objects'
      and policyname  = 'Message participants can view DM images'
  ) then
    create policy "Message participants can view DM images"
      on storage.objects for select
      using (
        bucket_id = 'message-images'
        and auth.role() = 'authenticated'
        and (
          -- the uploader can always read files they own
          (storage.foldername(name))[1] = auth.uid()::text
          -- the recipient may read the file only when a legitimate message
          -- references this exact path AND the first path segment matches the
          -- sender's uuid (proving the sender actually owns the file and the
          -- path was not forged by a third party)
          or exists (
            select 1 from public.messages
            where image_path = name
              and receiver_id = auth.uid()
              and sender_id::text = (storage.foldername(name))[1]
          )
        )
      );
  end if;
end $$;

-- ── event-photos ─────────────────────────────────────────────────────────────
update storage.buckets
  set public = false
  where id = 'event-photos';

drop policy if exists "Event photos are publicly readable" on storage.objects;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename   = 'objects'
      and policyname  = 'Authenticated users can view event photos'
  ) then
    create policy "Authenticated users can view event photos"
      on storage.objects for select
      using (
        bucket_id = 'event-photos'
        and auth.role() = 'authenticated'
      );
  end if;
end $$;

-- ── event-photo-thumbnails ───────────────────────────────────────────────────
update storage.buckets
  set public = false
  where id = 'event-photo-thumbnails';

drop policy if exists "Event photo thumbnails are publicly readable" on storage.objects;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename   = 'objects'
      and policyname  = 'Authenticated users can view event photo thumbnails'
  ) then
    create policy "Authenticated users can view event photo thumbnails"
      on storage.objects for select
      using (
        bucket_id = 'event-photo-thumbnails'
        and auth.role() = 'authenticated'
      );
  end if;
end $$;
