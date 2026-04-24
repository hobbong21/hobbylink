-- ============================================================================
-- 103_seed_announcement.sql
-- Launch-day announcement banner. Admins can add more or dismiss from the
-- /admin/announcements panel.
-- ============================================================================

insert into public.announcements (title, body, variant, starts_at, ends_at)
values
  (
    'HobbyLink 정식 오픈 🎉',
    '베타를 거쳐 정식 오픈했어요. 지금 회원가입하고 초대 코드를 공유하면 친구 모두 프리미엄 7일 체험을 받을 수 있어요.',
    'info',
    now(),
    now() + interval '30 days'
  )
on conflict do nothing;
