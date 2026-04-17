-- ============================================================================
-- 004_security_hardening.sql
-- Applies security fixes on top of 001_create_tables.sql.
--
-- What this migration does
--   1. Prevents a non-admin user from promoting themselves to admin by
--      updating `profiles.is_admin` on their own row (RLS in 001 allows any
--      self-column update).
--   2. Adds integrity constraints to the `matches` table so users cannot
--      self-match or create duplicate pairs.
--   3. Tightens `profiles` SELECT so unauthenticated traffic cannot enumerate
--      all user profiles. Authenticated users can still read public fields.
--
-- Run after 001_create_tables.sql.
-- ============================================================================

-- -------------------------------------------------------------
-- 1) Prevent self-promotion to admin
-- -------------------------------------------------------------
create or replace function public.prevent_self_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_admin is distinct from new.is_admin then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    ) then
      raise exception 'Only admins can change admin status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_admin on public.profiles;

create trigger profiles_prevent_self_admin
  before update on public.profiles
  for each row
  execute function public.prevent_self_admin_change();

-- -------------------------------------------------------------
-- 2) Matches table integrity
-- -------------------------------------------------------------
alter table public.matches
  drop constraint if exists matches_no_self_match;

alter table public.matches
  add constraint matches_no_self_match
  check (user_id <> matched_user_id);

-- Unique pair so the same (user, matched_user) can only exist once.
-- Note: this does NOT prevent a reciprocal (B, A) match — application code
-- should treat such pairs as the same logical match.
alter table public.matches
  drop constraint if exists matches_unique_pair;

alter table public.matches
  add constraint matches_unique_pair
  unique (user_id, matched_user_id);

-- -------------------------------------------------------------
-- 3) Restrict profile visibility to authenticated users
-- -------------------------------------------------------------
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

create policy "Authenticated users can view profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');
