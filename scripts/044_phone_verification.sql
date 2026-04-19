-- ============================================================================
-- 044_phone_verification.sql
-- Surfaces phone verification status on `profiles` so RLS, UI badges, and
-- "trusted action" gates don't need to join auth.users.
--
-- The source of truth is still `auth.users.phone` + `auth.users.phone_confirmed_at`.
-- We mirror only the boolean-ish fact (verified vs not) to avoid leaking the
-- full phone number into a table readable by other users.
-- ============================================================================

alter table public.profiles
  add column if not exists phone_verified_at timestamptz;

-- Mirror phone verification into profiles whenever auth.users.phone_confirmed_at
-- flips. Runs as security definer so we can write from the auth schema trigger.
create or replace function public.sync_phone_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set phone_verified_at = new.phone_confirmed_at,
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists auth_users_phone_sync on auth.users;
create trigger auth_users_phone_sync
  after update of phone_confirmed_at on auth.users
  for each row
  when (new.phone_confirmed_at is distinct from old.phone_confirmed_at)
  execute function public.sync_phone_verified();

-- Backfill existing verified users.
update public.profiles p
set phone_verified_at = u.phone_confirmed_at
from auth.users u
where u.id = p.id
  and u.phone_confirmed_at is not null
  and p.phone_verified_at is distinct from u.phone_confirmed_at;

-- Helper: is the currently-authenticated user phone-verified?
create or replace function public.is_phone_verified()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
      and phone_verified_at is not null
  );
$$;

grant execute on function public.is_phone_verified() to authenticated;
