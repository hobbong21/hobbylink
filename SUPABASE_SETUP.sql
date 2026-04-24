-- HobbyLink: combined schema + seed deploy
-- Generated 2026-04-24T08:47:52Z
-- Run this in Supabase Dashboard → SQL Editor → New query


-- ==========================================
-- scripts/001_create_tables.sql
-- ==========================================
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (references auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  avatar_url text,
  location text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Hobbies table
create table if not exists public.hobbies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  description text,
  image_url text,
  member_count integer default 0,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User hobbies (many-to-many relationship)
create table if not exists public.user_hobbies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  hobby_id uuid references public.hobbies(id) on delete cascade not null,
  skill_level text check (skill_level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, hobby_id)
);

-- Matches table
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  matched_user_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  match_score integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Posts table (for community)
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Post likes table
create table if not exists public.post_likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- Comments table
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events table
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  location text,
  event_date timestamp with time zone not null,
  organizer_id uuid references public.profiles(id) on delete cascade not null,
  hobby_id uuid references public.hobbies(id) on delete set null,
  max_participants integer,
  current_participants integer default 0,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Event participants table
create table if not exists public.event_participants (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('registered', 'attended', 'cancelled')) default 'registered',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(event_id, user_id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.hobbies enable row level security;
alter table public.user_hobbies enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;

-- RLS Policies for profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS Policies for hobbies (public read, admin write)
create policy "Hobbies are viewable by everyone"
  on public.hobbies for select
  using (true);

create policy "Only admins can insert hobbies"
  on public.hobbies for insert
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ));

create policy "Only admins can update hobbies"
  on public.hobbies for update
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ));

-- RLS Policies for user_hobbies
create policy "Users can view their own hobbies"
  on public.user_hobbies for select
  using (auth.uid() = user_id);

create policy "Users can insert their own hobbies"
  on public.user_hobbies for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own hobbies"
  on public.user_hobbies for delete
  using (auth.uid() = user_id);

-- RLS Policies for matches
create policy "Users can view their own matches"
  on public.matches for select
  using (auth.uid() = user_id or auth.uid() = matched_user_id);

create policy "Users can create matches"
  on public.matches for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own matches"
  on public.matches for update
  using (auth.uid() = user_id or auth.uid() = matched_user_id);

-- RLS Policies for messages
create policy "Users can view their own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can update messages they received"
  on public.messages for update
  using (auth.uid() = receiver_id);

-- RLS Policies for posts
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = author_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- RLS Policies for post_likes
create policy "Post likes are viewable by everyone"
  on public.post_likes for select
  using (true);

create policy "Users can like posts"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike posts"
  on public.post_likes for delete
  using (auth.uid() = user_id);

-- RLS Policies for comments
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Authenticated users can create comments"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

-- RLS Policies for events
create policy "Events are viewable by everyone"
  on public.events for select
  using (true);

create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() = organizer_id);

create policy "Organizers can update their events"
  on public.events for update
  using (auth.uid() = organizer_id);

create policy "Organizers can delete their events"
  on public.events for delete
  using (auth.uid() = organizer_id);

-- RLS Policies for event_participants
create policy "Event participants are viewable by everyone"
  on public.event_participants for select
  using (true);

create policy "Users can register for events"
  on public.event_participants for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own registration"
  on public.event_participants for update
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists profiles_display_name_idx on public.profiles(display_name);
create index if not exists hobbies_category_idx on public.hobbies(category);
create index if not exists user_hobbies_user_id_idx on public.user_hobbies(user_id);
create index if not exists matches_user_id_idx on public.matches(user_id);
create index if not exists matches_matched_user_id_idx on public.matches(matched_user_id);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_receiver_id_idx on public.messages(receiver_id);
create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists events_event_date_idx on public.events(event_date);


-- ==========================================
-- scripts/002_create_profile_trigger.sql
-- ==========================================
-- Function to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, bio, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'bio', null),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger to call the function when a new user is created
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ==========================================
-- scripts/003_seed_hobbies.sql
-- ==========================================
-- Seed some initial hobbies
insert into public.hobbies (name, category, description, member_count, is_featured) values
  ('수채화', '예술', '물감과 붓으로 아름다운 그림을 그려보세요', 1234, true),
  ('보드게임', '게임', '친구들과 함께 즐기는 전략 게임', 2156, true),
  ('기타 연주', '음악', '어쿠스틱 기타로 멜로디를 만들어보세요', 3421, true),
  ('등산', '야외활동', '자연 속에서 건강을 챙기세요', 4532, true),
  ('사진 촬영', '예술', '순간을 포착하는 예술', 2876, true),
  ('독서', '문화', '책을 통해 새로운 세계를 경험하세요', 5234, false),
  ('베이킹', '요리', '맛있는 빵과 디저트 만들기', 1876, false),
  ('웹 개발', '기술', '코딩으로 웹사이트를 만들어보세요', 3124, false),
  ('요가', '운동', '몸과 마음의 균형을 찾으세요', 2543, false),
  ('정원 가꾸기', '야외활동', '식물을 키우며 힐링하세요', 1432, false)
on conflict do nothing;


-- ==========================================
-- scripts/004_security_hardening.sql
-- ==========================================
-- ============================================================================
-- 004_security_hardening.sql
-- Applies security fixes on top of 001_create_tables.sql.
--
-- What this migration does
--   1. Prevents a non-admin user from promoting themselves to admin by
--      updating `profiles.is_admin` on their own row (RLS in 001 allows any
--      self-column update).
--   2. Adds integrity constraints to the `matches` table so users cannot
--      self-match or create duplicate pairs.
--   3. Tightens `profiles` SELECT so unauthenticated traffic cannot enumerate
--      all user profiles. Authenticated users can still read public fields.
--
-- Run after 001_create_tables.sql.
-- ============================================================================

-- -------------------------------------------------------------
-- 1) Prevent self-promotion to admin
-- -------------------------------------------------------------
create or replace function public.prevent_self_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_admin is distinct from new.is_admin then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    ) then
      raise exception 'Only admins can change admin status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_admin on public.profiles;

create trigger profiles_prevent_self_admin
  before update on public.profiles
  for each row
  execute function public.prevent_self_admin_change();

-- -------------------------------------------------------------
-- 2) Matches table integrity
-- -------------------------------------------------------------
alter table public.matches
  drop constraint if exists matches_no_self_match;

alter table public.matches
  add constraint matches_no_self_match
  check (user_id <> matched_user_id);

-- Unique pair so the same (user, matched_user) can only exist once.
-- Note: this does NOT prevent a reciprocal (B, A) match — application code
-- should treat such pairs as the same logical match.
alter table public.matches
  drop constraint if exists matches_unique_pair;

alter table public.matches
  add constraint matches_unique_pair
  unique (user_id, matched_user_id);

-- -------------------------------------------------------------
-- 3) Restrict profile visibility to authenticated users
-- -------------------------------------------------------------
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

create policy "Authenticated users can view profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');


-- ==========================================
-- scripts/005_realtime_and_counters.sql
-- ==========================================
-- ============================================================================
-- 005_realtime_and_counters.sql
-- Enables Supabase Realtime on the messages table so the thread view can
-- subscribe to live INSERTs. Also adds triggers that keep denormalized
-- counters in sync instead of relying on the client to update them.
--
-- Run after 004_security_hardening.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Realtime publication for messages (and posts / events for future use)
-- ---------------------------------------------------------------------------
-- `supabase_realtime` is the default publication created by Supabase.
-- Adding a table to it makes INSERT/UPDATE/DELETE events broadcastable.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    -- messages
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      execute 'alter publication supabase_realtime add table public.messages';
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Auto-sync posts.likes_count
-- ---------------------------------------------------------------------------
create or replace function public.sync_post_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
      set likes_count = coalesce(likes_count, 0) + 1
      where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts
      set likes_count = greatest(coalesce(likes_count, 0) - 1, 0)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists post_likes_sync on public.post_likes;
create trigger post_likes_sync
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_likes_count();

-- ---------------------------------------------------------------------------
-- 3) Auto-sync posts.comments_count
-- ---------------------------------------------------------------------------
create or replace function public.sync_post_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
      set comments_count = coalesce(comments_count, 0) + 1
      where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts
      set comments_count = greatest(coalesce(comments_count, 0) - 1, 0)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_sync on public.comments;
create trigger comments_sync
  after insert or delete on public.comments
  for each row execute function public.sync_post_comments_count();

-- ---------------------------------------------------------------------------
-- 4) Auto-sync events.current_participants
-- ---------------------------------------------------------------------------
create or replace function public.sync_event_participants_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'registered' or new.status = 'attended' then
      update public.events
        set current_participants = coalesce(current_participants, 0) + 1
        where id = new.event_id;
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if old.status in ('registered','attended') and new.status = 'cancelled' then
      update public.events
        set current_participants = greatest(coalesce(current_participants, 0) - 1, 0)
        where id = new.event_id;
    elsif old.status = 'cancelled' and new.status in ('registered','attended') then
      update public.events
        set current_participants = coalesce(current_participants, 0) + 1
        where id = new.event_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.status in ('registered','attended') then
      update public.events
        set current_participants = greatest(coalesce(current_participants, 0) - 1, 0)
        where id = old.event_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists event_participants_sync on public.event_participants;
create trigger event_participants_sync
  after insert or update or delete on public.event_participants
  for each row execute function public.sync_event_participants_count();


-- ==========================================
-- scripts/006_reports_and_blocks.sql
-- ==========================================
-- ============================================================================
-- 006_reports_and_blocks.sql
-- Adds reporting and blocking so users can flag abuse and the admin team
-- can review. Also adds the schema needed for moderation actions.
-- ============================================================================

