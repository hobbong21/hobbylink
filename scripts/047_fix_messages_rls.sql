-- ============================================================================
-- 047_fix_messages_rls.sql
-- Tightens RLS policies on public.messages:
--   1. INSERT now requires an accepted match between sender and receiver,
--      and rejects inserts when either side has blocked the other.
--   2. UPDATE is restricted to the receiver toggling is_read only; a trigger
--      prevents any other column from being modified after send.
-- ============================================================================

-- ── INSERT: require accepted match + no block relationship ───────────────────
drop policy if exists "Users can send messages" on public.messages;

create policy "Users can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches
      where status = 'accepted'
        and (
          (user_id     = auth.uid() and matched_user_id = receiver_id)
          or
          (matched_user_id = auth.uid() and user_id = receiver_id)
        )
    )
    and not exists (
      select 1 from public.user_blocks
      where
        (blocker_id = auth.uid() and blocked_id = receiver_id)
        or
        (blocker_id = receiver_id and blocked_id = auth.uid())
    )
  );

-- ── UPDATE: receiver may only toggle is_read ─────────────────────────────────
drop policy if exists "Users can update messages they received" on public.messages;

create policy "Users can mark messages as read"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Trigger enforces strict immutability: every column except is_read is locked
-- permanently after insert. This prevents any client — including the receiver —
-- from falsifying message content, timestamps, participants, or attachments.
create or replace function public.prevent_message_content_edit()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.id          is distinct from old.id
  or new.sender_id   is distinct from old.sender_id
  or new.receiver_id is distinct from old.receiver_id
  or new.content     is distinct from old.content
  or new.created_at  is distinct from old.created_at
  or new.image_url   is distinct from old.image_url
  or new.image_path  is distinct from old.image_path
  then
    raise exception 'only is_read may be updated on a message';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_message_immutability on public.messages;
create trigger enforce_message_immutability
  before update on public.messages
  for each row execute function public.prevent_message_content_edit();
