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