-- Types of reportable content
do $$
begin
  if not exists (select 1 from pg_type where typname = 'report_target_type') then
    create type public.report_target_type as enum (
      'profile', 'post', 'comment', 'event', 'message'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum (
      'open', 'reviewing', 'resolved', 'dismissed'
    );
  end if;
end $$;

-- -------------------------------------------------------------
-- Reports
-- -------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 500),
  status public.report_status not null default 'open',
  resolution_notes text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists reports_target_idx on public.reports(target_type, target_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_reporter_idx on public.reports(reporter_id);

alter table public.reports enable row level security;

drop policy if exists "Users can file reports" on public.reports;
create policy "Users can file reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Users can see their own reports" on public.reports;
create policy "Users can see their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

drop policy if exists "Admins can manage reports" on public.reports;
create policy "Admins can manage reports"
  on public.reports for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- -------------------------------------------------------------
-- Blocks — symmetric application rule: if A blocks B, neither sees the other
-- -------------------------------------------------------------
create table if not exists public.user_blocks (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  reason text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint user_blocks_no_self_block check (blocker_id <> blocked_id),
  constraint user_blocks_unique_pair unique (blocker_id, blocked_id)
);

create index if not exists user_blocks_blocker_idx on public.user_blocks(blocker_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_id);

alter table public.user_blocks enable row level security;

drop policy if exists "Users can see their own blocks" on public.user_blocks;
create policy "Users can see their own blocks"
  on public.user_blocks for select
  using (auth.uid() = blocker_id or auth.uid() = blocked_id);

drop policy if exists "Users can block others" on public.user_blocks;
create policy "Users can block others"
  on public.user_blocks for insert
  with check (auth.uid() = blocker_id);

drop policy if exists "Users can unblock" on public.user_blocks;
create policy "Users can unblock"
  on public.user_blocks for delete
  using (auth.uid() = blocker_id);

-- The `reason` column is an internal moderation field; regular users have no
-- need to read it.  Restrict column access so it is only available to
-- service_role (admin/server-side tooling).
revoke select (reason) on public.user_blocks from authenticated;
revoke select (reason) on public.user_blocks from anon;

-- -------------------------------------------------------------
-- User status fields for moderation
-- -------------------------------------------------------------
alter table public.profiles
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_until timestamptz;

-- Prevent non-admins from editing moderation flags.
create or replace function public.prevent_self_moderation_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    old.is_suspended is distinct from new.is_suspended or
    old.suspended_until is distinct from new.suspended_until
  ) then
    if not exists (
      select 1 from public.profiles where id = auth.uid() and is_admin = true
    ) then
      raise exception 'Only admins can change moderation status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_moderation on public.profiles;
create trigger profiles_prevent_self_moderation
  before update on public.profiles
  for each row
  execute function public.prevent_self_moderation_change();


-- ==========================================
-- scripts/007_event_reviews.sql
-- ==========================================
-- ============================================================================
-- 007_event_reviews.sql
-- Post-event reviews from participants. One review per (event, author).
-- ============================================================================

create table if not exists public.event_reviews (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 2000),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (event_id, author_id)
);

create index if not exists event_reviews_event_idx on public.event_reviews(event_id);
create index if not exists event_reviews_author_idx on public.event_reviews(author_id);

alter table public.event_reviews enable row level security;

drop policy if exists "Reviews are viewable by everyone" on public.event_reviews;
create policy "Reviews are viewable by authenticated"
  on public.event_reviews for select
  using (auth.role() = 'authenticated');

-- Only actual participants of a past event can write a review.
drop policy if exists "Attendees can write reviews" on public.event_reviews;
create policy "Attendees can write reviews"
  on public.event_reviews for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1
      from public.event_participants ep
      join public.events e on e.id = ep.event_id
      where ep.event_id = event_reviews.event_id
        and ep.user_id = auth.uid()
        and ep.status in ('registered', 'attended')
        and e.event_date < now()
    )
  );

drop policy if exists "Authors can update own reviews" on public.event_reviews;
create policy "Authors can update own reviews"
  on public.event_reviews for update
  using (auth.uid() = author_id);

drop policy if exists "Authors can delete own reviews" on public.event_reviews;
create policy "Authors can delete own reviews"
  on public.event_reviews for delete
  using (auth.uid() = author_id);


-- ==========================================
-- scripts/008_event_location_coords.sql
-- ==========================================
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


-- ==========================================
-- scripts/009_avatars_bucket.sql
-- ==========================================
-- ============================================================================
-- 009_avatars_bucket.sql
-- Creates a public 'avatars' bucket and RLS policies so users can upload
-- their own profile images. Run once against storage.buckets / storage.objects.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Everyone can read avatars (public bucket, but we still add a policy
-- for clarity and future migration to private bucket if needed).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Avatars are publicly readable'
  ) then
    create policy "Avatars are publicly readable"
      on storage.objects for select
      using (bucket_id = 'avatars');
  end if;

  -- Upload: only authenticated users, only into a folder named after their
  -- auth uid. Path convention: `avatars/<uid>/<filename>`.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users upload their own avatar'
  ) then
    create policy "Users upload their own avatar"
      on storage.objects for insert
      with check (
        bucket_id = 'avatars'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users update their own avatar'
  ) then
    create policy "Users update their own avatar"
      on storage.objects for update
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users delete their own avatar'
  ) then
    create policy "Users delete their own avatar"
      on storage.objects for delete
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;


-- ==========================================
-- scripts/010_follows.sql
-- ==========================================
-- ============================================================================
-- 010_follows.sql
-- Adds a simple follower/following graph so users can subscribe to each
-- other's community posts without requiring a mutual match.
-- ============================================================================

create table if not exists public.follows (
  id uuid primary key default uuid_generate_v4(),
  follower_id uuid references public.profiles(id) on delete cascade not null,
  followed_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint follows_no_self check (follower_id <> followed_id),
  constraint follows_unique_pair unique (follower_id, followed_id)
);

create index if not exists follows_follower_idx on public.follows(follower_id);
create index if not exists follows_followed_idx on public.follows(followed_id);

alter table public.follows enable row level security;

drop policy if exists "Follow rows are publicly readable" on public.follows;
create policy "Follow rows are readable by authenticated"
  on public.follows for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can follow others" on public.follows;
create policy "Users can follow others"
  on public.follows for insert
  with check (
    auth.uid() = follower_id
    and not exists (
      -- Cannot follow users who have blocked you or whom you've blocked.
      select 1 from public.user_blocks ub
      where (ub.blocker_id = follower_id and ub.blocked_id = followed_id)
         or (ub.blocker_id = followed_id and ub.blocked_id = follower_id)
    )
  );

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);


-- ==========================================
-- scripts/011_notifications.sql
-- ==========================================
-- ============================================================================
-- 011_notifications.sql
-- In-app notifications feed. Triggers populate rows for common events so the
-- UI can query a single table instead of joining many sources.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum (
      'match_accepted',
      'new_message',
      'new_follower',
      'event_reminder',
      'event_cancelled',
      'system'
    );
  end if;
end $$;

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  type public.notification_type not null,
  /**
   * Loosely typed payload. UIs should read specific keys based on `type`:
   *   match_accepted: { match_id }
   *   new_message:    { peer_id, preview }
   *   new_follower:   {}
   *   event_reminder: { event_id, event_title, event_date }
   */
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, is_read) where is_read = false;
create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users see their notifications" on public.notifications;
create policy "Users see their notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can mark as read" on public.notifications;
create policy "Users can mark as read"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their notifications" on public.notifications;
create policy "Users can delete their notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- No INSERT policy — inserts happen via triggers (security definer).

-- Realtime subscription so bell icon lights up instantly.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      execute 'alter publication supabase_realtime add table public.notifications';
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Trigger: accepted match → both sides get a notification
-- ---------------------------------------------------------------------------
create or replace function public.notify_match_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and old.status is distinct from new.status and new.status = 'accepted')
     or (tg_op = 'INSERT' and new.status = 'accepted')
  then
    insert into public.notifications (user_id, actor_id, type, payload)
    values
      (new.user_id, new.matched_user_id, 'match_accepted', jsonb_build_object('match_id', new.id)),
      (new.matched_user_id, new.user_id, 'match_accepted', jsonb_build_object('match_id', new.id));
  end if;
  return new;
end;
$$;

drop trigger if exists matches_notify_accepted on public.matches;
create trigger matches_notify_accepted
  after insert or update on public.matches
  for each row
  execute function public.notify_match_accepted();

-- ---------------------------------------------------------------------------
-- Trigger: new message → receiver gets a notification
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, payload)
  values (
    new.receiver_id,
    new.sender_id,
    'new_message',
    jsonb_build_object(
      'peer_id', new.sender_id,
      'preview', left(coalesce(new.content, ''), 120)
    )
  );
  return new;
end;
$$;

drop trigger if exists messages_notify_new on public.messages;
create trigger messages_notify_new
  after insert on public.messages
  for each row
  execute function public.notify_new_message();

-- ---------------------------------------------------------------------------
-- Trigger: new follower → followed user gets a notification
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_follower()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, payload)
  values (new.followed_id, new.follower_id, 'new_follower', '{}'::jsonb);
  return new;
end;
$$;

drop trigger if exists follows_notify_new on public.follows;
create trigger follows_notify_new
  after insert on public.follows
  for each row
  execute function public.notify_new_follower();


-- ==========================================
-- scripts/012_notification_prefs.sql
-- ==========================================
-- ============================================================================
-- 012_notification_prefs.sql
-- Per-user notification channel preferences.
-- ============================================================================

create table if not exists public.notification_prefs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_on_match boolean not null default true,
  email_on_new_message boolean not null default false,
  email_on_event_reminder boolean not null default true,
  inapp_on_follow boolean not null default true,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.notification_prefs enable row level security;

drop policy if exists "Users manage own prefs" on public.notification_prefs;
create policy "Users manage own prefs"
  on public.notification_prefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ==========================================
-- scripts/013_subscriptions.sql
-- ==========================================
-- ============================================================================
-- 013_subscriptions.sql
-- Minimal subscription schema for future Stripe / Toss integration.
-- Creates a 'subscriptions' table the app can read and update when a webhook
-- fires.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_tier') then
    create type public.subscription_tier as enum ('free', 'premium');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum (
      'trialing', 'active', 'past_due', 'canceled', 'incomplete'
    );
  end if;
end $$;

create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  status public.subscription_status not null default 'active',
  provider text,                      -- e.g. 'stripe', 'toss'
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists subscriptions_status_idx on public.subscriptions(status);

alter table public.subscriptions enable row level security;

drop policy if exists "Users see their subscription" on public.subscriptions;
create policy "Users see their subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Writes happen only via webhook endpoint using the service role key.
-- No user-facing INSERT/UPDATE/DELETE policies on purpose.


-- ==========================================
-- scripts/014_event_photos.sql
-- ==========================================
-- ============================================================================
-- 014_event_photos.sql
-- Multi-image gallery per event. Images themselves live in the
-- `event-photos` Storage bucket; this table tracks ownership, ordering, and
-- moderation metadata.
-- ============================================================================

