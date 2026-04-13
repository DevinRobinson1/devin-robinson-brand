create table public.webhook_events (
  stripe_event_id  text primary key,
  type             text not null,
  payload          jsonb not null,
  processed_at     timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.webhook_events enable row level security;
-- No policies. Service role only.
