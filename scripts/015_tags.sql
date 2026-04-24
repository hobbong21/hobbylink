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