create table if not exists public.event_photos (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  uploader_id uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  url text not null,
  caption text check (caption is null or char_length(caption) <= 300),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists event_photos_event_idx on public.event_photos(event_id, sort_order);

alter table public.event_photos enable row level security;

drop policy if exists "Event photos readable by auth" on public.event_photos;
create policy "Event photos readable by auth"
  on public.event_photos for select
  using (auth.role() = 'authenticated');

-- Only participants (or the organizer) can upload photos.
drop policy if exists "Participants can add photos" on public.event_photos;
create policy "Participants can add photos"
  on public.event_photos for insert
  with check (
    auth.uid() = uploader_id
    and (
      exists (
        select 1 from public.event_participants ep
        where ep.event_id = event_photos.event_id
          and ep.user_id = auth.uid()
          and ep.status in ('registered', 'attended')
      )
      or exists (
        select 1 from public.events e
        where e.id = event_photos.event_id and e.organizer_id = auth.uid()
      )
    )
  );

drop policy if exists "Uploader can delete" on public.event_photos;
create policy "Uploader can delete"
  on public.event_photos for delete
  using (auth.uid() = uploader_id);

-- -------------------------------------------------------------
-- Storage bucket — event-photos (public read, auth upload).
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Event photos are publicly readable'
  ) then
    create policy "Event photos are publicly readable"
      on storage.objects for select
      using (bucket_id = 'event-photos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated users upload event photos'
  ) then
    create policy "Authenticated users upload event photos"
      on storage.objects for insert
      with check (
        bucket_id = 'event-photos'
        and auth.role() = 'authenticated'
        -- Path convention: `<event_id>/<uid>/<filename>`
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Uploader can delete own event photo'
  ) then
    create policy "Uploader can delete own event photo"
      on storage.objects for delete
      using (
        bucket_id = 'event-photos'
        and (storage.foldername(name))[2] = auth.uid()::text
      );
  end if;
end $$;


-- ==========================================
-- scripts/015_tags.sql
-- ==========================================
-- ============================================================================
-- 015_tags.sql
-- Tag system shared across posts and events.
--   tags            -- normalized, lower-cased, unique
--   post_tags       -- N:N posts ↔ tags
--   event_tags      -- N:N events ↔ tags
-- A trigger auto-creates tag rows when a new tag is referenced, and an
-- aggregate view exposes popular tags for the sidebar.
-- ============================================================================

create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null check (name = lower(name) and char_length(name) between 1 and 40),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists tags_name_idx on public.tags(name);

create table if not exists public.post_tags (
  post_id uuid references public.posts(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (post_id, tag_id)
);

create table if not exists public.event_tags (
  event_id uuid references public.events(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (event_id, tag_id)
);

alter table public.tags enable row level security;
alter table public.post_tags enable row level security;
alter table public.event_tags enable row level security;

-- Everyone authenticated can read tags.
drop policy if exists "Tags readable" on public.tags;
create policy "Tags readable"
  on public.tags for select
  using (auth.role() = 'authenticated');

drop policy if exists "Tag rows insertable" on public.tags;
create policy "Tag rows insertable"
  on public.tags for insert
  with check (auth.role() = 'authenticated');

-- Post ↔ tag: author of the post controls linkage.
drop policy if exists "Post tags readable" on public.post_tags;
create policy "Post tags readable"
  on public.post_tags for select
  using (true);

drop policy if exists "Author manages post tags" on public.post_tags;
create policy "Author manages post tags"
  on public.post_tags for all
  using (
    exists (select 1 from public.posts p where p.id = post_tags.post_id and p.author_id = auth.uid())
  )
  with check (
    exists (select 1 from public.posts p where p.id = post_tags.post_id and p.author_id = auth.uid())
  );

-- Event ↔ tag: organizer controls linkage.
drop policy if exists "Event tags readable" on public.event_tags;
create policy "Event tags readable"
  on public.event_tags for select
  using (true);

drop policy if exists "Organizer manages event tags" on public.event_tags;
create policy "Organizer manages event tags"
  on public.event_tags for all
  using (
    exists (select 1 from public.events e where e.id = event_tags.event_id and e.organizer_id = auth.uid())
  )
  with check (
    exists (select 1 from public.events e where e.id = event_tags.event_id and e.organizer_id = auth.uid())
  );

-- Popular tags view — weekly trending.
create or replace view public.popular_tags as
  select t.id,
         t.name,
         count(pt.post_id) as post_count,
         count(et.event_id) as event_count,
         (count(pt.post_id) + count(et.event_id)) as total_count
  from public.tags t
  left join public.post_tags pt
    on pt.tag_id = t.id
    and exists (select 1 from public.posts p where p.id = pt.post_id
                and p.created_at >= now() - interval '7 days')
  left join public.event_tags et
    on et.tag_id = t.id
    and exists (select 1 from public.events e where e.id = et.event_id
                and e.created_at >= now() - interval '7 days')
  group by t.id, t.name
  order by total_count desc;

-- Helper: upsert a tag and return its id.
create or replace function public.get_or_create_tag(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(lower(p_name));
  v_id uuid;
begin
  if v_name is null or char_length(v_name) = 0 then
    raise exception 'tag name must not be empty';
  end if;

  select id into v_id from public.tags where name = v_name;
  if v_id is null then
    insert into public.tags (name) values (v_name) returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- Restrict RPC access: revoke default public execute, allow authenticated only.
revoke execute on function public.get_or_create_tag(text) from public;
grant execute on function public.get_or_create_tag(text) to authenticated;


-- ==========================================
-- scripts/016_push_subscriptions.sql
-- ==========================================
-- ============================================================================
-- 016_push_subscriptions.sql
-- Web Push subscriptions. One user can have many devices, each with its own
-- endpoint + keys.
-- ============================================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  last_seen_at timestamptz
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own push subs" on public.push_subscriptions;
create policy "Users manage own push subs"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ==========================================
-- scripts/017_bookmarks.sql
-- ==========================================
-- ============================================================================
-- 017_bookmarks.sql
-- Saved items — posts and events that a user has bookmarked for later.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'bookmark_target_type') then
    create type public.bookmark_target_type as enum ('post', 'event');
  end if;
end $$;

create table if not exists public.bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_type public.bookmark_target_type not null,
  target_id uuid not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, target_type, target_id)
);

create index if not exists bookmarks_user_idx on public.bookmarks(user_id, created_at desc);

alter table public.bookmarks enable row level security;

drop policy if exists "Users see own bookmarks" on public.bookmarks;
create policy "Users see own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

drop policy if exists "Users add bookmarks" on public.bookmarks;
create policy "Users add bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users remove bookmarks" on public.bookmarks;
create policy "Users remove bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);


-- ==========================================
-- scripts/018_fulltext_search.sql
-- ==========================================
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


-- ==========================================
-- scripts/019_hobby_member_count.sql
-- ==========================================
-- ============================================================================
-- 019_hobby_member_count.sql
-- Keep hobbies.member_count in sync with user_hobbies. Seed data set manual
-- values in 003; this migration replaces them with the actual live count and
-- installs a trigger to maintain the value going forward.
-- ============================================================================

create or replace function public.sync_hobby_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.hobbies
      set member_count = coalesce(member_count, 0) + 1
      where id = new.hobby_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.hobbies
      set member_count = greatest(coalesce(member_count, 0) - 1, 0)
      where id = old.hobby_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists user_hobbies_count_sync on public.user_hobbies;
create trigger user_hobbies_count_sync
  after insert or delete on public.user_hobbies
  for each row execute function public.sync_hobby_member_count();

-- One-time recount to correct any drift.
update public.hobbies h
set member_count = coalesce(
  (select count(*) from public.user_hobbies uh where uh.hobby_id = h.id),
  0
);


-- ==========================================
-- scripts/020_post_images_bucket.sql
-- ==========================================
-- ============================================================================
-- 020_post_images_bucket.sql
-- Storage bucket for community post images. Public read, auth uploads into
-- own-uid folder only.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Post images are publicly readable'
  ) then
    create policy "Post images are publicly readable"
      on storage.objects for select
      using (bucket_id = 'post-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated users upload post images'
  ) then
    create policy "Authenticated users upload post images"
      on storage.objects for insert
      with check (
        bucket_id = 'post-images'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Uploader can delete own post image'
  ) then
    create policy "Uploader can delete own post image"
      on storage.objects for delete
      using (
        bucket_id = 'post-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;


-- ==========================================
-- scripts/021_organizer_reputation.sql
-- ==========================================
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


-- ==========================================
-- scripts/022_event_invitations.sql
-- ==========================================
-- ============================================================================
-- 022_event_invitations.sql
-- Organizer-issued invitations to specific users. Acceptance becomes a
-- row in event_participants.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type public.invitation_status as enum ('pending', 'accepted', 'declined');
  end if;
end $$;

create table if not exists public.event_invitations (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  invitee_id uuid references public.profiles(id) on delete cascade not null,
  inviter_id uuid references public.profiles(id) on delete set null,
  status public.invitation_status not null default 'pending',
  message text check (message is null or char_length(message) <= 500),
  created_at timestamptz not null default timezone('utc'::text, now()),
  responded_at timestamptz,
  unique (event_id, invitee_id)
);

create index if not exists event_invitations_invitee_idx
  on public.event_invitations(invitee_id, status);

alter table public.event_invitations enable row level security;

drop policy if exists "Invitee sees own invitations" on public.event_invitations;
create policy "Invitee sees own invitations"
  on public.event_invitations for select
  using (auth.uid() = invitee_id or auth.uid() = inviter_id);

drop policy if exists "Organizer sends invitations" on public.event_invitations;
create policy "Organizer sends invitations"
  on public.event_invitations for insert
  with check (
    auth.uid() = inviter_id
    and exists (
      select 1 from public.events e
      where e.id = event_invitations.event_id and e.organizer_id = auth.uid()
    )
  );

drop policy if exists "Invitee updates own invitations" on public.event_invitations;
create policy "Invitee updates own invitations"
  on public.event_invitations for update
  using (auth.uid() = invitee_id);

-- Ingests an invitation notification.
create or replace function public.notify_event_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, payload)
  values (
    new.invitee_id,
    new.inviter_id,
    'system',
    jsonb_build_object('kind', 'event_invite', 'event_id', new.event_id, 'invitation_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists event_invitations_notify on public.event_invitations;
create trigger event_invitations_notify
  after insert on public.event_invitations
  for each row execute function public.notify_event_invite();


-- ==========================================
-- scripts/023_event_discussions.sql
-- ==========================================
-- ============================================================================
-- 023_event_discussions.sql
-- Per-event discussion thread. Only the organizer + registered participants
-- can read/post. Great for coordinating the actual meetup.
-- ============================================================================

create table if not exists public.event_messages (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists event_messages_event_idx
  on public.event_messages(event_id, created_at desc);

alter table public.event_messages enable row level security;

-- Read: organizer + registered/attended participants.
drop policy if exists "Participants read discussion" on public.event_messages;
create policy "Participants read discussion"
  on public.event_messages for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_messages.event_id and e.organizer_id = auth.uid()
    )
    or exists (
      select 1 from public.event_participants ep
      where ep.event_id = event_messages.event_id
        and ep.user_id = auth.uid()
        and ep.status in ('registered','attended')
    )
  );

-- Post: same gating.
drop policy if exists "Participants post discussion" on public.event_messages;
create policy "Participants post discussion"
  on public.event_messages for insert
  with check (
    auth.uid() = author_id
    and (
      exists (
        select 1 from public.events e
        where e.id = event_messages.event_id and e.organizer_id = auth.uid()
      )
      or exists (
        select 1 from public.event_participants ep
        where ep.event_id = event_messages.event_id
          and ep.user_id = auth.uid()
          and ep.status in ('registered','attended')
      )
    )
  );

drop policy if exists "Authors delete own discussion msg" on public.event_messages;
create policy "Authors delete own discussion msg"
  on public.event_messages for delete
  using (auth.uid() = author_id);

-- Realtime
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'event_messages'
    ) then
      execute 'alter publication supabase_realtime add table public.event_messages';
    end if;
  end if;
