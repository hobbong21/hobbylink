-- ============================================================================
-- 008_event_location_coords.sql
-- Adds optional coordinates to events so we can plot them on a map and
-- compute distance-based search. Uses simple double-precision columns; if
-- you later need rich geospatial queries, enable PostGIS with
--   create extension if not exists postgis;
-- and migrate to a geography column.
-- ============================================================================

alter table public.events
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_address text;

-- Index for coarse bounding-box queries. Not as powerful as PostGIS's
-- GiST index, but sufficient for city-scale filters.
create index if not exists events_lat_lng_idx on public.events (latitude, longitude);
