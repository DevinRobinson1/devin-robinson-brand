insert into public.plans (id, display_name, monthly_price_cents, seat_limit, stripe_price_id) values
  ('entry',      'Entry Retainer', 250000, 1,   'price_test_entry'),
  ('growth',     'Growth CAIO',    350000, 3,   'price_test_growth'),
  ('scale',      'Scale CAIO',     500000, 5,   'price_test_scale'),
  ('enterprise', 'Enterprise CAIO', 0,     999, 'price_test_enterprise');