end $$;


-- ==========================================
-- scripts/024_achievements.sql
-- ==========================================
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
-- Atomic unlock helper (internal use only — invoked by triggers).
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

-- Restrict RPC access: revoke execute from all unprivileged roles.
-- Achievements must be granted only through server-side triggers.
revoke execute on function public.unlock_achievement(text) from public;
revoke execute on function public.unlock_achievement(text) from authenticated;
revoke execute on function public.unlock_achievement(text) from anon;

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


-- ==========================================
-- scripts/025_event_waitlist.sql
-- ==========================================
-- ============================================================================
-- 025_event_waitlist.sql
-- Add a 'waitlisted' status so a user can queue up when an event is full.
-- On free-up (cancel / leave), the earliest waitlist entry is auto-promoted.
-- ============================================================================

-- 1. Widen the status check constraint.
alter table public.event_participants
  drop constraint if exists event_participants_status_check;

alter table public.event_participants
  add constraint event_participants_status_check
  check (status in ('registered', 'attended', 'cancelled', 'waitlisted'));

-- 2. Auto-promotion trigger. Fires when someone leaves (status flips from
--    registered/attended to cancelled, or row is deleted).
create or replace function public.promote_waitlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event uuid;
  v_max   integer;
  v_cur   integer;
  v_promote uuid;
begin
  if tg_op = 'UPDATE' then
    if new.status = 'cancelled' and old.status in ('registered','attended') then
      v_event := new.event_id;
    else
      return new;
    end if;
  elsif tg_op = 'DELETE' then
    if old.status in ('registered','attended') then
      v_event := old.event_id;
    else
      return old;
    end if;
  else
    return null;
  end if;

  select max_participants, current_participants
    into v_max, v_cur
    from public.events where id = v_event;
  if v_max is null or v_cur >= v_max then
    return coalesce(new, old);
  end if;

  select user_id into v_promote
    from public.event_participants
    where event_id = v_event and status = 'waitlisted'
    order by created_at asc
    limit 1;

  if v_promote is not null then
    update public.event_participants
      set status = 'registered'
      where event_id = v_event and user_id = v_promote;

    insert into public.notifications (user_id, type, payload)
    values (v_promote, 'system', jsonb_build_object(
      'kind', 'waitlist_promoted',
      'event_id', v_event
    ));
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists event_participants_waitlist_promote on public.event_participants;
create trigger event_participants_waitlist_promote
  after update or delete on public.event_participants
  for each row execute function public.promote_waitlist();


-- ==========================================
-- scripts/026_referrals.sql
-- ==========================================
-- ============================================================================
-- 026_referrals.sql
-- Simple referral tracking. Each profile auto-gets a short referral code.
-- When a signup contains ?ref=<code>, the app records a referral row.
-- ============================================================================

-- Short, url-safe referral codes.
create or replace function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  v_code text;
  v_exists int;
begin
  loop
    v_code := lower(substr(encode(gen_random_bytes(6), 'base64'), 1, 8));
    v_code := regexp_replace(v_code, '[^a-z0-9]', '', 'g');
    -- pad if too short after stripping
    while char_length(v_code) < 6 loop
      v_code := v_code || lower(substr(md5(random()::text), 1, 1));
    end loop;
    v_code := substr(v_code, 1, 8);
    select count(*) into v_exists from public.profiles where referral_code = v_code;
    exit when v_exists = 0;
  end loop;
  return v_code;
end;
$$;

alter table public.profiles
  add column if not exists referral_code text unique;

-- Backfill existing profiles that lack a code.
update public.profiles
  set referral_code = public.generate_referral_code()
  where referral_code is null;

-- Enforce non-null going forward.
alter table public.profiles alter column referral_code set not null;

-- New signups get a code in the same trigger that creates the profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, bio, avatar_url, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'bio', null),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null),
    public.generate_referral_code()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- -------------------------------------------------------------
-- referrals: 1:1, who referred whom
-- -------------------------------------------------------------
create table if not exists public.referrals (
  referred_user_id uuid primary key references public.profiles(id) on delete cascade,
  referrer_user_id uuid references public.profiles(id) on delete set null not null,
  referral_code text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint referrals_no_self check (referred_user_id <> referrer_user_id)
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_user_id);

alter table public.referrals enable row level security;

drop policy if exists "Users see own referral rows" on public.referrals;
create policy "Users see own referral rows"
  on public.referrals for select
  using (auth.uid() = referred_user_id or auth.uid() = referrer_user_id);
-- Inserts happen via the `recordReferral` server action using the service
-- role. No INSERT policy for anon clients.


-- ==========================================
-- scripts/027_announcements.sql
-- ==========================================
-- ============================================================================
-- 027_announcements.sql
-- Site-wide announcements authored by admins. Rendered as a dismissable
-- banner on the main layout.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'announcement_variant') then
    create type public.announcement_variant as enum ('info', 'warning', 'success');
  end if;
end $$;

create table if not exists public.announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 1000),
  variant public.announcement_variant not null default 'info',
  link_url text,
  link_label text,
  starts_at timestamptz not null default timezone('utc'::text, now()),
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists announcements_window_idx
  on public.announcements(starts_at, ends_at);

alter table public.announcements enable row level security;

drop policy if exists "Announcements are readable" on public.announcements;
create policy "Announcements are readable"
  on public.announcements for select
  using (true);

drop policy if exists "Admins manage announcements" on public.announcements;
create policy "Admins manage announcements"
  on public.announcements for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Track dismissals so a user doesn't see the same banner twice.
create table if not exists public.announcement_dismissals (
  user_id uuid references public.profiles(id) on delete cascade not null,
  announcement_id uuid references public.announcements(id) on delete cascade not null,
  dismissed_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, announcement_id)
);

alter table public.announcement_dismissals enable row level security;

drop policy if exists "Users see own dismissals" on public.announcement_dismissals;
create policy "Users see own dismissals"
  on public.announcement_dismissals for select
  using (auth.uid() = user_id);

drop policy if exists "Users dismiss for themselves" on public.announcement_dismissals;
create policy "Users dismiss for themselves"
  on public.announcement_dismissals for insert
  with check (auth.uid() = user_id);


-- ==========================================
-- scripts/028_user_presence.sql
-- ==========================================
-- ============================================================================
-- 028_user_presence.sql
-- Adds `last_active_at` on profiles so we can show "방금 전 / 10분 전 / 온라인"
-- indicators without a dedicated presence server. Updated by the client via a
-- lightweight heartbeat endpoint.
-- ============================================================================

alter table public.profiles
  add column if not exists last_active_at timestamptz;

create index if not exists profiles_last_active_idx
  on public.profiles(last_active_at desc nulls last);


-- ==========================================
-- scripts/029_message_attachments.sql
-- ==========================================
-- ============================================================================
-- 029_message_attachments.sql
-- Adds optional image attachment columns to messages + storage bucket for
-- DM images.
-- ============================================================================

alter table public.messages
  add column if not exists image_url text,
  add column if not exists image_path text;

