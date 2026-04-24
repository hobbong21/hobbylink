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

-- Ensure name uniqueness so seed scripts can use ON CONFLICT (name).
-- Idempotent: drops duplicates first, then adds the constraint if missing.
do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.hobbies'::regclass
       and conname = 'hobbies_name_key'
  ) then
    delete from public.hobbies a
      using public.hobbies b
     where a.name = b.name
       and a.ctid > b.ctid;
    alter table public.hobbies
      add constraint hobbies_name_key unique (name);
  end if;
end $$;

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
