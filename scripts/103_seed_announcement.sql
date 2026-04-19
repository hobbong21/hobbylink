-- ============================================================================
-- 103_seed_announcement.sql
-- Launch-day announcement banner. Admins can add more or dismiss from the
-- /admin/announcements panel.
-- ============================================================================

insert into public.announcements (title, body, level, starts_at, ends_at, is_active)
values
  (
    'HobbyLink 정식 오픈 🎉',
    '베타를 거쳐 정식 오픈했어요. 지금 회원가입하고 초대 코드를 공유하면 친구 모두 프리미엄 7일 체험을 받을 수 있어요.',
    'info',
    now(),
    now() + interval '30 days',
    true
  ),
  (
    '점검 안내',
    '매주 화요일 오전 3-4시 시스템 점검이 있습니다. 이 시간대에는 일부 기능이 일시 중단될 수 있어요.',
    'info',
    now(),
    now() + interval '90 days',
    false  -- 필요 시 수동으로 true
  )
on conflict do nothing;