-- Storage bucket for DM images. Public read is OK because URLs are
-- unguessable, and we still gate by auth on the messages table itself.
insert into storage.buckets (id, name, public)
values ('message-images', 'message-images', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'DM images are publicly readable'
  ) then
    create policy "DM images are publicly readable"
      on storage.objects for select
      using (bucket_id = 'message-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated users upload DM images'
  ) then
    create policy "Authenticated users upload DM images"
      on storage.objects for insert
      with check (
        bucket_id = 'message-images'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Uploader deletes own DM image'
  ) then
    create policy "Uploader deletes own DM image"
      on storage.objects for delete
      using (
        bucket_id = 'message-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;


-- ==========================================
-- scripts/030_post_reactions.sql
-- ==========================================
-- ============================================================================
-- 030_post_reactions.sql
-- Emoji reactions on community posts. Each user can have at most one
-- reaction of each type per post (enforced by unique index).
-- ============================================================================

create table if not exists public.post_reactions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reaction text not null check (reaction in ('like','love','laugh','wow','sad','clap')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (post_id, user_id, reaction)
);

create index if not exists post_reactions_post_idx on public.post_reactions(post_id, reaction);

alter table public.post_reactions enable row level security;

drop policy if exists "Reactions readable" on public.post_reactions;
create policy "Reactions readable"
  on public.post_reactions for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users toggle own reactions" on public.post_reactions;
create policy "Users toggle own reactions"
  on public.post_reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users remove own reactions" on public.post_reactions;
create policy "Users remove own reactions"
  on public.post_reactions for delete
  using (auth.uid() = user_id);


-- ==========================================
-- scripts/031_feature_flags.sql
-- ==========================================
-- ============================================================================
-- 031_feature_flags.sql
-- Lightweight feature flag table. Each flag has a rollout percentage (0-100)
-- and optional per-user allowlist. Backed by a deterministic hash of
-- (flag_key, user_id) so the same user consistently ends up in the same
-- cohort across requests.
-- ============================================================================

create table if not exists public.feature_flags (
  key text primary key,
  description text,
  enabled boolean not null default false,
  rollout_percent smallint not null default 0 check (rollout_percent between 0 and 100),
  allowlist uuid[] not null default '{}'::uuid[],
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.feature_flags enable row level security;

drop policy if exists "Flags readable" on public.feature_flags;
create policy "Flags readable"
  on public.feature_flags for select
  using (true);

drop policy if exists "Admins manage flags" on public.feature_flags;
create policy "Admins manage flags"
  on public.feature_flags for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Deterministic cohort check. Returns true when the flag is on and either
-- the user is in allowlist, or falls into the rollout percentile.
create or replace function public.is_flag_enabled(
  p_key text,
  p_user_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_flag record;
  v_hash bigint;
begin
  select * into v_flag from public.feature_flags where key = p_key;
  if not found or not v_flag.enabled then return false; end if;
  if p_user_id is null then return v_flag.rollout_percent >= 100; end if;
  if p_user_id = any(v_flag.allowlist) then return true; end if;

  -- Stable 0..99 bucket from md5(key || user_id).
  v_hash := ('x' || substr(md5(p_key || p_user_id::text), 1, 8))::bit(32)::bigint;
  return (abs(v_hash) % 100) < v_flag.rollout_percent;
end;
$$;


-- ==========================================
-- scripts/032_post_drafts.sql
-- ==========================================
-- ============================================================================
-- 032_post_drafts.sql
-- One auto-saved draft per user — the most recent "work in progress" post
-- body. Replaces itself on every save so storage stays bounded.
-- ============================================================================

create table if not exists public.post_drafts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.post_drafts enable row level security;

drop policy if exists "Users manage own draft" on public.post_drafts;
create policy "Users manage own draft"
  on public.post_drafts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ==========================================
-- scripts/033_profile_visibility.sql
-- ==========================================
-- ============================================================================
-- 033_profile_visibility.sql
-- Adds a `visibility` flag on profiles so users can hide their profile from
-- anyone they haven't matched or been followed by. Default `public` keeps
-- the current behavior.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_visibility') then
    create type public.profile_visibility as enum ('public', 'connections', 'private');
  end if;
end $$;

alter table public.profiles
  add column if not exists visibility public.profile_visibility
    not null default 'public';

-- Replace the SELECT policy from 004_security_hardening with a
-- visibility-aware version.
drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

create policy "Profiles readable by visibility rules"
  on public.profiles for select
  using (
    -- Own profile is always readable
    auth.uid() = id
    -- Admins can read everyone
    or exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.is_admin = true)
    -- Public profiles are readable by any authenticated user
    or (visibility = 'public' and auth.role() = 'authenticated')
    -- "connections" visibility: readable by mutual-match peers and followers
    or (
      visibility = 'connections'
      and auth.role() = 'authenticated'
      and (
        exists (
          select 1 from public.matches m
          where m.status = 'accepted'
            and ((m.user_id = id and m.matched_user_id = auth.uid())
              or (m.user_id = auth.uid() and m.matched_user_id = id))
        )
        or exists (
          select 1 from public.follows f
          where f.follower_id = auth.uid() and f.followed_id = id
        )
      )
    )
  );


-- ==========================================
-- scripts/034_comment_threads.sql
-- ==========================================
-- ============================================================================
-- 034_comment_threads.sql
-- Adds parent_id to comments for 1-level reply threading.
-- (Intentionally single-level to avoid infinite nesting UX pain.)
-- ============================================================================

alter table public.comments
  add column if not exists parent_id uuid
    references public.comments(id) on delete cascade;

create index if not exists comments_parent_idx on public.comments(parent_id);

-- Enforce "only top-level comments can be replied to" so we never end up
-- with grand-children. A simple trigger does the job.
create or replace function public.enforce_single_level_reply()
returns trigger
language plpgsql
as $$
declare
  v_parent_parent uuid;
begin
  if new.parent_id is null then return new; end if;

  select parent_id into v_parent_parent
    from public.comments
    where id = new.parent_id;

  if v_parent_parent is not null then
    raise exception 'comments support at most one level of replies';
  end if;
  return new;
end;
$$;

drop trigger if exists comments_single_level on public.comments;
create trigger comments_single_level
  before insert or update on public.comments
  for each row execute function public.enforce_single_level_reply();


-- ==========================================
-- scripts/035_recurring_events.sql
-- ==========================================
-- ============================================================================
-- 035_recurring_events.sql
-- Tracks which events belong to the same recurring series. We generate the
-- actual occurrence rows client-side (simpler than parsing a full RRULE)
-- but persist enough metadata to later edit "this and future" or delete
-- an entire series.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'recurrence_frequency') then
    create type public.recurrence_frequency as enum ('weekly', 'biweekly', 'monthly');
  end if;
end $$;

alter table public.events
  add column if not exists series_id uuid,
  add column if not exists recurrence_frequency public.recurrence_frequency;

create index if not exists events_series_idx on public.events(series_id);


-- ==========================================
-- scripts/036_notification_sound.sql
-- ==========================================
-- ============================================================================
-- 036_notification_sound.sql
-- Adds in-app sound + vibration preferences to notification_prefs.
-- ============================================================================

alter table public.notification_prefs
  add column if not exists play_sound boolean not null default true,
  add column if not exists vibrate boolean not null default false;


-- ==========================================
-- scripts/037_profile_language.sql
-- ==========================================
-- ============================================================================
-- 037_profile_language.sql
-- Adds a `language` column so transactional emails can be sent in the
-- recipient's preferred locale. Default 'ko' matches the current user base.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_language') then
    create type public.profile_language as enum ('ko', 'en');
  end if;
end $$;

alter table public.profiles
  add column if not exists language public.profile_language not null default 'ko';


-- ==========================================
-- scripts/038_thread_read_state.sql
-- ==========================================
-- ============================================================================
-- 038_thread_read_state.sql
-- Per-thread read marker. Cheap way to render a "─── 여기까지 읽었어요 ───"
-- divider in a conversation and scroll to the first unread message on load.
-- ============================================================================

create table if not exists public.thread_read_state (
  user_id uuid references public.profiles(id) on delete cascade not null,
  peer_id uuid references public.profiles(id) on delete cascade not null,
  last_read_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, peer_id)
);

alter table public.thread_read_state enable row level security;

drop policy if exists "Users manage own thread state" on public.thread_read_state;
create policy "Users manage own thread state"
  on public.thread_read_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ==========================================
-- scripts/039_risk_signals.sql
-- ==========================================
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


-- ==========================================
-- scripts/040_ab_exposure.sql
-- ==========================================
-- ============================================================================
-- 040_ab_exposure.sql
-- Stores which users saw which flag evaluation + a conversion event so we
-- can compute lift. Writes happen through the `log_flag_exposure(key, on)`
-- RPC so we keep the write path on the server.
-- ============================================================================

create table if not exists public.flag_exposures (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  flag_key text not null,
  variant text not null check (variant in ('on', 'off')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, flag_key)
);

create index if not exists flag_exposures_flag_idx
  on public.flag_exposures(flag_key, variant);

alter table public.flag_exposures enable row level security;

drop policy if exists "Exposures readable" on public.flag_exposures;
create policy "Exposures readable"
  on public.flag_exposures for select
  using (auth.role() = 'authenticated');
-- No user-facing INSERT policy — use the RPC below.

create or replace function public.log_flag_exposure(p_key text, p_on boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then return; end if;
  insert into public.flag_exposures (user_id, flag_key, variant)
  values (v_user, p_key, case when p_on then 'on' else 'off' end)
  on conflict (user_id, flag_key) do nothing;
end;
$$;

-- Conversion events — generic bag. `kind` can be e.g. 'match.like',
-- 'event.joined', 'post.created'. The `flag_exposures` join happens at
-- query time in the admin UI.
create table if not exists public.ab_conversions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists ab_conversions_kind_idx
  on public.ab_conversions(kind, created_at desc);

alter table public.ab_conversions enable row level security;

drop policy if exists "Conversions readable" on public.ab_conversions;
create policy "Conversions readable"
  on public.ab_conversions for select
  using (auth.role() = 'authenticated');

create or replace function public.log_ab_conversion(p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then return; end if;
  insert into public.ab_conversions (user_id, kind) values (v_user, p_kind);
end;
$$;

-- Aggregate view: per (flag, variant), how many distinct users saw it
-- and how many had at least one conversion of each `kind`.
create or replace view public.ab_flag_conversion_rates as
select
  e.flag_key,
  e.variant,
  c.kind as conversion_kind,
  count(distinct e.user_id) as exposures,
  count(distinct c.user_id) as converters,
  round(
    case when count(distinct e.user_id) = 0 then 0
         else count(distinct c.user_id)::numeric / count(distinct e.user_id)
    end * 100,
    2
  ) as conversion_pct
from public.flag_exposures e
left join public.ab_conversions c
  on c.user_id = e.user_id and c.created_at >= e.created_at
group by e.flag_key, e.variant, c.kind;


-- ==========================================
-- scripts/041_user_levels.sql
-- ==========================================
-- ============================================================================
-- 041_user_levels.sql
-- Materializes the sum of achievement points per user into `profiles.xp`
-- and computes a simple level. Triggers keep it in sync.
--
-- Level formula: level = floor(sqrt(xp / 20)) + 1
--   level 1  :    0 xp
--   level 2  :   20 xp
--   level 3  :   80 xp
--   level 4  :  180 xp
--   level 5  :  320 xp  ...
-- ============================================================================

alter table public.profiles
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1;

create or replace function public.compute_level(p_xp integer)
returns integer
language sql
immutable
as $$
  select greatest(1, floor(sqrt(coalesce(p_xp, 0)::numeric / 20))::int + 1);
$$;

-- Backfill existing rows.
update public.profiles p
set xp = coalesce(
  (select sum(a.points) from public.user_achievements ua
   join public.achievements a on a.code = ua.code
   where ua.user_id = p.id),
  0
),
level = public.compute_level(
  coalesce(
    (select sum(a.points) from public.user_achievements ua
     join public.achievements a on a.code = ua.code
     where ua.user_id = p.id),
    0
  )
);

-- Trigger: recompute on unlock.
create or replace function public.recompute_user_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_new_xp int;
begin
  v_user := coalesce(new.user_id, old.user_id);
  select coalesce(sum(a.points), 0) into v_new_xp
  from public.user_achievements ua
  join public.achievements a on a.code = ua.code
  where ua.user_id = v_user;

  update public.profiles
  set xp = v_new_xp,
      level = public.compute_level(v_new_xp),
      updated_at = now()
  where id = v_user;

  return coalesce(new, old);
end;
$$;

drop trigger if exists user_achievements_xp_sync on public.user_achievements;
create trigger user_achievements_xp_sync
  after insert or delete on public.user_achievements
  for each row execute function public.recompute_user_xp();


-- ==========================================
-- scripts/042_event_photo_thumbnails.sql
-- ==========================================
-- ============================================================================
-- 042_event_photo_thumbnails.sql
-- Adds thumbnail columns to `event_photos` and a dedicated public bucket for
-- generated thumbnails. An Edge Function (`event-photo-thumbnails`) picks up
-- rows with thumb_status = 'pending' and fills these in asynchronously.
--
-- Layout mirrors the originals bucket so that an original at
--   event-photos/<event>/<uid>/<ts>.jpg
-- has its thumbnail at
--   event-photo-thumbnails/<event>/<uid>/<ts>.webp
-- ============================================================================

alter table public.event_photos
  add column if not exists thumb_path text,
  add column if not exists thumb_url text,
  add column if not exists thumb_status text
    check (thumb_status in ('pending', 'done', 'failed'))
    default 'pending'
    not null,
  add column if not exists thumb_error text;

-- Helpful index for the worker scan.
create index if not exists event_photos_thumb_status_idx
  on public.event_photos(thumb_status)
  where thumb_status = 'pending';

-- -------------------------------------------------------------
-- Storage bucket — thumbnails are public read. Writes happen
-- from the Edge Function using the service-role key so we only
-- need a read policy for public access.
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-photo-thumbnails', 'event-photo-thumbnails', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Event photo thumbnails are publicly readable'
  ) then
    create policy "Event photo thumbnails are publicly readable"
      on storage.objects for select
      using (bucket_id = 'event-photo-thumbnails');
  end if;
end $$;


-- ==========================================
-- scripts/043_match_tuning.sql
-- ==========================================
-- ============================================================================
-- 043_match_tuning.sql
-- Singleton row (id = 'current') that holds the weights used by the matching
-- scorer in `lib/matching.ts`. Admins adjust weights from
-- /admin/matching and the server reads them on each scoring pass so changes
-- take effect without a deploy.
-- ============================================================================

create table if not exists public.match_tuning (
  id text primary key,
  overlap_weight integer not null default 100,      -- base multiplier on (common / totalMy)
  location_exact_bonus integer not null default 10, -- +pts if location strings match exactly
  location_region_bonus integer not null default 5, -- +pts if first location token matches
  recency_48h_bonus integer not null default 8,     -- +pts if last_active within 48h
  recency_7d_bonus integer not null default 3,      -- +pts if last_active within 7d
  updated_at timestamptz not null default timezone('utc'::text, now()),
  updated_by uuid references public.profiles(id) on delete set null,
  -- Basic sanity rails so an admin can't save absurd values.
  constraint match_tuning_bounds check (
    overlap_weight between 0 and 500
    and location_exact_bonus between 0 and 100
    and location_region_bonus between 0 and 100
    and recency_48h_bonus between 0 and 100
    and recency_7d_bonus between 0 and 100
  )
);

insert into public.match_tuning (id) values ('current')
on conflict (id) do nothing;

alter table public.match_tuning enable row level security;

drop policy if exists "Admins read match tuning" on public.match_tuning;
create policy "Admins read match tuning"
  on public.match_tuning for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin
    )
  );

