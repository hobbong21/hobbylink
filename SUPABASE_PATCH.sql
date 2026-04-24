-- ============================================================================
-- Patch: fix infinite recursion in profiles SELECT policy
-- Run this once in the Supabase SQL Editor.
-- ============================================================================

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, anon, service_role;

drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Profiles readable by visibility rules" on public.profiles;

create policy "Profiles readable by visibility rules"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_admin(auth.uid())
    or (visibility = 'public' and auth.role() = 'authenticated')
    or (
      visibility = 'connections'
      and auth.role() = 'authenticated'
      and (
        exists (
          select 1 from public.matches m
          where m.status = 'accepted'
            and ((m.user_id = id and m.matched_user_id = auth.uid())
              or (m.user_id = auth.uid() and m.matched_user_id = id))
        )
        or exists (
          select 1 from public.follows f
          where f.follower_id = auth.uid() and f.followed_id = id
        )
      )
    )
  );
