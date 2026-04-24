-- ============================================================================
-- 033_profile_visibility.sql
-- Adds a `visibility` flag on profiles so users can hide their profile from
-- anyone they haven't matched or been followed by. Default `public` keeps
-- the current behavior.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_visibility') then
    create type public.profile_visibility as enum ('public', 'connections', 'private');
  end if;
end $$;

alter table public.profiles
  add column if not exists visibility public.profile_visibility
    not null default 'public';

-- SECURITY DEFINER helper to check if the *current* caller is an admin without
-- triggering RLS recursion on the profiles table when used in profiles' own
-- policies. Takes no argument so it cannot be used to probe other users.
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

-- Drop the parameterized variant if it was created by an earlier patch.
drop function if exists public.is_admin(uuid);

-- Replace the SELECT policy from 004_security_hardening with a
-- visibility-aware version.
drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Profiles readable by visibility rules" on public.profiles;

create policy "Profiles readable by visibility rules"
  on public.profiles for select
  using (
    -- Own profile is always readable
    auth.uid() = id
    -- Admins can read everyone (uses SECURITY DEFINER to avoid recursion)
    or public.is_current_user_admin()
    -- Public profiles are readable by any authenticated user
    or (visibility = 'public' and auth.role() = 'authenticated')
    -- "connections" visibility: readable by mutual-match peers and followers
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
