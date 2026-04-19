-- ============================================================================
-- 041_user_levels.sql
-- Materializes the sum of achievement points per user into `profiles.xp`
-- and computes a simple level. Triggers keep it in sync.
--
-- Level formula: level = floor(sqrt(xp / 20)) + 1
--   level 1  :    0 xp
--   level 2  :   20 xp
--   level 3  :   80 xp
--   level 4  :  180 xp
--   level 5  :  320 xp  ...
-- ============================================================================

alter table public.profiles
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1;

create or replace function public.compute_level(p_xp integer)
returns integer
language sql
immutable
as $$
  select greatest(1, floor(sqrt(coalesce(p_xp, 0)::numeric / 20))::int + 1);
$$;

-- Backfill existing rows.
update public.profiles p
set xp = coalesce(
  (select sum(a.points) from public.user_achievements ua
   join public.achievements a on a.code = ua.code
   where ua.user_id = p.id),
  0
),
level = public.compute_level(
  coalesce(
    (select sum(a.points) from public.user_achievements ua
     join public.achievements a on a.code = ua.code
     where ua.user_id = p.id),
    0
  )
);

-- Trigger: recompute on unlock.
create or replace function public.recompute_user_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_new_xp int;
begin
  v_user := coalesce(new.user_id, old.user_id);
  select coalesce(sum(a.points), 0) into v_new_xp
  from public.user_achievements ua
  join public.achievements a on a.code = ua.code
  where ua.user_id = v_user;

  update public.profiles
  set xp = v_new_xp,
      level = public.compute_level(v_new_xp),
      updated_at = now()
  where id = v_user;

  return coalesce(new, old);
end;
$$;

drop trigger if exists user_achievements_xp_sync on public.user_achievements;
create trigger user_achievements_xp_sync
  after insert or delete on public.user_achievements
  for each row execute function public.recompute_user_xp();
