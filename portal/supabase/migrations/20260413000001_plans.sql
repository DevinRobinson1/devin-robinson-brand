create type plan_id as enum ('entry', 'growth', 'scale', 'enterprise');

create table public.plans (
  id                   plan_id primary key,
  display_name         text not null,
  monthly_price_cents  int  not null,
  seat_limit           int  not null,
  stripe_price_id      text not null unique,
  created_at           timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "plans are world readable"
  on public.plans for select
  using (true);
