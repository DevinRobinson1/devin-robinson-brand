create table public.audit_log (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid references public.workspaces(id) on delete cascade,
  actor_user_id  uuid references auth.users(id) on delete set null,
  action         text not null,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index audit_log_workspace_idx on public.audit_log(workspace_id, created_at desc);

alter table public.audit_log enable row level security;
