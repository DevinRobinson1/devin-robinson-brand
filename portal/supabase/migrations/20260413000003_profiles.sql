create table public.profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper: is the calling user an admin?
-- security definer + locked search_path: bypasses RLS when called from policies
-- on public.profiles, preventing infinite recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where user_id = auth.uid()),
    false
  );
$$;
