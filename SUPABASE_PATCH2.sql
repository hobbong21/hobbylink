-- ============================================================================
-- Patch 2: ensure handle_new_user trigger exists on auth.users, and backfill
-- profile rows for any existing auth.users that are missing one.
-- Safe to re-run.
-- ============================================================================

-- 1) (Re-)install the trigger function with referral support.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, bio, avatar_url, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'bio', null),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null),
    public.generate_referral_code()
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Never block auth signup; surface the error in postgres logs instead.
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

-- 2) Re-attach the trigger to auth.users.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 3) Backfill: create profile rows for any auth user that is missing one.
insert into public.profiles (id, display_name, bio, avatar_url, referral_code)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1)),
  null,
  coalesce(u.raw_user_meta_data ->> 'avatar_url', null),
  public.generate_referral_code()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
