-- ============================================================================
-- 019_hobby_member_count.sql
-- Keep hobbies.member_count in sync with user_hobbies. Seed data set manual
-- values in 003; this migration replaces them with the actual live count and
-- installs a trigger to maintain the value going forward.
-- ============================================================================

create or replace function public.sync_hobby_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.hobbies
      set member_count = coalesce(member_count, 0) + 1
      where id = new.hobby_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.hobbies
      set member_count = greatest(coalesce(member_count, 0) - 1, 0)
      where id = old.hobby_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists user_hobbies_count_sync on public.user_hobbies;
create trigger user_hobbies_count_sync
  after insert or delete on public.user_hobbies
  for each row execute function public.sync_hobby_member_count();

-- One-time recount to correct any drift.
update public.hobbies h
set member_count = coalesce(
  (select count(*) from public.user_hobbies uh where uh.hobby_id = h.id),
  0
);
