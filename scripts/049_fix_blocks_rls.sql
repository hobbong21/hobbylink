-- ============================================================================
-- 049_fix_blocks_rls.sql
-- Fix symmetric block enforcement: the blocked user must also be able to
-- SELECT their incoming block rows so that the application can correctly
-- apply bidirectional visibility filtering.
--
-- Previously the SELECT policy only allowed the blocker_id to read rows,
-- which meant queries like:
--   select blocker_id from user_blocks where blocked_id = auth.uid()
-- were silently filtered out by RLS, making incoming-block checks blind.
--
-- The `reason` column is restricted to service_role only (via column-level
-- privileges) because it is an internal moderation field that is neither
-- collected from nor displayed to regular users.
-- ============================================================================

drop policy if exists "Users can see their own blocks" on public.user_blocks;
create policy "Users can see their own blocks"
  on public.user_blocks for select
  using (auth.uid() = blocker_id or auth.uid() = blocked_id);

-- Restrict the `reason` column so that regular authenticated users cannot
-- read it directly via the API.  The application never selects this column
-- for end-users; it is only relevant for admin/moderation tooling which runs
-- under service_role and is unaffected by this grant.
revoke select (reason) on public.user_blocks from authenticated;
revoke select (reason) on public.user_blocks from anon;
