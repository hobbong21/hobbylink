-- ============================================================================
-- 025_event_waitlist.sql
-- Add a 'waitlisted' status so a user can queue up when an event is full.
-- On free-up (cancel / leave), the earliest waitlist entry is auto-promoted.
-- ============================================================================

-- 1. Widen the status check constraint.
alter table public.event_participants
  drop constraint if exists event_participants_status_check;

alter table public.event_participants
  add constraint event_participants_status_check
  check (status in ('registered', 'attended', 'cancelled', 'waitlisted'));

-- 2. Auto-promotion trigger. Fires when someone leaves (status flips from
--    registered/attended to cancelled, or row is deleted).
create or replace function public.promote_waitlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event uuid;
  v_max   integer;
  v_cur   integer;
  v_promote uuid;
begin
  if tg_op = 'UPDATE' then
    if new.status = 'cancelled' and old.status in ('registered','attended') then
      v_event := new.event_id;
    else
      return new;
    end if;
  elsif tg_op = 'DELETE' then
    if old.status in ('registered','attended') then
      v_event := old.event_id;
    else
      return old;
    end if;
  else
    return null;
  end if;

  select max_participants, current_participants
    into v_max, v_cur
    from public.events where id = v_event;
  if v_max is null or v_cur >= v_max then
    return coalesce(new, old);
  end if;

  select user_id into v_promote
    from public.event_participants
    where event_id = v_event and status = 'waitlisted'
    order by created_at asc
    limit 1;

  if v_promote is not null then
    update public.event_participants
      set status = 'registered'
      where event_id = v_event and user_id = v_promote;

    insert into public.notifications (user_id, type, payload)
    values (v_promote, 'system', jsonb_build_object(
      'kind', 'waitlist_promoted',
      'event_id', v_event
    ));
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists event_participants_waitlist_promote on public.event_participants;
create trigger event_participants_waitlist_promote
  after update or delete on public.event_participants
  for each row execute function public.promote_waitlist();
