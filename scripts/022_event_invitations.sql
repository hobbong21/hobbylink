-- ============================================================================
-- 022_event_invitations.sql
-- Organizer-issued invitations to specific users. Acceptance becomes a
-- row in event_participants.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type public.invitation_status as enum ('pending', 'accepted', 'declined');
  end if;
end $$;

create table if not exists public.event_invitations (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  invitee_id uuid references public.profiles(id) on delete cascade not null,
  inviter_id uuid references public.profiles(id) on delete set null,
  status public.invitation_status not null default 'pending',
  message text check (message is null or char_length(message) <= 500),
  created_at timestamptz not null default timezone('utc'::text, now()),
  responded_at timestamptz,
  unique (event_id, invitee_id)
);

create index if not exists event_invitations_invitee_idx
  on public.event_invitations(invitee_id, status);

alter table public.event_invitations enable row level security;

drop policy if exists "Invitee sees own invitations" on public.event_invitations;
create policy "Invitee sees own invitations"
  on public.event_invitations for select
  using (auth.uid() = invitee_id or auth.uid() = inviter_id);

drop policy if exists "Organizer sends invitations" on public.event_invitations;
create policy "Organizer sends invitations"
  on public.event_invitations for insert
  with check (
    auth.uid() = inviter_id
    and exists (
      select 1 from public.events e
      where e.id = event_invitations.event_id and e.organizer_id = auth.uid()
    )
  );

drop policy if exists "Invitee updates own invitations" on public.event_invitations;
create policy "Invitee updates own invitations"
  on public.event_invitations for update
  using (auth.uid() = invitee_id);

-- Ingests an invitation notification.
create or replace function public.notify_event_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, payload)
  values (
    new.invitee_id,
    new.inviter_id,
    'system',
    jsonb_build_object('kind', 'event_invite', 'event_id', new.event_id, 'invitation_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists event_invitations_notify on public.event_invitations;
create trigger event_invitations_notify
  after insert on public.event_invitations
  for each row execute function public.notify_event_invite();