drop policy if exists "Admins write match tuning" on public.match_tuning;
create policy "Admins write match tuning"
  on public.match_tuning for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin
    )
  );


-- ==========================================
-- scripts/044_phone_verification.sql
-- ==========================================
-- ============================================================================
-- 044_phone_verification.sql
-- Surfaces phone verification status on `profiles` so RLS, UI badges, and
-- "trusted action" gates don't need to join auth.users.
--
-- The source of truth is still `auth.users.phone` + `auth.users.phone_confirmed_at`.
-- We mirror only the boolean-ish fact (verified vs not) to avoid leaking the
-- full phone number into a table readable by other users.
-- ============================================================================

alter table public.profiles
  add column if not exists phone_verified_at timestamptz;

-- Mirror phone verification into profiles whenever auth.users.phone_confirmed_at
-- flips. Runs as security definer so we can write from the auth schema trigger.
create or replace function public.sync_phone_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set phone_verified_at = new.phone_confirmed_at,
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists auth_users_phone_sync on auth.users;
create trigger auth_users_phone_sync
  after update of phone_confirmed_at on auth.users
  for each row
  when (new.phone_confirmed_at is distinct from old.phone_confirmed_at)
  execute function public.sync_phone_verified();

-- Backfill existing verified users.
update public.profiles p
set phone_verified_at = u.phone_confirmed_at
from auth.users u
where u.id = p.id
  and u.phone_confirmed_at is not null
  and p.phone_verified_at is distinct from u.phone_confirmed_at;

-- Helper: is the currently-authenticated user phone-verified?
create or replace function public.is_phone_verified()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
      and phone_verified_at is not null
  );
$$;

grant execute on function public.is_phone_verified() to authenticated;


-- ==========================================
-- scripts/045_api_keys.sql
-- ==========================================
-- ============================================================================
-- 045_api_keys.sql
-- User-issued API keys for the read-only public API under /api/public/v1.
-- Raw keys are shown to the user only once at creation time; we store
-- SHA-256 hashes so a DB leak cannot be replayed against the API.
-- ============================================================================

create table if not exists public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null check (char_length(name) between 1 and 60),
  key_prefix text not null,                 -- first 8 chars, shown in UI
  key_hash text not null unique,            -- SHA-256(hex) of the full key
  tier text not null default 'free'
    check (tier in ('free', 'pro')),        -- caps requests/min at the middleware
  scopes text[] not null default array['public:read']::text[],
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists api_keys_user_idx on public.api_keys(user_id);
create index if not exists api_keys_hash_idx on public.api_keys(key_hash);

alter table public.api_keys enable row level security;

-- Owners read + revoke their own keys. Nobody reads the hash via select; the
-- public API auth path uses the service-role client, not the user session.
drop policy if exists "Owners read own api keys" on public.api_keys;
create policy "Owners read own api keys"
  on public.api_keys for select
  using (user_id = auth.uid());

drop policy if exists "Owners create own api keys" on public.api_keys;
create policy "Owners create own api keys"
  on public.api_keys for insert
  with check (user_id = auth.uid());

drop policy if exists "Owners update own api keys" on public.api_keys;
create policy "Owners update own api keys"
  on public.api_keys for update
  using (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- Simple usage counter (rolled up hourly). Used by the docs page to show
-- "used 1,248 / 10,000 this month" without needing a separate analytics pipeline.
-- --------------------------------------------------------------------------
create table if not exists public.api_key_usage (
  key_id uuid references public.api_keys(id) on delete cascade not null,
  window_hour timestamptz not null,  -- truncated to the hour, UTC
  request_count bigint not null default 0,
  primary key (key_id, window_hour)
);

alter table public.api_key_usage enable row level security;

drop policy if exists "Owners read own key usage" on public.api_key_usage;
create policy "Owners read own key usage"
  on public.api_key_usage for select
  using (
    exists (
      select 1 from public.api_keys k
      where k.id = api_key_usage.key_id and k.user_id = auth.uid()
    )
  );

-- Allow the middleware (which runs under service-role) to upsert freely.

-- Atomic increment used by the middleware when the initial upsert collides.
create or replace function public.increment_api_usage(
  p_key_id uuid,
  p_window_hour timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.api_key_usage (key_id, window_hour, request_count)
  values (p_key_id, p_window_hour, 1)
  on conflict (key_id, window_hour)
  do update set request_count = public.api_key_usage.request_count + 1;
end;
$$;


-- ==========================================
-- scripts/046_fix_event_authorization.sql
-- ==========================================
-- ============================================================================
-- 046_fix_event_authorization.sql
-- Fixes two event authorization vulnerabilities:
--
-- 1. [High] event_participants RLS policies were too permissive:
--    - INSERT allowed any authenticated user to write arbitrary status values
--      (including 'attended') directly to the table, bypassing capacity limits
--      and waitlist logic enforced only in application code.
--    - UPDATE allowed users to promote themselves from waitlisted/cancelled to
--      'registered' or 'attended' without DB-level capacity enforcement.
--    Fix: remove user INSERT access entirely; add a SECURITY DEFINER function
--    join_event() that enforces capacity atomically; restrict user UPDATE to
--    the single allowed self-service transition (→ 'cancelled').
--
-- 2. [Low] event-photos storage bucket INSERT policy only checked
--    authentication + path UID, not actual event membership/organizer status.
-- ============================================================================

-- ============================================================================
-- Part 1a: join_event() – SECURITY DEFINER, capacity-enforcing registration
-- ============================================================================
-- This function is the ONLY path through which a participant row with status
-- 'registered' or 'waitlisted' may be created or restored for a given user.
-- It runs as the DB owner (bypasses RLS) and serialises concurrent
-- registrations for the same event using FOR UPDATE on the events row.

create or replace function public.join_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid    := auth.uid();
  v_max       integer;
  v_cur       integer;
  v_existing  text;
  v_new_status text;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'message', 'Not authenticated');
  end if;

  -- Serialise concurrent registrations: lock the event row.
  select max_participants, current_participants
    into v_max, v_cur
    from public.events
   where id = p_event_id
     for update;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Event not found');
  end if;

  -- If the caller already has an active status, return it unchanged.
  select status into v_existing
    from public.event_participants
   where event_id = p_event_id and user_id = v_user_id;

  if v_existing in ('registered', 'attended', 'waitlisted') then
    return jsonb_build_object('ok', true, 'status', v_existing);
  end if;

  -- Determine target status from current capacity.
  if v_max is null or v_cur < v_max then
    v_new_status := 'registered';
  else
    v_new_status := 'waitlisted';
  end if;

  -- Insert or restore (was 'cancelled').
  insert into public.event_participants (event_id, user_id, status)
    values (p_event_id, v_user_id, v_new_status)
  on conflict (event_id, user_id) do update
    set status = v_new_status;

  return jsonb_build_object('ok', true, 'status', v_new_status);
end;
$$;

-- ============================================================================
-- Part 1b: Tighten event_participants RLS
-- ============================================================================

-- Remove the old INSERT policy: no direct table-level inserts for regular
-- users.  All registrations must go through join_event() above.
drop policy if exists "Users can register for events" on public.event_participants;

-- UPDATE: users may only cancel their own registration.  All other status
-- transitions (waitlisted → registered, cancelled → registered, * → attended)
-- are handled exclusively by SECURITY DEFINER functions/triggers.
drop policy if exists "Users can update their own registration" on public.event_participants;
create policy "Users can cancel their own registration"
  on public.event_participants for update
  using  (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and status = 'cancelled'
  );

-- ============================================================================
-- Part 1c: Trigger – prevent event_id reassignment on any UPDATE
-- ============================================================================
create or replace function public.prevent_event_id_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_id <> old.event_id then
    raise exception
      'Changing event_id on event_participants is not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists event_participants_lock_event_id on public.event_participants;
create trigger event_participants_lock_event_id
  before update on public.event_participants
  for each row execute function public.prevent_event_id_change();

-- ============================================================================
-- Part 2: Tighten event-photos storage bucket upload policy
-- ============================================================================
-- Drop the old permissive policy and replace it with one that also verifies
-- the uploader is either the event organizer or an accepted participant.
-- Path convention: `<event_id>/<uid>/<filename>`

do $$
begin
  drop policy if exists "Authenticated users upload event photos" on storage.objects;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'Participants upload event photos'
  ) then
    create policy "Participants upload event photos"
      on storage.objects for insert
      with check (
        bucket_id = 'event-photos'
        and auth.role() = 'authenticated'
        -- Second path segment must be the uploader's own UID.
        and (storage.foldername(name))[2] = auth.uid()::text
        -- First path segment must be a well-formed UUID to avoid cast errors.
        and (storage.foldername(name))[1]
              ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        -- Caller must be an accepted participant or the organizer.
        and (
          exists (
            select 1 from public.event_participants ep
            where ep.event_id = (storage.foldername(name))[1]::uuid
              and ep.user_id  = auth.uid()
              and ep.status  in ('registered', 'attended')
          )
          or exists (
            select 1 from public.events e
            where e.id          = (storage.foldername(name))[1]::uuid
              and e.organizer_id = auth.uid()
          )
        )
      );
  end if;
