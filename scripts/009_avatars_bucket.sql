-- ============================================================================
-- 009_avatars_bucket.sql
-- Creates a public 'avatars' bucket and RLS policies so users can upload
-- their own profile images. Run once against storage.buckets / storage.objects.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Everyone can read avatars (public bucket, but we still add a policy
-- for clarity and future migration to private bucket if needed).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Avatars are publicly readable'
  ) then
    create policy "Avatars are publicly readable"
      on storage.objects for select
      using (bucket_id = 'avatars');
  end if;

  -- Upload: only authenticated users, only into a folder named after their
  -- auth uid. Path convention: `avatars/<uid>/<filename>`.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users upload their own avatar'
  ) then
    create policy "Users upload their own avatar"
      on storage.objects for insert
      with check (
        bucket_id = 'avatars'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users update their own avatar'
  ) then
    create policy "Users update their own avatar"
      on storage.objects for update
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users delete their own avatar'
  ) then
    create policy "Users delete their own avatar"
      on storage.objects for delete
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
