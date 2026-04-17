-- ============================================================================
-- 020_post_images_bucket.sql
-- Storage bucket for community post images. Public read, auth uploads into
-- own-uid folder only.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Post images are publicly readable'
  ) then
    create policy "Post images are publicly readable"
      on storage.objects for select
      using (bucket_id = 'post-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated users upload post images'
  ) then
    create policy "Authenticated users upload post images"
      on storage.objects for insert
      with check (
        bucket_id = 'post-images'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Uploader can delete own post image'
  ) then
    create policy "Uploader can delete own post image"
      on storage.objects for delete
      using (
        bucket_id = 'post-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
