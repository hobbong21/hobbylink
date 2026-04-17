-- ============================================================================
-- 036_notification_sound.sql
-- Adds in-app sound + vibration preferences to notification_prefs.
-- ============================================================================

alter table public.notification_prefs
  add column if not exists play_sound boolean not null default true,
  add column if not exists vibrate boolean not null default false;
