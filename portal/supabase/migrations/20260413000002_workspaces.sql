create type workspace_status as enum ('active', 'past_due', 'canceled', 'paused');

create table public.workspaces (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  plan                    plan_id not null references public.plans(id),
  seat_limit              int  not null,
  stripe_customer_id      text not null unique,
  stripe_subscription_id  text not null unique,
  status                  workspace_status not null default 'active',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index workspaces_stripe_customer_idx on public.workspaces(stripe_customer_id);

alter table public.workspaces enable row level security;

-- Touch updated_at on every update
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger workspaces_touch_updated_at
  before update on public.workspaces
  for each row execute function public.touch_updated_at();
