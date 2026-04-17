-- ============================================================================
-- 035_recurring_events.sql
-- Tracks which events belong to the same recurring series. We generate the
-- actual occurrence rows client-side (simpler than parsing a full RRULE)
-- but persist enough metadata to later edit "this and future" or delete
-- an entire series.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'recurrence_frequency') then
    create type public.recurrence_frequency as enum ('weekly', 'biweekly', 'monthly');
  end if;
end $$;

alter table public.events
  add column if not exists series_id uuid,
  add column if not exists recurrence_frequency public.recurrence_frequency;

create index if not exists events_series_idx on public.events(series_id);
