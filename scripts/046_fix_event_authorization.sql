-- ============================================================================
-- 046_fix_event_authorization.sql
-- Fixes two event authorization vulnerabilities:
--
-- 1. [High] event_participants RLS policies were too permissive:
--    - INSERT allowed any authenticated user to write arbitrary status values
--      (including 'attended') directly to the table, bypassing capacity limits
--      and waitlist logic enforced only in application code.
--    - UPDATE allowed users to promote themselves from waitlisted/cancelled to
--      'registered' or 'attended' without DB-level capacity enforcement.
--    Fix: remove user INSERT access entirely; add a SECURITY DEFINER function
--    join_event() that enforces capacity atomically; restrict user UPDATE to
--    the single allowed self-service transition (→ 'cancelled').
--
-- 2. [Low] event-photos storage bucket INSERT policy only checked
--    authentication + path UID, not actual event membership/organizer status.
-- ============================================================================

-- ============================================================================
-- Part 1a: join_event() – SECURITY DEFINER, capacity-enforcing registration
-- ============================================================================
-- This function is the ONLY path through which a participant row with status
-- 'registered' or 'waitlisted' may be created or restored for a given user.
-- It runs as the DB owner (bypasses RLS) and serialises concurrent
-- registrations for the same event using FOR UPDATE on the events row.

create or replace function public.join_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid    := auth.uid();
  v_max       integer;
  v_cur       integer;
  v_existing  text;
  v_new_status text;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'message', 'Not authenticated');
  end if;

  -- Serialise concurrent registrations: lock the event row.
  select max_participants, current_participants
    into v_max, v_cur
    from public.events
   where id = p_event_id
     for update;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Event not found');
  end if;

  -- If the caller already has an active status, return it unchanged.
  select status into v_existing
    from public.event_participants
   where event_id = p_event_id and user_id = v_user_id;

  if v_existing in ('registered', 'attended', 'waitlisted') then
    return jsonb_build_object('ok', true, 'status', v_existing);
  end if;

  -- Determine target status from current capacity.
  if v_max is null or v_cur < v_max then
    v_new_status := 'registered';
  else
    v_new_status := 'waitlisted';
  end if;

  -- Insert or restore (was 'cancelled').
  insert into public.event_participants (event_id, user_id, status)
    values (p_event_id, v_user_id, v_new_status)
  on conflict (event_id, user_id) do update
    set status = v_new_status;

  return jsonb_build_object('ok', true, 'status', v_new_status);
end;
$$;

-- ============================================================================
-- Part 1b: Tighten event_participants RLS
-- ============================================================================

-- Remove the old INSERT policy: no direct table-level inserts for regular
-- users.  All registrations must go through join_event() above.
drop policy if exists "Users can register for events" on public.event_participants;

-- UPDATE: users may only cancel their own registration.  All other status
-- transitions (waitlisted → registered, cancelled → registered, * → attended)
-- are handled exclusively by SECURITY DEFINER functions/triggers.
drop policy if exists "Users can update their own registration" on public.event_participants;
create policy "Users can cancel their own registration"
  on public.event_participants for update
  using  (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and status = 'cancelled'
  );

-- ============================================================================
-- Part 1c: Trigger – prevent event_id reassignment on any UPDATE
-- ============================================================================
create or replace function public.prevent_event_id_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_id <> old.event_id then
    raise exception
      'Changing event_id on event_participants is not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists event_participants_lock_event_id on public.event_participants;
create trigger event_participants_lock_event_id
  before update on public.event_participants
  for each row execute function public.prevent_event_id_change();

-- ============================================================================
-- Part 2: Tighten event-photos storage bucket upload policy
-- ============================================================================
-- Drop the old permissive policy and replace it with one that also verifies
-- the uploader is either the event organizer or an accepted participant.
-- Path convention: `<event_id>/<uid>/<filename>`

do $$
begin
  drop policy if exists "Authenticated users upload event photos" on storage.objects;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'Participants upload event photos'
  ) then
    create policy "Participants upload event photos"
      on storage.objects for insert
      with check (
        bucket_id = 'event-photos'
        and auth.role() = 'authenticated'
        -- Second path segment must be the uploader's own UID.
        and (storage.foldername(name))[2] = auth.uid()::text
        -- First path segment must be a well-formed UUID to avoid cast errors.
        and (storage.foldername(name))[1]
              ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        -- Caller must be an accepted participant or the organizer.
        and (
          exists (
            select 1 from public.event_participants ep
            where ep.event_id = (storage.foldername(name))[1]::uuid
              and ep.user_id  = auth.uid()
              and ep.status  in ('registered', 'attended')
          )
          or exists (
            select 1 from public.events e
            where e.id          = (storage.foldername(name))[1]::uuid
              and e.organizer_id = auth.uid()
          )
        )
      );
  end if;
end $$;
