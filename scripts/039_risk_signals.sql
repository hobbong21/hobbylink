-- ============================================================================
-- 039_risk_signals.sql
-- Aggregates moderation signals (reports filed against a user, blocks
-- received, suspension flags) into a single view so admins can triage.
--
-- Columns:
--   user_id, display_name, is_suspended
--   reports_7d, reports_30d
--   blocks_7d, blocks_30d
--   risk_score      — normalized 0..100
--
-- The risk_score is a simple weighted sum. Tune weights as the operator
-- team develops intuition about what signals matter most.
-- ============================================================================

create or replace view public.risk_signals as
with report_targets as (
  -- Reports are filed against arbitrary target_ids (post/comment/event/
  -- message). Walk each target back to the owning user so we can aggregate
  -- pressure on a per-user basis.
  select
    r.target_id::uuid as raw_target,
    r.created_at,
    case r.target_type
      when 'profile' then r.target_id::uuid
      when 'post' then (select author_id from public.posts where id = r.target_id::uuid)
      when 'comment' then (select author_id from public.comments where id = r.target_id::uuid)
      when 'event' then (select organizer_id from public.events where id = r.target_id::uuid)
      when 'message' then (select sender_id from public.messages where id = r.target_id::uuid)
    end as owner_id
  from public.reports r
  where r.status in ('open', 'reviewing', 'resolved')
),
report_counts as (
  select
    owner_id,
    count(*) filter (where created_at >= now() - interval '7 days') as reports_7d,
    count(*) filter (where created_at >= now() - interval '30 days') as reports_30d
  from report_targets
  where owner_id is not null
  group by owner_id
),
block_counts as (
  select
    blocked_id as owner_id,
    count(*) filter (where created_at >= now() - interval '7 days') as blocks_7d,
    count(*) filter (where created_at >= now() - interval '30 days') as blocks_30d
  from public.user_blocks
  group by blocked_id
)
select
  p.id as user_id,
  p.display_name,
  p.is_suspended,
  coalesce(rc.reports_7d, 0)::int as reports_7d,
  coalesce(rc.reports_30d, 0)::int as reports_30d,
  coalesce(bc.blocks_7d, 0)::int as blocks_7d,
  coalesce(bc.blocks_30d, 0)::int as blocks_30d,
  least(
    100,
    coalesce(rc.reports_7d, 0) * 10
      + coalesce(rc.reports_30d, 0) * 3
      + coalesce(bc.blocks_7d, 0) * 8
      + coalesce(bc.blocks_30d, 0) * 2
  )::int as risk_score
from public.profiles p
left join report_counts rc on rc.owner_id = p.id
left join block_counts bc on bc.owner_id = p.id
where coalesce(rc.reports_30d, 0) > 0 or coalesce(bc.blocks_30d, 0) > 0;
