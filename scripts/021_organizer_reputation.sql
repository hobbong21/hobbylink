-- ============================================================================
-- 021_organizer_reputation.sql
-- View that exposes each organizer's aggregate review stats. Used on the
-- profile page and event detail to build trust.
-- ============================================================================

create or replace view public.organizer_reputation as
  select
    e.organizer_id as user_id,
    count(distinct r.id) as review_count,
    round(avg(r.rating)::numeric, 2) as avg_rating,
    count(distinct e.id) as events_organized
  from public.events e
  left join public.event_reviews r on r.event_id = e.id
  group by e.organizer_id;

-- Helper function for read-by-user-id lookups.
create or replace function public.get_organizer_reputation(p_user_id uuid)
returns table (review_count bigint, avg_rating numeric, events_organized bigint)
language sql
stable
security definer
set search_path = public
as $$
  select review_count, avg_rating, events_organized
  from public.organizer_reputation
  where user_id = p_user_id;
$$;
