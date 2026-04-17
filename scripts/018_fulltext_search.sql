-- ============================================================================
-- 018_fulltext_search.sql
-- Trigram indexes on commonly searched columns. Dramatically speeds up the
-- ILIKE searches in /search and /explore once row counts grow beyond a few
-- thousand.
--
-- Uses pg_trgm. Available on Supabase by default.
-- ============================================================================

create extension if not exists pg_trgm;

-- Hobbies
create index if not exists hobbies_name_trgm_idx
  on public.hobbies using gin (name gin_trgm_ops);
create index if not exists hobbies_description_trgm_idx
  on public.hobbies using gin (description gin_trgm_ops);

-- Profiles (display_name + bio)
create index if not exists profiles_display_name_trgm_idx
  on public.profiles using gin (display_name gin_trgm_ops);
create index if not exists profiles_bio_trgm_idx
  on public.profiles using gin (bio gin_trgm_ops);

-- Events
create index if not exists events_title_trgm_idx
  on public.events using gin (title gin_trgm_ops);
create index if not exists events_description_trgm_idx
  on public.events using gin (description gin_trgm_ops);
create index if not exists events_location_trgm_idx
  on public.events using gin (location gin_trgm_ops);

-- Posts
create index if not exists posts_content_trgm_idx
  on public.posts using gin (content gin_trgm_ops);
