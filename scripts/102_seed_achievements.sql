-- ============================================================================
-- 102_seed_achievements.sql
-- The 12 launch achievements. `points` feeds profiles.xp via the trigger in
-- 041_user_levels.sql. Keep easy achievements small (5pt) and rare ones big
-- so level progression feels earned but not grindy.
-- ============================================================================

insert into public.achievements (code, label, description, icon, points) values
  ('welcome',               '첫 발걸음',      '회원가입을 완료했어요',                     'Sparkles',     5),
  ('profile_complete',      '나를 소개하기',  '바이오, 사진, 관심사 5개 이상',              'User',        10),
  ('phone_verified',        '검증된 계정',    '전화번호 인증을 완료했어요',                'ShieldCheck', 15),
  ('first_match',           '첫 매칭',        '누군가와 상호 매칭되었어요',                 'Heart',       10),
  ('five_matches',          '인연 다섯 번',   '다섯 명과 매칭되었어요',                    'Heart',       25),
  ('first_event_join',      '첫 모임 참가',   '첫 오프라인 모임에 참가했어요',              'Calendar',    15),
  ('three_events_joined',   '모임러',         '3개 모임에 참가했어요',                      'Calendar',    30),
  ('first_event_host',      '모임 주최',      '첫 모임을 열었어요',                        'Users',       20),
  ('first_review',          '첫 후기',        '모임 후기를 남겼어요',                      'Star',        10),
  ('ten_reviews',           '성실한 평가자',  '10개 모임 후기를 남겼어요',                  'Star',        40),
  ('first_post',            '첫 게시글',      '커뮤니티에 첫 글을 올렸어요',                'MessageSquare',10),
  ('top_contributor',       '최고 기여자',    '좋아요 100개 이상 받았어요',                 'Trophy',      50)
on conflict (code) do nothing;
