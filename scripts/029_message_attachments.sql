-- ============================================================================
-- 029_message_attachments.sql
-- Adds optional image attachment columns to messages + storage bucket for
-- DM images.
-- ============================================================================

alter table public.messages
  add column if not exists image_url text,
  add column if not exists image_path text;

-- Storage bucket for DM images. Public read is OK because URLs are
-- unguessable, and we still gate by auth on the messages table itself.
insert into storage.buckets (id, name, public)
values ('message-images', 'message-images', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'DM images are publicly readable'
  ) then
    create policy "DM images are publicly readable"
      on storage.objects for select
      using (bucket_id = 'message-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated users upload DM images'
  ) then
    create policy "Authenticated users upload DM images"
      on storage.objects for insert
      with check (
        bucket_id = 'message-images'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Uploader deletes own DM image'
  ) then
    create policy "Uploader deletes own DM image"
      on storage.objects for delete
      using (
        bucket_id = 'message-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
