-- ============================================================================
-- Patch: fix infinite recursion in profiles SELECT policy + close the
-- admin-status probing leak from the earlier parameterized helper.
-- Safe to re-run; everything is idempotent.
-- Run this once in the Supabase SQL Editor.
-- ============================================================================

-- New no-arg helper. Cannot be used to probe other users' admin status.
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated, anon, service_role;

-- Drop policies before dropping the old function, since they may reference it.
drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Profiles readable by visibility rules" on public.profiles;

-- Remove the parameterized variant that any logged-in user could probe.
drop function if exists public.is_admin(uuid);

create policy "Profiles readable by visibility rules"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.is_current_user_admin()
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