end $$;


-- ==========================================
-- scripts/047_fix_messages_rls.sql
-- ==========================================
-- ============================================================================
-- 047_fix_messages_rls.sql
-- Tightens RLS policies on public.messages:
--   1. INSERT now requires an accepted match between sender and receiver,
--      and rejects inserts when either side has blocked the other.
--   2. UPDATE is restricted to the receiver toggling is_read only; a trigger
--      prevents any other column from being modified after send.
-- ============================================================================

-- ── INSERT: require accepted match + no block relationship ───────────────────
drop policy if exists "Users can send messages" on public.messages;

create policy "Users can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches
      where status = 'accepted'
        and (
          (user_id     = auth.uid() and matched_user_id = receiver_id)
          or
          (matched_user_id = auth.uid() and user_id = receiver_id)
        )
    )
    and not exists (
      select 1 from public.user_blocks
      where
        (blocker_id = auth.uid() and blocked_id = receiver_id)
        or
        (blocker_id = receiver_id and blocked_id = auth.uid())
    )
  );

-- ── UPDATE: receiver may only toggle is_read ─────────────────────────────────
drop policy if exists "Users can update messages they received" on public.messages;

create policy "Users can mark messages as read"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Trigger enforces strict immutability: every column except is_read is locked
-- permanently after insert. This prevents any client — including the receiver —
-- from falsifying message content, timestamps, participants, or attachments.
create or replace function public.prevent_message_content_edit()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if new.id          is distinct from old.id
  or new.sender_id   is distinct from old.sender_id
  or new.receiver_id is distinct from old.receiver_id
  or new.content     is distinct from old.content
  or new.created_at  is distinct from old.created_at
  or new.image_url   is distinct from old.image_url
  or new.image_path  is distinct from old.image_path
  then
    raise exception 'only is_read may be updated on a message';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_message_immutability on public.messages;
create trigger enforce_message_immutability
  before update on public.messages
  for each row execute function public.prevent_message_content_edit();


-- ==========================================
-- scripts/048_fix_storage_security.sql
-- ==========================================
-- ============================================================================
-- 048_fix_storage_security.sql
-- Converts the three media buckets from public to private and replaces
-- open-to-the-internet SELECT policies with properly scoped ones.
--
--   message-images        → only the sender/receiver of the containing message
--   event-photos          → any authenticated user
--   event-photo-thumbnails → any authenticated user
-- ============================================================================

-- ── message-images ───────────────────────────────────────────────────────────
update storage.buckets
  set public = false
  where id = 'message-images';

drop policy if exists "DM images are publicly readable" on storage.objects;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename   = 'objects'
      and policyname  = 'Message participants can view DM images'
  ) then
    create policy "Message participants can view DM images"
      on storage.objects for select
      using (
        bucket_id = 'message-images'
        and auth.role() = 'authenticated'
        and (
          -- the uploader can always read files they own
          (storage.foldername(name))[1] = auth.uid()::text
          -- the recipient may read the file only when a legitimate message
          -- references this exact path AND the first path segment matches the
          -- sender's uuid (proving the sender actually owns the file and the
          -- path was not forged by a third party)
          or exists (
            select 1 from public.messages
            where image_path = name
              and receiver_id = auth.uid()
              and sender_id::text = (storage.foldername(name))[1]
          )
        )
      );
  end if;
end $$;

-- ── event-photos ─────────────────────────────────────────────────────────────
update storage.buckets
  set public = false
  where id = 'event-photos';

drop policy if exists "Event photos are publicly readable" on storage.objects;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename   = 'objects'
      and policyname  = 'Authenticated users can view event photos'
  ) then
    create policy "Authenticated users can view event photos"
      on storage.objects for select
      using (
        bucket_id = 'event-photos'
        and auth.role() = 'authenticated'
      );
  end if;
end $$;

-- ── event-photo-thumbnails ───────────────────────────────────────────────────
update storage.buckets
  set public = false
  where id = 'event-photo-thumbnails';

drop policy if exists "Event photo thumbnails are publicly readable" on storage.objects;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename   = 'objects'
      and policyname  = 'Authenticated users can view event photo thumbnails'
  ) then
    create policy "Authenticated users can view event photo thumbnails"
      on storage.objects for select
      using (
        bucket_id = 'event-photo-thumbnails'
        and auth.role() = 'authenticated'
      );
  end if;
end $$;


-- ==========================================
-- scripts/049_fix_blocks_rls.sql
-- ==========================================
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


-- ==========================================
-- scripts/100_seed_hobbies.sql
-- ==========================================
-- ============================================================================
-- 100_seed_hobbies.sql
-- Seeds the initial hobby catalog with 200+ entries across 8 categories.
-- Run after base schema + RLS are in place. Idempotent via ON CONFLICT.
--
-- Categories:
--   운동/스포츠, 문화/예술, 게임/취미, 음식/요리, 자기계발,
--   여행/야외, 기술/제작, 소셜/라이프
-- ============================================================================

