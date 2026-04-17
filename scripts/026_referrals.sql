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
