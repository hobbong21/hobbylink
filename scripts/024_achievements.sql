-- ============================================================================
-- 024_achievements.sql
-- Lightweight badges/achievements. Each row in `user_achievements` is a
-- time-stamped unlock of a specific `achievement_code`.
-- ============================================================================

create table if not exists public.achievements (
  code text primary key,
  label text not null,
  description text not null,
  icon text,          -- lucide icon name, resolved client-side
  points integer not null default 10,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.user_achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  code text references public.achievements(code) on delete cascade not null,
  earned_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, code)
);

create index if not exists user_achievements_user_idx on public.user_achievements(user_id);

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

drop policy if exists "Achievements catalog readable" on public.achievements;
create policy "Achievements catalog readable"
  on public.achievements for select
  using (true);

drop policy if exists "Users see own unlocks" on public.user_achievements;
create policy "Users see own unlocks"
  on public.user_achievements for select
  using (auth.role() = 'authenticated');
-- Writes go through SECURITY DEFINER functions only (no RLS for insert).

-- -------------------------------------------------------------
-- Seed a baseline catalog.
-- -------------------------------------------------------------
insert into public.achievements (code, label, description, icon, points) values
  ('first_hobby',     '첫 관심사', '관심사를 하나 이상 등록했어요',          'Sparkles',  5),
  ('three_hobbies',   '다재다능',  '관심사를 3개 이상 등록했어요',            'Sparkles', 10),
  ('first_match',     '첫 매칭',   '상호 매칭을 성사시켰어요',                'Heart',    10),
  ('ten_matches',     '인기쟁이',  '10명과 매칭되었어요',                     'Heart',    30),
  ('first_event',     '첫 모임',   '오프라인 모임에 처음 참가했어요',         'Calendar', 10),
  ('first_hosted',    '주최자',    '모임을 직접 만들었어요',                  'Calendar', 20),
  ('first_post',      '첫 게시글', '커뮤니티에 처음 글을 남겼어요',           'MessageSquare', 10),
  ('first_review',    '후기 남기기','이벤트 후 별점/후기를 남겼어요',          'Star',      10),
  ('ten_followers',   '팔로워 10',  '10명 이상의 팔로워가 생겼어요',           'Users',    20)
on conflict (code) do nothing;

-- -------------------------------------------------------------
-- Atomic unlock helper (callable from app code via RPC).
-- Returns true if the unlock was new.
-- -------------------------------------------------------------
create or replace function public.unlock_achievement(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_inserted int;
begin
  if v_user is null then return false; end if;
  insert into public.user_achievements (user_id, code)
  values (v_user, p_code)
  on conflict (user_id, code) do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted > 0;
end;
$$;

-- -------------------------------------------------------------
-- Auto-triggers for passive unlocks.
-- -------------------------------------------------------------

-- user_hobbies: first_hobby / three_hobbies
create or replace function public.achievement_hobby_check()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  select count(*) into v_count
    from public.user_hobbies
    where user_id = new.user_id;
  if v_count >= 1 then
    insert into public.user_achievements (user_id, code)
    values (new.user_id, 'first_hobby')
    on conflict (user_id, code) do nothing;
  end if;
  if v_count >= 3 then
    insert into public.user_achievements (user_id, code)
    values (new.user_id, 'three_hobbies')
    on conflict (user_id, code) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists user_hobbies_achievement on public.user_hobbies;
create trigger user_hobbies_achievement
  after insert on public.user_hobbies
  for each row execute function public.achievement_hobby_check();

-- matches: first_match / ten_matches (triggered on accepted status)
create or replace function public.achievement_match_check()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if new.status <> 'accepted' then return new; end if;
  -- count accepted matches for both sides
  for v_count in
    select count(*) from public.matches
    where status = 'accepted'
      and (user_id = new.user_id or matched_user_id = new.user_id)
  loop
    if v_count >= 1 then
      insert into public.user_achievements (user_id, code)
      values (new.user_id, 'first_match')
      on conflict (user_id, code) do nothing;
    end if;
    if v_count >= 10 then
      insert into public.user_achievements (user_id, code)
      values (new.user_id, 'ten_matches')
      on conflict (user_id, code) do nothing;
    end if;
  end loop;
  -- same for the other side
  for v_count in
    select count(*) from public.matches
    where status = 'accepted'
      and (user_id = new.matched_user_id or matched_user_id = new.matched_user_id)
  loop
    if v_count >= 1 then
      insert into public.user_achievements (user_id, code)
      values (new.matched_user_id, 'first_match')
      on conflict (user_id, code) do nothing;
    end if;
    if v_count >= 10 then
      insert into public.user_achievements (user_id, code)
      values (new.matched_user_id, 'ten_matches')
      on conflict (user_id, code) do nothing;
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists matches_achievement on public.matches;
create trigger matches_achievement
  after insert or update on public.matches
  for each row execute function public.achievement_match_check();

-- events: first_hosted
create or replace function public.achievement_event_hosted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_achievements (user_id, code)
  values (new.organizer_id, 'first_hosted')
  on conflict (user_id, code) do nothing;
  return new;
end;
$$;

drop trigger if exists events_achievement on public.events;
create trigger events_achievement
  after insert on public.events
  for each row execute function public.achievement_event_hosted();

-- event_participants: first_event
create or replace function public.achievement_event_joined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('registered','attended') then
    insert into public.user_achievements (user_id, code)
    values (new.user_id, 'first_event')
    on conflict (user_id, code) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists event_participants_achievement on public.event_participants;
create trigger event_participants_achievement
  after insert on public.event_participants
  for each row execute function public.achievement_event_joined();

-- posts: first_post
create or replace function public.achievement_first_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_achievements (user_id, code)
  values (new.author_id, 'first_post')
  on conflict (user_id, code) do nothing;
  return new;
end;
$$;

drop trigger if exists posts_achievement on public.posts;
create trigger posts_achievement
  after insert on public.posts
  for each row execute function public.achievement_first_post();

-- event_reviews: first_review
create or replace function public.achievement_first_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_achievements (user_id, code)
  values (new.author_id, 'first_review')
  on conflict (user_id, code) do nothing;
  return new;
end;
$$;

drop trigger if exists reviews_achievement on public.event_reviews;
create trigger reviews_achievement
  after insert on public.event_reviews
  for each row execute function public.achievement_first_review();

-- follows: ten_followers (on the followed user)
create or replace function public.achievement_follower_milestones()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  select count(*) into v_count from public.follows where followed_id = new.followed_id;
  if v_count >= 10 then
    insert into public.user_achievements (user_id, code)
    values (new.followed_id, 'ten_followers')
    on conflict (user_id, code) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists follows_achievement on public.follows;
create trigger follows_achievement
  after insert on public.follows
  for each row execute function public.achievement_follower_milestones();