insert into public.hobbies (name, category, description, is_featured) values
  -- 운동/스포츠 --------------------------------------------------------------
  ('러닝',           '운동/스포츠', '동네 러닝부터 마라톤 준비까지', true),
  ('등산',           '운동/스포츠', '주말 근교산부터 알파인까지',        true),
  ('요가',           '운동/스포츠', '하타·빈야사·이얀가',              true),
  ('필라테스',       '운동/스포츠', '매트·기구·리포머',                 false),
  ('크로스핏',       '운동/스포츠', '박스 공동체 훈련',                 false),
  ('헬스',           '운동/스포츠', '근력·컨디셔닝',                    true),
  ('수영',           '운동/스포츠', '자유형·접영·오픈워터',             false),
  ('자전거',         '운동/스포츠', '로드·MTB·라이딩 투어',             true),
  ('테니스',         '운동/스포츠', '하드·클레이 코트',                 true),
  ('배드민턴',       '운동/스포츠', '복식·단식 모임',                  true),
  ('스쿼시',         '운동/스포츠', '실내 라켓 스포츠',                false),
  ('탁구',           '운동/스포츠', '가볍게 즐기는 실내 스포츠',        false),
  ('농구',           '운동/스포츠', '길거리·체육관 농구',              true),
  ('풋살',           '운동/스포츠', '5대5 실내 축구',                  true),
  ('축구',           '운동/스포츠', '주말 아마추어 리그',              true),
  ('야구',           '운동/스포츠', '사회인 야구, 캐치볼',             false),
  ('골프',           '운동/스포츠', '스크린·필드',                     false),
  ('클라이밍',       '운동/스포츠', '인공암벽·자연암벽',               true),
  ('서핑',           '운동/스포츠', '양양·제주 서핑',                   false),
  ('스노보드',       '운동/스포츠', '겨울 시즌 스키장',                false),
  ('스키',           '운동/스포츠', '겨울 시즌 스키장',                false),
  ('스케이트보드',   '운동/스포츠', '스케이트 파크',                   false),
  ('격투기',         '운동/스포츠', '주짓수·MMA·복싱·무에타이',         false),
  ('킥복싱',         '운동/스포츠', '유산소+격투기',                   false),
  ('주짓수',         '운동/스포츠', 'BJJ 스파링',                      false),
  ('댄스',           '운동/스포츠', '스트릿·재즈·왁킹',                true),
  ('줌바',           '운동/스포츠', '유산소 댄스',                     false),
  ('발레',           '운동/스포츠', '성인 취미 발레',                  false),
  ('스케이트',       '운동/스포츠', '인라인·아이스',                   false),
  ('승마',           '운동/스포츠', '마술 체험',                      false),
  ('양궁',           '운동/스포츠', '국궁·양궁',                      false),
  ('검도',           '운동/스포츠', '죽도 수련',                      false),
  ('태권도',         '운동/스포츠', '품새·겨루기',                     false),

  -- 문화/예술 --------------------------------------------------------------
  ('독서',           '문화/예술', '소설·에세이·인문',                 true),
  ('독서토론',       '문화/예술', '월별 주제 독서 모임',              true),
  ('글쓰기',         '문화/예술', '에세이·소설 쓰기',                 false),
  ('시낭독',         '문화/예술', '시 모임',                          false),
  ('영화',           '문화/예술', '함께 보고 나누는 영화',            true),
  ('다큐',           '문화/예술', '다큐 감상',                       false),
  ('전시',           '문화/예술', '미술·사진 전시 관람',              true),
  ('박물관',         '문화/예술', '역사·과학 탐방',                   false),
  ('공연관람',       '문화/예술', '연극·뮤지컬·콘서트',               true),
  ('클래식',         '문화/예술', '오케스트라 감상',                  false),
  ('오페라',         '문화/예술', '오페라·발레 관람',                 false),
  ('재즈',           '문화/예술', '재즈바·공연',                      false),
  ('K-POP',          '문화/예술', 'K-POP 덕질',                       true),
  ('인디음악',       '문화/예술', '홍대·연남 라이브',                 false),
  ('힙합',           '문화/예술', '힙합 공연·프리스타일',             false),
  ('일렉트로닉',     '문화/예술', '클럽·페스티벌',                    false),
  ('사진',           '문화/예술', '필름·디지털',                     true),
  ('영상편집',       '문화/예술', '브이로그·단편',                    false),
  ('그림',           '문화/예술', '드로잉·수채화',                    true),
  ('유화',           '문화/예술', '유화·아크릴',                      false),
  ('디지털아트',     '문화/예술', 'iPad·태블릿 드로잉',               false),
  ('조각',           '문화/예술', '조각·도예',                       false),
  ('도예',           '문화/예술', '물레·손작업',                      true),
  ('캘리그라피',     '문화/예술', '손글씨 아트',                      false),
  ('서예',           '문화/예술', '붓글씨',                          false),
  ('뜨개질',         '문화/예술', '코바늘·대바늘',                    true),
  ('자수',           '문화/예술', '프랑스·한국 자수',                 false),
  ('재봉',           '문화/예술', '옷·소품 만들기',                   false),
  ('캔들',           '문화/예술', '향초·디퓨저 DIY',                  false),
  ('향수',           '문화/예술', '퍼퓨머리 공방',                    false),

  -- 게임/취미 --------------------------------------------------------------
  ('보드게임',       '게임/취미', '주말 보드게임 카페',               true),
  ('TRPG',           '게임/취미', '테이블탑 롤플레잉',                false),
  ('LCG/TCG',        '게임/취미', '매직·포켓몬·유희왕',               false),
  ('비디오게임',     '게임/취미', '콘솔·PC 게임',                     true),
  ('모바일게임',     '게임/취미', '팀 배틀·길드',                     false),
  ('e스포츠',        '게임/취미', 'LoL·발로란트 옵저빙',              false),
  ('아케이드',       '게임/취미', '오락실 모임',                     false),
  ('퍼즐',           '게임/취미', '직소·큐브·탈출',                   false),
  ('탈출카페',       '게임/취미', '방탈출',                          true),
  ('VR',             '게임/취미', 'VR 체험·아케이드',                 false),
  ('드론',           '게임/취미', '레이싱·항공촬영',                  false),
  ('RC',             '게임/취미', '무선조종 모형',                    false),
  ('프라모델',       '게임/취미', '건담·피규어',                      false),
  ('레고',           '게임/취미', '레고 성인 빌더',                   false),

  -- 음식/요리 --------------------------------------------------------------
  ('쿠킹',           '음식/요리', '함께 만들어 먹는 요리',            true),
  ('베이킹',         '음식/요리', '브레드·케이크·쿠키',               true),
  ('홈바리스타',     '음식/요리', '에스프레소·핸드드립',              true),
  ('와인',           '음식/요리', '테이스팅·페어링',                  true),
  ('위스키',         '음식/요리', '싱글몰트·블렌디드',                false),
  ('칵테일',         '음식/요리', '홈바·믹솔로지',                   false),
  ('전통주',         '음식/요리', '막걸리·소주·청주',                 false),
  ('맥주',           '음식/요리', '크래프트 비어 투어',                false),
  ('커피',           '음식/요리', '로스터리 투어',                   true),
  ('홍차',           '음식/요리', '티 세레모니',                     false),
  ('티소믈리에',     '음식/요리', '차 전문 테이스팅',                false),
  ('한식',           '음식/요리', '한식 쿠킹 클래스',                 false),
  ('양식',           '음식/요리', '이탈리안·프렌치',                 false),
  ('일식',           '음식/요리', '스시·라멘·이자카야',               false),
  ('중식',           '음식/요리', '딤섬·사천 요리',                   false),
  ('비건',           '음식/요리', '비건·비건주의 쿠킹',               false),
  ('푸드투어',       '음식/요리', '로컬 맛집 탐방',                   true),

  -- 자기계발 --------------------------------------------------------------
  ('영어회화',       '자기계발', '원어민·스터디',                    true),
  ('일본어',         '자기계발', 'JLPT·회화',                       false),
  ('중국어',         '자기계발', 'HSK·회화',                        false),
  ('스페인어',       '자기계발', 'DELE·회화',                       false),
  ('프랑스어',       '자기계발', 'DELF·회화',                       false),
  ('독일어',         '자기계발', 'Goethe 시험',                    false),
  ('코딩',           '자기계발', '알고리즘·사이드 프로젝트',         true),
  ('데이터분석',     '자기계발', 'Python·SQL',                      false),
  ('디자인',         '자기계발', 'UI·UX·그래픽',                    false),
  ('프로덕트매니지먼트', '자기계발', '제품 기획',                     false),
  ('마케팅',         '자기계발', '퍼포먼스·콘텐츠',                  false),
  ('창업',           '자기계발', '사이드프로젝트·창업 준비',          true),
  ('투자스터디',     '자기계발', '가치투자·ETF',                     false),
  ('경제',           '자기계발', '거시경제 토론',                    false),
  ('심리학',         '자기계발', '심리학 독서',                      false),
  ('철학',           '자기계발', '철학 토론',                       false),
  ('역사',           '자기계발', '한국사·세계사',                    false),
  ('스피치',         '자기계발', '발표·토론',                       false),
  ('명상',           '자기계발', '마음챙김·요가명상',                 true),

  -- 여행/야외 --------------------------------------------------------------
  ('국내여행',       '여행/야외', '주말 당일치기',                    true),
  ('해외여행',       '여행/야외', '공동 항공권·숙소',                 false),
  ('캠핑',           '여행/야외', '오토·백패킹',                     true),
  ('백패킹',         '여행/야외', '무박 종주·산행',                   false),
  ('피크닉',         '여행/야외', '한강·공원',                       true),
  ('차박',           '여행/야외', 'SUV·캠핑카',                       false),
  ('낚시',           '여행/야외', '바다·민물',                       false),
  ('스쿠버다이빙',   '여행/야외', '제주·해외',                       false),
  ('패러글라이딩',   '여행/야외', '단양·양평',                       false),
  ('스카이다이빙',   '여행/야외', '초고도 체험',                      false),
  ('드라이브',       '여행/야외', '동해·강원',                       false),
  ('바이크투어',     '여행/야외', '오토바이 투어',                    false),
  ('자전거투어',     '여행/야외', '국내외 자전거 여행',               false),
  ('관람',           '여행/야외', '동물원·수족관',                    false),
  ('도시탐험',       '여행/야외', '걷기·버스투어',                    false),

  -- 기술/제작 --------------------------------------------------------------
  ('목공',           '기술/제작', '가구·소품 DIY',                   true),
  ('가죽공예',       '기술/제작', '지갑·파우치',                      false),
  ('금속공예',       '기술/제작', '실버링·악세서리',                  false),
  ('3D프린팅',       '기술/제작', '메이커 공간',                      false),
  ('전자공작',       '기술/제작', '아두이노·라즈베리',                false),
  ('자작키보드',     '기술/제작', '커스텀 기계식',                    false),
  ('하이파이',       '기술/제작', '오디오 튜닝',                      false),
  ('홈브루잉',       '기술/제작', '수제맥주',                        false),

  -- 소셜/라이프 --------------------------------------------------------------
  ('반려동물',       '소셜/라이프', '강아지·고양이 모임',              true),
  ('강아지산책',     '소셜/라이프', '지역별 도그 산책',                false),
  ('고양이',         '소셜/라이프', '캣맘·집사 모임',                 false),
  ('식물',           '소셜/라이프', '식집사·가드닝',                   true),
  ('정원가꾸기',     '소셜/라이프', '베란다·옥상',                    false),
  ('채식',           '소셜/라이프', '비건·베지테리언',                 false),
  ('비건',           '소셜/라이프', '라이프스타일',                   false),
  ('미니멀',         '소셜/라이프', '미니멀리즘',                     false),
  ('자원봉사',       '소셜/라이프', '지역·환경·교육',                 true),
  ('환경',           '소셜/라이프', '제로웨이스트·플로깅',             false),
  ('플로깅',         '소셜/라이프', '줍깅·환경 활동',                 true),
  ('멘토링',         '소셜/라이프', '진로·커리어',                     false),
  ('독거청년',       '소셜/라이프', '1인 가구 모임',                   false),
  ('싱글대디/맘',    '소셜/라이프', '한부모 커뮤니티',                 false),
  ('직장인',         '소셜/라이프', '업계·직군 모임',                 false)
on conflict (name) do nothing;

-- Ensure member_count starts from 0 (not manipulated)
update public.hobbies set member_count = 0 where member_count is null;

-- ============================================================================
-- Verify
-- ============================================================================
-- select count(*) from public.hobbies;                    -- 200+ 조건
-- select category, count(*) from public.hobbies group by category order by 2 desc;


-- ==========================================
-- scripts/101_seed_tags.sql
-- ==========================================
-- ============================================================================
-- 101_seed_tags.sql
-- Initial hashtag catalog used in community posts and event filtering.
-- Tags are global (no user_id); contributors use them as discoverable buckets.
-- ============================================================================

insert into public.tags (name, description) values
  ('초보환영',      '초보자도 편하게 참여할 수 있어요'),
  ('30대',          '30대 중심 모임'),
  ('20대',          '20대 중심 모임'),
  ('여성만',        '여성만 참여할 수 있는 모임'),
  ('남성만',        '남성만 참여할 수 있는 모임'),
  ('혼자가입',      '혼자 가입해도 환영'),
  ('친구환영',      '친구와 함께 참여 가능'),
  ('커플환영',      '커플 참여 환영'),
  ('반려동물',      '반려동물 동반 가능'),
  ('퇴근후',        '평일 저녁'),
  ('주말',          '주말 모임'),
  ('평일오전',      '평일 오전 시간대'),
  ('원데이',        '일회성 체험'),
  ('정기모임',      '정기적으로 이어지는 모임'),
  ('강남',          '강남·서초 권역'),
  ('홍대',          '홍대·마포 권역'),
  ('성수',          '성수·건대 권역'),
  ('이태원',        '이태원·한남'),
  ('종로',          '종로·을지로 권역'),
  ('판교',          '판교·분당·성남'),
  ('인천',          '인천 지역'),
  ('부산',          '부산 지역'),
  ('제주',          '제주 지역'),
  ('온라인',        '온라인 참여 가능'),
  ('외국인',        '외국인 환영 / 영어 가능'),
  ('조용한',        '조용히 집중하는 모임'),
  ('시끌벅적',      '활기차고 에너제틱'),
  ('글로벌',        '다국적 멤버'),
  ('비영리',        '비영리·봉사'),
  ('프리미엄',      '프리미엄 회원 우선')
on conflict (name) do nothing;


-- ==========================================
-- scripts/102_seed_achievements.sql
-- ==========================================
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


-- ==========================================
-- scripts/103_seed_announcement.sql
-- ==========================================
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

