create type workspace_role as enum ('owner', 'member');

create table public.workspace_members (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete cascade,
  role           workspace_role not null,
  invited_email  text,
  invited_at     timestamptz,
  joined_at      timestamptz,
  created_at     timestamptz not null default now()
);

create unique index workspace_members_unique_user
  on public.workspace_members(workspace_id, user_id)
  where user_id is not null;

create unique index workspace_members_unique_invite
  on public.workspace_members(workspace_id, invited_email)
  where user_id is null;

create index workspace_members_user_idx on public.workspace_members(user_id);

alter table public.workspace_members enable row level security;

-- Helper: workspaces the calling user is a member of
-- security definer + locked search_path: bypasses RLS when called from policies
-- on public.workspace_members (and downstream policies that use it), preventing
-- infinite recursion.
create or replace function public.user_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.workspace_members where user_id = auth.uid();
$$;
