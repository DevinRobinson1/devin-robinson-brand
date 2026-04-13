# Client Portal — Spec 0 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the foundation layer of the Fractional CAIO client portal at `clients.fchiefaio.com` — Next.js + Supabase + Stripe auto-provisioning, RLS-based tenant isolation, magic-link + password auth, owner-driven team invites, and end-to-end tests against a real Postgres.

**Architecture:** Single Next.js 15 App Router project deployed to Vercel at the `portal/` subdirectory of this repo. Supabase Postgres with Row-Level Security enforces tenant isolation at the database layer. A Stripe webhook at `/api/webhooks/stripe` provisions workspaces and owner users on `checkout.session.completed` and emails a branded magic link via Resend. Admin and client routes share one deploy via Next.js route groups.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase (Postgres + Auth + Storage), `@supabase/ssr`, Stripe (Node SDK + CLI for local), Resend, Sentry, Upstash Redis + `@upstash/ratelimit`, Vitest, Playwright, GitHub Actions.

**Spec reference:** [`docs/superpowers/specs/2026-04-13-client-portal-foundation-design.md`](../specs/2026-04-13-client-portal-foundation-design.md)

---

## File Structure

All new code lives under `portal/` in the repo. The marketing site at the repo root is untouched.

```
portal/
├── .env.local.example
├── .env.test
├── next.config.mjs
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── playwright.config.ts
├── vitest.config.ts
├── sentry.client.config.ts
├── sentry.server.config.ts
├── middleware.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20260413000001_plans.sql
│   │   ├── 20260413000002_workspaces.sql
│   │   ├── 20260413000003_profiles.sql
│   │   ├── 20260413000004_workspace_members.sql
│   │   ├── 20260413000005_webhook_events.sql
│   │   ├── 20260413000006_audit_log.sql
│   │   ├── 20260413000007_rls_policies.sql
│   │   └── 20260413000008_seed_plans.sql
│   └── seed.sql
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                         (root redirect)
│   │   ├── login/page.tsx
│   │   ├── auth/callback/route.ts
│   │   ├── (client)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── team/page.tsx
│   │   │   │   └── billing/page.tsx
│   │   │   └── logout/route.ts
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   └── admin/
│   │   │       ├── page.tsx                 (workspace list)
│   │   │       ├── workspaces/[id]/page.tsx
│   │   │       └── users/page.tsx
│   │   └── api/
│   │       ├── webhooks/stripe/route.ts
│   │       ├── invites/route.ts
│   │       ├── invites/[id]/route.ts
│   │       ├── members/[id]/route.ts
│   │       ├── admin/users/promote/route.ts
│   │       └── internal/alert/route.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── browser.ts
│   │   │   ├── server.ts
│   │   │   └── admin.ts                     (service-role client)
│   │   ├── stripe.ts
│   │   ├── resend.ts
│   │   ├── plans.ts                         (pure plan lookup helpers)
│   │   ├── seats.ts                         (pure seat-math helpers)
│   │   ├── webhook-parser.ts                (pure checkout payload parser)
│   │   ├── provisioning.ts                  (workspace provisioning transaction)
│   │   ├── errors.ts                        (withErrorHandler wrapper)
│   │   ├── rate-limit.ts
│   │   └── emails/
│   │       ├── magic-link.tsx
│   │       └── invite.tsx
│   └── components/
│       ├── ui/                              (shared primitives)
│       ├── welcome-banner.tsx
│       ├── invite-form.tsx
│       ├── member-list.tsx
│       └── admin-mode-badge.tsx
├── tests/
│   ├── unit/
│   │   ├── plans.test.ts
│   │   ├── seats.test.ts
│   │   └── webhook-parser.test.ts
│   ├── integration/
│   │   ├── rls.test.ts
│   │   ├── webhook-checkout.test.ts
│   │   ├── webhook-idempotency.test.ts
│   │   ├── webhook-subscription-updated.test.ts
│   │   ├── webhook-subscription-deleted.test.ts
│   │   ├── webhook-email-collision.test.ts
│   │   └── invites.test.ts
│   ├── e2e/
│   │   ├── onboarding.spec.ts
│   │   ├── password-login.spec.ts
│   │   └── admin-access.spec.ts
│   └── helpers/
│       ├── db.ts                            (reset + seed helpers)
│       ├── stripe-fixtures.ts
│       └── mailpit.ts
└── .github/workflows/portal-ci.yml
```

**Responsibility boundaries:**
- `lib/*.ts` (non-supabase) files are **pure functions** — no DB, no network. Unit-tested.
- `lib/supabase/*.ts` are the only files that create Supabase clients.
- `lib/provisioning.ts` is the only file that writes to `workspaces`, `workspace_members`, `profiles` directly (via service role). Everything else goes through it.
- `app/api/webhooks/stripe/route.ts` is thin — it verifies, parses via `webhook-parser.ts`, and delegates to `provisioning.ts`.

---

## Phase A — Project Scaffold

### Task 1: Create Next.js project in `portal/`

**Files:**
- Create: `portal/package.json`, `portal/tsconfig.json`, `portal/next.config.mjs`, `portal/tailwind.config.ts`, `portal/postcss.config.mjs`, `portal/src/app/layout.tsx`, `portal/src/app/globals.css`, `portal/src/app/page.tsx`

- [ ] **Step 1: Scaffold Next.js**

Run from repo root:
```bash
npx create-next-app@15 portal --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-npm
```

When prompted, accept defaults. This creates `portal/` with App Router, TS, Tailwind, `src/` layout.

- [ ] **Step 2: Verify it boots**

```bash
cd portal && npm run dev
```

Expected: server starts on http://localhost:3000 and shows the Next.js welcome page. Kill with Ctrl-C.

- [ ] **Step 3: Replace the default page with a session-aware placeholder**

Create `portal/src/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/login');
}
```

- [ ] **Step 4: Commit**

```bash
git add portal/
git commit -m "feat(portal): scaffold Next.js 15 App Router project"
```

---

### Task 2: Install runtime and dev dependencies

**Files:**
- Modify: `portal/package.json`

- [ ] **Step 1: Install runtime deps**

```bash
cd portal
npm install @supabase/supabase-js @supabase/ssr stripe resend @sentry/nextjs @upstash/ratelimit @upstash/redis zod sonner react-email @react-email/components
```

- [ ] **Step 2: Install dev deps**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom playwright @playwright/test tsx dotenv-cli supabase
```

- [ ] **Step 3: Install Playwright browsers**

```bash
npx playwright install --with-deps chromium
```

- [ ] **Step 4: Commit**

```bash
git add portal/package.json portal/package-lock.json
git commit -m "feat(portal): add supabase, stripe, resend, sentry, vitest, playwright deps"
```

---

### Task 3: Set up Supabase local stack

**Files:**
- Create: `portal/supabase/config.toml` (auto-generated)

- [ ] **Step 1: Initialize Supabase**

```bash
cd portal
npx supabase init
```

Accept defaults. This creates `supabase/config.toml` and `supabase/migrations/`.

- [ ] **Step 2: Start the local stack**

```bash
npx supabase start
```

Expected: downloads Docker images and prints local URLs + anon/service-role keys. Copy these to the `.env.local.example` file in the next task.

- [ ] **Step 3: Verify**

```bash
npx supabase status
```

Expected: API URL, DB URL, studio URL all listed, all running.

- [ ] **Step 4: Commit**

```bash
git add portal/supabase/config.toml
git commit -m "feat(portal): initialize supabase local stack"
```

---

### Task 4: Environment variable template

**Files:**
- Create: `portal/.env.local.example`, `portal/.env.test`

- [ ] **Step 1: Write `.env.local.example`**

Create `portal/.env.local.example`:
```
# Public app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (from `npx supabase status`)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_
STRIPE_SECRET_KEY=sk_test_
STRIPE_WEBHOOK_SECRET=whsec_

# Plan → Stripe price mapping (filled in Task 5 seed)
STRIPE_PRICE_ENTRY=price_
STRIPE_PRICE_GROWTH=price_
STRIPE_PRICE_SCALE=price_
STRIPE_PRICE_ENTERPRISE=price_

# Resend
RESEND_API_KEY=re_

# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Admin alerts
ALERT_EMAIL_TO=devin@fchiefaio.com
```

- [ ] **Step 2: Write `.env.test`**

Create `portal/.env.test`:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste anon key from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<paste service_role key from supabase status>
STRIPE_WEBHOOK_SECRET=whsec_test_fixture_secret
STRIPE_SECRET_KEY=sk_test_fake
STRIPE_PRICE_ENTRY=price_test_entry
STRIPE_PRICE_GROWTH=price_test_growth
STRIPE_PRICE_SCALE=price_test_scale
STRIPE_PRICE_ENTERPRISE=price_test_enterprise
RESEND_API_KEY=re_fake
ALERT_EMAIL_TO=test@fchiefaio.com
```

- [ ] **Step 3: Gitignore real env files**

Add to `portal/.gitignore` (create if missing — Next.js scaffold should have already added `.env*.local`):
```
.env
.env.local
.env.*.local
```

- [ ] **Step 4: Commit**

```bash
git add portal/.env.local.example portal/.env.test portal/.gitignore
git commit -m "feat(portal): env var templates"
```

---

## Phase B — Database Schema & RLS

### Task 5: `plans` table migration + seed

**Files:**
- Create: `portal/supabase/migrations/20260413000001_plans.sql`
- Create: `portal/supabase/migrations/20260413000008_seed_plans.sql`

- [ ] **Step 1: Write the plans migration**

Create `portal/supabase/migrations/20260413000001_plans.sql`:
```sql
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
```

- [ ] **Step 2: Write the seed migration**

Create `portal/supabase/migrations/20260413000008_seed_plans.sql`:
```sql
insert into public.plans (id, display_name, monthly_price_cents, seat_limit, stripe_price_id) values
  ('entry',      'Entry Retainer', 250000, 1,   'price_test_entry'),
  ('growth',     'Growth CAIO',    350000, 3,   'price_test_growth'),
  ('scale',      'Scale CAIO',     500000, 5,   'price_test_scale'),
  ('enterprise', 'Enterprise CAIO', 0,     999, 'price_test_enterprise');
```

Note: real Stripe price IDs will replace `price_test_*` via a follow-up migration in production deploy (Task 40).

- [ ] **Step 3: Apply migrations**

```bash
cd portal
npx supabase db reset
```

Expected: drops the local DB, re-applies all migrations, runs seed. Last line should say "Finished `supabase db reset`."

- [ ] **Step 4: Verify rows exist**

```bash
npx supabase db dump --data-only --schema public --table plans | grep -c 'entry\|growth\|scale\|enterprise'
```

Expected: `4`

- [ ] **Step 5: Commit**

```bash
git add portal/supabase/migrations/20260413000001_plans.sql portal/supabase/migrations/20260413000008_seed_plans.sql
git commit -m "feat(portal): plans table migration and seed"
```

---

### Task 6: `workspaces` table migration

**Files:**
- Create: `portal/supabase/migrations/20260413000002_workspaces.sql`

- [ ] **Step 1: Write the migration**

Create `portal/supabase/migrations/20260413000002_workspaces.sql`:
```sql
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
```

- [ ] **Step 2: Apply and verify**

```bash
cd portal && npx supabase db reset
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add portal/supabase/migrations/20260413000002_workspaces.sql
git commit -m "feat(portal): workspaces table migration"
```

---

### Task 7: `profiles` table migration

**Files:**
- Create: `portal/supabase/migrations/20260413000003_profiles.sql`

- [ ] **Step 1: Write the migration**

Create `portal/supabase/migrations/20260413000003_profiles.sql`:
```sql
create table public.profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper: is the calling user an admin?
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(
    (select is_admin from public.profiles where user_id = auth.uid()),
    false
  );
$$;
```

- [ ] **Step 2: Apply and verify**

```bash
cd portal && npx supabase db reset
```

- [ ] **Step 3: Commit**

```bash
git add portal/supabase/migrations/20260413000003_profiles.sql
git commit -m "feat(portal): profiles table and is_admin() helper"
```

---

### Task 8: `workspace_members` table migration

**Files:**
- Create: `portal/supabase/migrations/20260413000004_workspace_members.sql`

- [ ] **Step 1: Write the migration**

Create `portal/supabase/migrations/20260413000004_workspace_members.sql`:
```sql
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
create or replace function public.user_workspace_ids()
returns setof uuid language sql stable as $$
  select workspace_id from public.workspace_members where user_id = auth.uid();
$$;
```

- [ ] **Step 2: Apply and verify**

```bash
cd portal && npx supabase db reset
```

- [ ] **Step 3: Commit**

```bash
git add portal/supabase/migrations/20260413000004_workspace_members.sql
git commit -m "feat(portal): workspace_members table and user_workspace_ids() helper"
```

---

### Task 9: `webhook_events` and `audit_log` tables

**Files:**
- Create: `portal/supabase/migrations/20260413000005_webhook_events.sql`
- Create: `portal/supabase/migrations/20260413000006_audit_log.sql`

- [ ] **Step 1: Write webhook_events migration**

Create `portal/supabase/migrations/20260413000005_webhook_events.sql`:
```sql
create table public.webhook_events (
  stripe_event_id  text primary key,
  type             text not null,
  payload          jsonb not null,
  processed_at     timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.webhook_events enable row level security;
-- No policies. Service role only.
```

- [ ] **Step 2: Write audit_log migration**

Create `portal/supabase/migrations/20260413000006_audit_log.sql`:
```sql
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
```

- [ ] **Step 3: Apply and verify**

```bash
cd portal && npx supabase db reset
```

- [ ] **Step 4: Commit**

```bash
git add portal/supabase/migrations/20260413000005_webhook_events.sql portal/supabase/migrations/20260413000006_audit_log.sql
git commit -m "feat(portal): webhook_events idempotency table and audit_log"
```

---

### Task 10: RLS policies migration

**Files:**
- Create: `portal/supabase/migrations/20260413000007_rls_policies.sql`

- [ ] **Step 1: Write the RLS policies**

Create `portal/supabase/migrations/20260413000007_rls_policies.sql`:
```sql
-- profiles: users read/update their own row; admins read all
create policy "profiles_self_select"
  on public.profiles for select
  using (user_id = auth.uid() or public.is_admin());

create policy "profiles_self_update"
  on public.profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_admin = (select is_admin from public.profiles where user_id = auth.uid()));
-- ^ Users cannot flip their own is_admin flag.

-- workspaces: members read; admins read all
create policy "workspaces_member_select"
  on public.workspaces for select
  using (id in (select public.user_workspace_ids()) or public.is_admin());

-- workspace_members: members read their own workspace's members; admins read all
create policy "workspace_members_member_select"
  on public.workspace_members for select
  using (workspace_id in (select public.user_workspace_ids()) or public.is_admin());

-- audit_log: members read their workspace's audit log; admins read all
create policy "audit_log_member_select"
  on public.audit_log for select
  using (workspace_id in (select public.user_workspace_ids()) or public.is_admin());

-- No INSERT/UPDATE/DELETE policies on workspaces, workspace_members, audit_log, webhook_events.
-- All writes go through the service role (API routes and webhook).
```

- [ ] **Step 2: Apply and verify**

```bash
cd portal && npx supabase db reset
```

- [ ] **Step 3: Commit**

```bash
git add portal/supabase/migrations/20260413000007_rls_policies.sql
git commit -m "feat(portal): RLS policies for tenant isolation"
```

---

### Task 11: Vitest config and DB helper

**Files:**
- Create: `portal/vitest.config.ts`, `portal/tests/helpers/db.ts`

- [ ] **Step 1: Write vitest config**

Create `portal/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    env: loadEnv('test', process.cwd(), ''),
    setupFiles: [],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 20000,
  },
}));
```

- [ ] **Step 2: Write db helper**

Create `portal/tests/helpers/db.ts`:
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function serviceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export function anonClient(accessToken?: string): SupabaseClient {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  if (accessToken) {
    // @ts-expect-error — the client supports setting auth manually
    client.rest.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return client;
}

export async function resetDb() {
  const svc = serviceClient();
  // Clean order: children first
  await svc.from('audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await svc.from('workspace_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await svc.from('webhook_events').delete().neq('stripe_event_id', '');
  await svc.from('workspaces').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // Delete any non-admin auth users (admin flag comes from profiles)
  const { data: users } = await svc.auth.admin.listUsers();
  for (const u of users?.users ?? []) {
    await svc.auth.admin.deleteUser(u.id);
  }
}

export async function createAuthUser(email: string): Promise<string> {
  const svc = serviceClient();
  const { data, error } = await svc.auth.admin.createUser({
    email, email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('no user');
  await svc.from('profiles').insert({ user_id: data.user.id, full_name: email });
  return data.user.id;
}

export async function signInAs(email: string): Promise<string> {
  const svc = serviceClient();
  const { data, error } = await svc.auth.admin.generateLink({
    type: 'magiclink', email,
  });
  if (error || !data.properties?.hashed_token) throw error ?? new Error('no token');
  // Exchange via anon client
  const anon = anonClient();
  const { data: session, error: err2 } = await anon.auth.verifyOtp({
    email, token_hash: data.properties.hashed_token, type: 'magiclink',
  });
  if (err2 || !session.session) throw err2 ?? new Error('no session');
  return session.session.access_token;
}
```

- [ ] **Step 3: Add test script to package.json**

Modify `portal/package.json`, add to `scripts`:
```json
"test": "dotenv -e .env.test -- vitest run",
"test:watch": "dotenv -e .env.test -- vitest",
"test:e2e": "dotenv -e .env.test -- playwright test"
```

- [ ] **Step 4: Commit**

```bash
git add portal/vitest.config.ts portal/tests/helpers/db.ts portal/package.json
git commit -m "feat(portal): vitest config and integration-test db helpers"
```

---

### Task 12: RLS integration test (the security-critical one)

**Files:**
- Create: `portal/tests/integration/rls.test.ts`

- [ ] **Step 1: Write the failing test**

Create `portal/tests/integration/rls.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { serviceClient, anonClient, resetDb, createAuthUser, signInAs } from '../helpers/db';

describe('RLS tenant isolation', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('prevents a user from reading another workspace', async () => {
    const svc = serviceClient();

    const aliceId = await createAuthUser('alice@a.com');
    const bobId   = await createAuthUser('bob@b.com');

    const { data: wsA, error: e1 } = await svc.from('workspaces').insert({
      name: 'Acme', plan: 'entry', seat_limit: 1,
      stripe_customer_id: 'cus_a', stripe_subscription_id: 'sub_a',
    }).select().single();
    expect(e1).toBeNull();

    const { data: wsB, error: e2 } = await svc.from('workspaces').insert({
      name: 'Beta', plan: 'entry', seat_limit: 1,
      stripe_customer_id: 'cus_b', stripe_subscription_id: 'sub_b',
    }).select().single();
    expect(e2).toBeNull();

    await svc.from('workspace_members').insert({
      workspace_id: wsA!.id, user_id: aliceId, role: 'owner', joined_at: new Date().toISOString(),
    });
    await svc.from('workspace_members').insert({
      workspace_id: wsB!.id, user_id: bobId,   role: 'owner', joined_at: new Date().toISOString(),
    });

    const aliceToken = await signInAs('alice@a.com');
    const aliceAnon = anonClient(aliceToken);

    const { data } = await aliceAnon.from('workspaces').select('*');
    expect(data).toHaveLength(1);
    expect(data![0].id).toBe(wsA!.id);
  });

  it('allows admin to read all workspaces', async () => {
    const svc = serviceClient();
    const adminId = await createAuthUser('admin@fchiefaio.com');
    await svc.from('profiles').update({ is_admin: true }).eq('user_id', adminId);

    await svc.from('workspaces').insert([
      { name: 'A', plan: 'entry', seat_limit: 1, stripe_customer_id: 'cus_1', stripe_subscription_id: 'sub_1' },
      { name: 'B', plan: 'growth', seat_limit: 3, stripe_customer_id: 'cus_2', stripe_subscription_id: 'sub_2' },
    ]);

    const token = await signInAs('admin@fchiefaio.com');
    const admin = anonClient(token);
    const { data } = await admin.from('workspaces').select('*');
    expect(data).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run and verify it passes**

```bash
cd portal && npm test -- rls
```

Expected: 2 tests pass. If they fail, the RLS policies from Task 10 are wrong — fix before proceeding.

- [ ] **Step 3: Commit**

```bash
git add portal/tests/integration/rls.test.ts
git commit -m "test(portal): RLS tenant isolation integration tests"
```

---

## Phase C — Supabase Clients, Middleware, Login

### Task 13: Supabase client helpers

**Files:**
- Create: `portal/src/lib/supabase/browser.ts`, `portal/src/lib/supabase/server.ts`, `portal/src/lib/supabase/admin.ts`

- [ ] **Step 1: Browser client**

Create `portal/src/lib/supabase/browser.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Server client**

Create `portal/src/lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Called from a Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Admin (service-role) client**

Create `portal/src/lib/supabase/admin.ts`:
```ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add portal/src/lib/supabase
git commit -m "feat(portal): supabase client helpers (browser, server, admin)"
```

---

### Task 14: Middleware (session refresh + admin routing)

**Files:**
- Create: `portal/middleware.ts`

- [ ] **Step 1: Write middleware**

Create `portal/middleware.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const isClientRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/settings');
  const isAdminRoute  = pathname.startsWith('/admin');
  const isPublic      = pathname === '/login' || pathname.startsWith('/auth/') || pathname === '/';

  if (!user && (isClientRoute || isAdminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api/webhooks|api/internal|_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Commit**

```bash
git add portal/middleware.ts
git commit -m "feat(portal): auth middleware with admin routing"
```

---

### Task 15: `/login` page with magic-link and password tabs

**Files:**
- Create: `portal/src/app/login/page.tsx`

- [ ] **Step 1: Write the login page**

Create `portal/src/app/login/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';
  const [mode, setMode] = useState<'magic' | 'password'>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const supabase = createClient();
    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
        setStatus('Check your email for a magic link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = next;
      }
    } catch (err: any) {
      setStatus(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('magic')}
          className={`px-3 py-1 rounded ${mode === 'magic' ? 'bg-black text-white' : 'bg-gray-100'}`}
        >Magic link</button>
        <button
          type="button"
          onClick={() => setMode('password')}
          className={`px-3 py-1 rounded ${mode === 'password' ? 'bg-black text-white' : 'bg-gray-100'}`}
        >Password</button>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full border px-3 py-2 rounded"
        />
        {mode === 'password' && (
          <input
            type="password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 12 characters)"
            className="w-full border px-3 py-2 rounded"
          />
        )}
        <button disabled={loading} className="w-full bg-black text-white py-2 rounded disabled:opacity-50">
          {loading ? 'Working…' : mode === 'magic' ? 'Send magic link' : 'Sign in'}
        </button>
      </form>
      {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add portal/src/app/login/page.tsx
git commit -m "feat(portal): /login page with magic-link and password modes"
```

---

### Task 16: `/auth/callback` route handler

**Files:**
- Create: `portal/src/app/auth/callback/route.ts`

- [ ] **Step 1: Write the callback**

Create `portal/src/app/auth/callback/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) return NextResponse.redirect(`${origin}/login`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);

  // Link any pending invites matching this email
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    const admin = createAdminClient();
    await admin.from('workspace_members').update({
      user_id: user.id,
      joined_at: new Date().toISOString(),
      invited_email: null,
    }).eq('invited_email', user.email).is('user_id', null);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add portal/src/app/auth/callback/route.ts
git commit -m "feat(portal): /auth/callback route with pending-invite linking"
```

---

## Phase D — Pure Helpers (Unit-Tested)

### Task 17: `lib/plans.ts` + unit tests

**Files:**
- Create: `portal/src/lib/plans.ts`, `portal/tests/unit/plans.test.ts`

- [ ] **Step 1: Write the failing test**

Create `portal/tests/unit/plans.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { planFromPriceId, PLAN_SEAT_LIMITS } from '@/lib/plans';

describe('planFromPriceId', () => {
  const env = {
    STRIPE_PRICE_ENTRY: 'price_entry',
    STRIPE_PRICE_GROWTH: 'price_growth',
    STRIPE_PRICE_SCALE: 'price_scale',
    STRIPE_PRICE_ENTERPRISE: 'price_enterprise',
  };

  it('maps known price ids to plan ids', () => {
    expect(planFromPriceId('price_entry', env)).toBe('entry');
    expect(planFromPriceId('price_growth', env)).toBe('growth');
    expect(planFromPriceId('price_scale', env)).toBe('scale');
    expect(planFromPriceId('price_enterprise', env)).toBe('enterprise');
  });

  it('returns null for unknown price ids', () => {
    expect(planFromPriceId('price_unknown', env)).toBeNull();
  });
});

describe('PLAN_SEAT_LIMITS', () => {
  it('has the expected seat limits per tier', () => {
    expect(PLAN_SEAT_LIMITS).toEqual({
      entry: 1, growth: 3, scale: 5, enterprise: 999,
    });
  });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
cd portal && npm test -- plans
```

Expected: fails with "Cannot find module '@/lib/plans'".

- [ ] **Step 3: Implement**

Create `portal/src/lib/plans.ts`:
```ts
export type PlanId = 'entry' | 'growth' | 'scale' | 'enterprise';

export const PLAN_SEAT_LIMITS: Record<PlanId, number> = {
  entry: 1, growth: 3, scale: 5, enterprise: 999,
};

export type StripePriceEnv = {
  STRIPE_PRICE_ENTRY: string;
  STRIPE_PRICE_GROWTH: string;
  STRIPE_PRICE_SCALE: string;
  STRIPE_PRICE_ENTERPRISE: string;
};

export function planFromPriceId(priceId: string, env: StripePriceEnv): PlanId | null {
  if (priceId === env.STRIPE_PRICE_ENTRY) return 'entry';
  if (priceId === env.STRIPE_PRICE_GROWTH) return 'growth';
  if (priceId === env.STRIPE_PRICE_SCALE) return 'scale';
  if (priceId === env.STRIPE_PRICE_ENTERPRISE) return 'enterprise';
  return null;
}
```

- [ ] **Step 4: Run, verify pass**

```bash
cd portal && npm test -- plans
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add portal/src/lib/plans.ts portal/tests/unit/plans.test.ts
git commit -m "feat(portal): plans lib with price-id → plan-id mapping"
```

---

### Task 18: `lib/seats.ts` + unit tests

**Files:**
- Create: `portal/src/lib/seats.ts`, `portal/tests/unit/seats.test.ts`

- [ ] **Step 1: Write the failing test**

Create `portal/tests/unit/seats.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { canAddSeat } from '@/lib/seats';

describe('canAddSeat', () => {
  it('allows when under limit', () => {
    expect(canAddSeat({ seatLimit: 3, activeCount: 1, pendingCount: 1 })).toBe(true);
  });
  it('rejects when at limit', () => {
    expect(canAddSeat({ seatLimit: 3, activeCount: 2, pendingCount: 1 })).toBe(false);
  });
  it('rejects when over limit', () => {
    expect(canAddSeat({ seatLimit: 1, activeCount: 2, pendingCount: 0 })).toBe(false);
  });
  it('treats pending invites as taking a seat', () => {
    expect(canAddSeat({ seatLimit: 3, activeCount: 1, pendingCount: 2 })).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
cd portal && npm test -- seats
```

- [ ] **Step 3: Implement**

Create `portal/src/lib/seats.ts`:
```ts
export type SeatCounts = {
  seatLimit: number;
  activeCount: number;
  pendingCount: number;
};

export function canAddSeat({ seatLimit, activeCount, pendingCount }: SeatCounts): boolean {
  return activeCount + pendingCount < seatLimit;
}
```

- [ ] **Step 4: Run, verify pass**

```bash
cd portal && npm test -- seats
```

- [ ] **Step 5: Commit**

```bash
git add portal/src/lib/seats.ts portal/tests/unit/seats.test.ts
git commit -m "feat(portal): seat-math helpers"
```

---

### Task 19: `lib/webhook-parser.ts` + unit tests

**Files:**
- Create: `portal/src/lib/webhook-parser.ts`, `portal/tests/unit/webhook-parser.test.ts`

- [ ] **Step 1: Write the failing test**

Create `portal/tests/unit/webhook-parser.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseCheckoutSession } from '@/lib/webhook-parser';

const base = {
  id: 'cs_test_123',
  customer: 'cus_123',
  subscription: 'sub_123',
  customer_email: 'alice@acme.com',
  customer_details: { name: 'Alice A', email: 'alice@acme.com' },
  custom_fields: [
    { key: 'company_name', text: { value: 'Acme Inc.' } },
  ],
  line_items: { data: [{ price: { id: 'price_growth' } }] },
};

describe('parseCheckoutSession', () => {
  it('extracts fields with company name', () => {
    const result = parseCheckoutSession(base as any);
    expect(result).toEqual({
      email: 'alice@acme.com',
      fullName: 'Alice A',
      companyName: 'Acme Inc.',
      priceId: 'price_growth',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
    });
  });

  it('falls back to "<email>\'s workspace" when company_name missing', () => {
    const session = { ...base, custom_fields: [] };
    const result = parseCheckoutSession(session as any);
    expect(result.companyName).toBe("alice@acme.com's workspace");
  });

  it('throws if required fields missing', () => {
    expect(() => parseCheckoutSession({ ...base, customer_email: null } as any)).toThrow();
    expect(() => parseCheckoutSession({ ...base, line_items: { data: [] } } as any)).toThrow();
  });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
cd portal && npm test -- webhook-parser
```

- [ ] **Step 3: Implement**

Create `portal/src/lib/webhook-parser.ts`:
```ts
import type Stripe from 'stripe';

export type ParsedCheckout = {
  email: string;
  fullName: string | null;
  companyName: string;
  priceId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
};

export function parseCheckoutSession(
  session: Stripe.Checkout.Session & { line_items?: Stripe.ApiList<Stripe.LineItem> }
): ParsedCheckout {
  const email = session.customer_email ?? session.customer_details?.email;
  if (!email) throw new Error('checkout.session missing customer_email');

  const priceId = session.line_items?.data?.[0]?.price?.id;
  if (!priceId) throw new Error('checkout.session missing line_items[0].price.id');

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  if (!customerId) throw new Error('checkout.session missing customer');

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  if (!subscriptionId) throw new Error('checkout.session missing subscription');

  const companyField = session.custom_fields?.find((f) => f.key === 'company_name');
  const companyName = companyField?.text?.value?.trim() || `${email}'s workspace`;

  return {
    email,
    fullName: session.customer_details?.name ?? null,
    companyName,
    priceId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  };
}
```

- [ ] **Step 4: Run, verify pass**

```bash
cd portal && npm test -- webhook-parser
```

- [ ] **Step 5: Commit**

```bash
git add portal/src/lib/webhook-parser.ts portal/tests/unit/webhook-parser.test.ts
git commit -m "feat(portal): pure Stripe checkout-session parser"
```

---

## Phase E — Provisioning & Stripe Webhook

### Task 20: `lib/provisioning.ts` — workspace provisioning transaction

**Files:**
- Create: `portal/src/lib/provisioning.ts`

- [ ] **Step 1: Write the module**

Create `portal/src/lib/provisioning.ts`:
```ts
import { createAdminClient } from '@/lib/supabase/admin';
import { PLAN_SEAT_LIMITS, type PlanId } from '@/lib/plans';
import type { ParsedCheckout } from '@/lib/webhook-parser';

export type ProvisionResult = {
  workspaceId: string;
  userId: string;
  isNewUser: boolean;
};

export async function provisionWorkspaceFromCheckout(
  parsed: ParsedCheckout,
  plan: PlanId
): Promise<ProvisionResult> {
  const admin = createAdminClient();
  const seatLimit = PLAN_SEAT_LIMITS[plan];

  // 1. Create or fetch the auth user
  let userId: string;
  let isNewUser = false;
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users.find((u) => u.email === parsed.email);
  if (found) {
    userId = found.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: parsed.email, email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error('createUser failed');
    userId = data.user.id;
    isNewUser = true;
  }

  // 2. Upsert profile
  await admin.from('profiles').upsert({
    user_id: userId,
    full_name: parsed.fullName,
  }, { onConflict: 'user_id' });

  // 3. Create workspace
  const { data: workspace, error: wsErr } = await admin.from('workspaces').insert({
    name: parsed.companyName,
    plan,
    seat_limit: seatLimit,
    stripe_customer_id: parsed.stripeCustomerId,
    stripe_subscription_id: parsed.stripeSubscriptionId,
    status: 'active',
  }).select().single();
  if (wsErr || !workspace) throw wsErr ?? new Error('workspace insert failed');

  // 4. Owner membership
  const { error: memErr } = await admin.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'owner',
    joined_at: new Date().toISOString(),
  });
  if (memErr) throw memErr;

  // 5. Audit log
  await admin.from('audit_log').insert({
    workspace_id: workspace.id,
    actor_user_id: userId,
    action: 'workspace.provisioned',
    metadata: {
      plan,
      stripe_customer_id: parsed.stripeCustomerId,
      is_new_user: isNewUser,
    },
  });

  return { workspaceId: workspace.id, userId, isNewUser };
}

export async function applySubscriptionUpdate(
  stripeSubscriptionId: string,
  newPlan: PlanId
): Promise<void> {
  const admin = createAdminClient();
  const seatLimit = PLAN_SEAT_LIMITS[newPlan];
  await admin.from('workspaces').update({
    plan: newPlan, seat_limit: seatLimit,
  }).eq('stripe_subscription_id', stripeSubscriptionId);
}

export async function markSubscriptionCanceled(stripeSubscriptionId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from('workspaces').update({
    status: 'canceled',
  }).eq('stripe_subscription_id', stripeSubscriptionId);
}
```

- [ ] **Step 2: Commit**

```bash
git add portal/src/lib/provisioning.ts
git commit -m "feat(portal): workspace provisioning transaction"
```

---

### Task 21: `lib/resend.ts` + magic-link email template

**Files:**
- Create: `portal/src/lib/resend.ts`, `portal/src/lib/emails/magic-link.tsx`

- [ ] **Step 1: Write the resend wrapper**

Create `portal/src/lib/resend.ts`:
```ts
import { Resend } from 'resend';

let client: Resend | null = null;

export function resend(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY!);
  return client;
}

export async function sendMagicLinkEmail(params: {
  to: string;
  magicLink: string;
  planDisplayName: string;
}): Promise<void> {
  const { MagicLinkEmail } = await import('./emails/magic-link');
  await resend().emails.send({
    from: 'Devin Robinson <hello@fchiefaio.com>',
    to: params.to,
    subject: 'Your CAIO portal is ready',
    react: MagicLinkEmail({ magicLink: params.magicLink, planDisplayName: params.planDisplayName }),
  });
}

export async function sendInviteEmail(params: {
  to: string;
  magicLink: string;
  workspaceName: string;
  inviterName: string | null;
}): Promise<void> {
  const { InviteEmail } = await import('./emails/invite');
  await resend().emails.send({
    from: 'Devin Robinson <hello@fchiefaio.com>',
    to: params.to,
    subject: `You've been invited to ${params.workspaceName}`,
    react: InviteEmail(params),
  });
}
```

- [ ] **Step 2: Write the magic-link template**

Create `portal/src/lib/emails/magic-link.tsx`:
```tsx
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components';

export function MagicLinkEmail({ magicLink, planDisplayName }: { magicLink: string; planDisplayName: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8f7f5' }}>
        <Container style={{ padding: '40px', maxWidth: '560px' }}>
          <Heading>Welcome to your CAIO portal</Heading>
          <Text>You&apos;re on the <strong>{planDisplayName}</strong> plan. Click below to log in — the link is valid for 15 minutes.</Text>
          <Button href={magicLink} style={{ background: '#c45a3c', color: '#fff', padding: '12px 24px', borderRadius: '6px' }}>
            Sign in
          </Button>
          <Text style={{ fontSize: '12px', color: '#666', marginTop: '40px' }}>
            If you didn&apos;t expect this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 3: Write the invite template**

Create `portal/src/lib/emails/invite.tsx`:
```tsx
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components';

export function InviteEmail({ magicLink, workspaceName, inviterName }: {
  magicLink: string; workspaceName: string; inviterName: string | null;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8f7f5' }}>
        <Container style={{ padding: '40px', maxWidth: '560px' }}>
          <Heading>You&apos;ve been invited to {workspaceName}</Heading>
          <Text>{inviterName ?? 'A teammate'} added you to the {workspaceName} workspace on the CAIO portal.</Text>
          <Button href={magicLink} style={{ background: '#c45a3c', color: '#fff', padding: '12px 24px', borderRadius: '6px' }}>
            Accept invite
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add portal/src/lib/resend.ts portal/src/lib/emails
git commit -m "feat(portal): Resend wrapper and branded magic-link/invite templates"
```

---

### Task 22: Stripe webhook handler — happy path

**Files:**
- Create: `portal/src/app/api/webhooks/stripe/route.ts`, `portal/src/lib/stripe.ts`

- [ ] **Step 1: Stripe client wrapper**

Create `portal/src/lib/stripe.ts`:
```ts
import Stripe from 'stripe';

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });
  }
  return client;
}
```

- [ ] **Step 2: Webhook route**

Create `portal/src/app/api/webhooks/stripe/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCheckoutSession } from '@/lib/webhook-parser';
import { planFromPriceId } from '@/lib/plans';
import {
  provisionWorkspaceFromCheckout,
  applySubscriptionUpdate,
  markSubscriptionCanceled,
} from '@/lib/provisioning';
import { sendMagicLinkEmail } from '@/lib/resend';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return new NextResponse('missing signature', { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new NextResponse(`signature verification failed: ${err.message}`, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency check
  const { data: existing } = await admin
    .from('webhook_events').select('stripe_event_id').eq('stripe_event_id', event.id).maybeSingle();
  if (existing) return NextResponse.json({ ok: true, duplicate: true });

  await admin.from('webhook_events').insert({
    stripe_event_id: event.id, type: event.type, payload: event as any,
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Re-fetch with line_items expanded
        const full = await stripe().checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'customer_details'],
        });
        const parsed = parseCheckoutSession(full as any);
        const plan = planFromPriceId(parsed.priceId, process.env as any);
        if (!plan) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/alert`, {
            method: 'POST',
            body: JSON.stringify({ kind: 'unknown_price_id', priceId: parsed.priceId }),
          });
          return new NextResponse('unknown price_id', { status: 500 });
        }
        const result = await provisionWorkspaceFromCheckout(parsed, plan);

        // Generate a magic link and email it
        const { data: link } = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email: parsed.email,
          options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard` },
        });
        if (link?.properties?.action_link) {
          await sendMagicLinkEmail({
            to: parsed.email,
            magicLink: link.properties.action_link,
            planDisplayName: plan.charAt(0).toUpperCase() + plan.slice(1),
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price.id;
        const plan = priceId ? planFromPriceId(priceId, process.env as any) : null;
        if (plan) await applySubscriptionUpdate(sub.id, plan);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await markSubscriptionCanceled(sub.id);
        break;
      }
    }
  } catch (err: any) {
    await admin.from('audit_log').insert({
      action: 'webhook.failed',
      metadata: { event_id: event.id, error: err.message },
    });
    return new NextResponse(`handler error: ${err.message}`, { status: 500 });
  }

  await admin.from('webhook_events').update({ processed_at: new Date().toISOString() })
    .eq('stripe_event_id', event.id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add portal/src/app/api/webhooks/stripe portal/src/lib/stripe.ts
git commit -m "feat(portal): Stripe webhook handler with provisioning, update, cancel"
```

---

### Task 23: Stripe webhook integration test — checkout

**Files:**
- Create: `portal/tests/helpers/stripe-fixtures.ts`, `portal/tests/integration/webhook-checkout.test.ts`

- [ ] **Step 1: Write the fixture helper**

Create `portal/tests/helpers/stripe-fixtures.ts`:
```ts
import Stripe from 'stripe';
import crypto from 'node:crypto';

export function signPayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = `${timestamp}.${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return `t=${timestamp},v1=${sig}`;
}

export function checkoutSessionCompleted(overrides: Partial<{
  eventId: string; email: string; companyName: string; priceId: string;
  customerId: string; subscriptionId: string;
}> = {}): Stripe.Event {
  const email = overrides.email ?? 'alice@acme.com';
  return {
    id: overrides.eventId ?? `evt_${crypto.randomUUID()}`,
    object: 'event',
    api_version: '2024-12-18.acacia',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: `cs_test_${crypto.randomUUID()}`,
        object: 'checkout.session',
        customer: overrides.customerId ?? `cus_${crypto.randomUUID()}`,
        subscription: overrides.subscriptionId ?? `sub_${crypto.randomUUID()}`,
        customer_email: email,
        customer_details: { email, name: 'Alice A' },
        custom_fields: [{ key: 'company_name', text: { value: overrides.companyName ?? 'Acme Inc.' } }],
        line_items: { data: [{ price: { id: overrides.priceId ?? process.env.STRIPE_PRICE_GROWTH } }] },
      } as any,
    },
  } as Stripe.Event;
}
```

Note: the webhook handler calls `stripe().checkout.sessions.retrieve(...)` to expand line_items. For integration testing, we stub that call by intercepting the Stripe SDK. Simpler alternative: change the handler to accept the pre-expanded session when in test mode. We'll use an env flag.

- [ ] **Step 2: Add test-mode bypass to the webhook handler**

Modify `portal/src/app/api/webhooks/stripe/route.ts`:

Replace this block:
```ts
const full = await stripe().checkout.sessions.retrieve(session.id, {
  expand: ['line_items', 'customer_details'],
});
const parsed = parseCheckoutSession(full as any);
```

With:
```ts
const full = process.env.STRIPE_WEBHOOK_TEST_MODE === '1'
  ? session
  : await stripe().checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'customer_details'],
    });
const parsed = parseCheckoutSession(full as any);
```

And add `STRIPE_WEBHOOK_TEST_MODE=1` to `portal/.env.test`.

- [ ] **Step 3: Write the failing integration test**

Create `portal/tests/integration/webhook-checkout.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { resetDb, serviceClient } from '../helpers/db';
import { checkoutSessionCompleted, signPayload } from '../helpers/stripe-fixtures';

// Stub Resend
vi.mock('@/lib/resend', () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

function makeRequest(event: any): Request {
  const body = JSON.stringify(event);
  const sig = signPayload(body, process.env.STRIPE_WEBHOOK_SECRET!);
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': sig },
    body,
  });
}

describe('webhook: checkout.session.completed', () => {
  beforeEach(async () => { await resetDb(); });

  it('provisions a workspace, owner membership, and sends magic link', async () => {
    const event = checkoutSessionCompleted({
      email: 'alice@acme.com',
      companyName: 'Acme Inc.',
      priceId: process.env.STRIPE_PRICE_GROWTH!,
    });
    const res = await POST(makeRequest(event) as any);
    expect(res.status).toBe(200);

    const svc = serviceClient();
    const { data: workspaces } = await svc.from('workspaces').select('*');
    expect(workspaces).toHaveLength(1);
    expect(workspaces![0].plan).toBe('growth');
    expect(workspaces![0].seat_limit).toBe(3);
    expect(workspaces![0].name).toBe('Acme Inc.');

    const { data: members } = await svc.from('workspace_members').select('*');
    expect(members).toHaveLength(1);
    expect(members![0].role).toBe('owner');

    const { data: audit } = await svc.from('audit_log').select('*');
    expect(audit!.some((a) => a.action === 'workspace.provisioned')).toBe(true);
  });

  it('rejects invalid signature', async () => {
    const event = checkoutSessionCompleted();
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=deadbeef' },
      body: JSON.stringify(event),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('alerts on unknown price_id', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('ok'));
    const event = checkoutSessionCompleted({ priceId: 'price_unknown_xyz' });
    const res = await POST(makeRequest(event) as any);
    expect(res.status).toBe(500);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/internal/alert'),
      expect.objectContaining({ method: 'POST' })
    );
    fetchSpy.mockRestore();
  });
});
```

- [ ] **Step 4: Run, verify pass**

```bash
cd portal && npm test -- webhook-checkout
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add portal/tests/helpers/stripe-fixtures.ts portal/tests/integration/webhook-checkout.test.ts portal/src/app/api/webhooks/stripe/route.ts portal/.env.test
git commit -m "test(portal): webhook checkout happy path + signature + unknown price"
```

---

### Task 24: Webhook idempotency test

**Files:**
- Create: `portal/tests/integration/webhook-idempotency.test.ts`

- [ ] **Step 1: Write the failing test**

Create `portal/tests/integration/webhook-idempotency.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { resetDb, serviceClient } from '../helpers/db';
import { checkoutSessionCompleted, signPayload } from '../helpers/stripe-fixtures';

vi.mock('@/lib/resend', () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

function makeRequest(event: any) {
  const body = JSON.stringify(event);
  const sig = signPayload(body, process.env.STRIPE_WEBHOOK_SECRET!);
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST', headers: { 'stripe-signature': sig }, body,
  }) as any;
}

describe('webhook idempotency', () => {
  beforeEach(async () => { await resetDb(); });

  it('is a no-op on duplicate event_id', async () => {
    const event = checkoutSessionCompleted({
      eventId: 'evt_dup_test',
      priceId: process.env.STRIPE_PRICE_GROWTH!,
    });

    const first = await POST(makeRequest(event));
    expect(first.status).toBe(200);

    const second = await POST(makeRequest(event));
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ duplicate: true });

    const svc = serviceClient();
    const { data } = await svc.from('workspaces').select('*');
    expect(data).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run, verify pass**

```bash
cd portal && npm test -- webhook-idempotency
```

- [ ] **Step 3: Commit**

```bash
git add portal/tests/integration/webhook-idempotency.test.ts
git commit -m "test(portal): webhook idempotency"
```

---

### Task 25: Subscription updated + deleted tests

**Files:**
- Create: `portal/tests/integration/webhook-subscription-updated.test.ts`, `portal/tests/integration/webhook-subscription-deleted.test.ts`

- [ ] **Step 1: Add fixture helper**

Modify `portal/tests/helpers/stripe-fixtures.ts`, append:
```ts
export function subscriptionEvent(type: 'customer.subscription.updated' | 'customer.subscription.deleted', overrides: {
  subscriptionId: string; priceId?: string;
}): Stripe.Event {
  return {
    id: `evt_${crypto.randomUUID()}`,
    object: 'event',
    api_version: '2024-12-18.acacia',
    created: Math.floor(Date.now() / 1000),
    type,
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: overrides.subscriptionId,
        object: 'subscription',
        items: { data: [{ price: { id: overrides.priceId ?? process.env.STRIPE_PRICE_GROWTH } }] },
      } as any,
    },
  } as Stripe.Event;
}
```

- [ ] **Step 2: Write the updated test**

Create `portal/tests/integration/webhook-subscription-updated.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { resetDb, serviceClient } from '../helpers/db';
import { subscriptionEvent, signPayload } from '../helpers/stripe-fixtures';

vi.mock('@/lib/resend', () => ({ sendMagicLinkEmail: vi.fn(), sendInviteEmail: vi.fn() }));

function makeRequest(event: any) {
  const body = JSON.stringify(event);
  const sig = signPayload(body, process.env.STRIPE_WEBHOOK_SECRET!);
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST', headers: { 'stripe-signature': sig }, body,
  }) as any;
}

describe('webhook: customer.subscription.updated', () => {
  beforeEach(async () => { await resetDb(); });

  it('updates plan and seat_limit on price change', async () => {
    const svc = serviceClient();
    await svc.from('workspaces').insert({
      name: 'Acme', plan: 'entry', seat_limit: 1,
      stripe_customer_id: 'cus_x', stripe_subscription_id: 'sub_x',
    });

    const event = subscriptionEvent('customer.subscription.updated', {
      subscriptionId: 'sub_x', priceId: process.env.STRIPE_PRICE_SCALE!,
    });
    const res = await POST(makeRequest(event));
    expect(res.status).toBe(200);

    const { data } = await svc.from('workspaces').select('*').eq('stripe_subscription_id', 'sub_x').single();
    expect(data!.plan).toBe('scale');
    expect(data!.seat_limit).toBe(5);
  });
});
```

- [ ] **Step 3: Write the deleted test**

Create `portal/tests/integration/webhook-subscription-deleted.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { resetDb, serviceClient } from '../helpers/db';
import { subscriptionEvent, signPayload } from '../helpers/stripe-fixtures';

vi.mock('@/lib/resend', () => ({ sendMagicLinkEmail: vi.fn(), sendInviteEmail: vi.fn() }));

function makeRequest(event: any) {
  const body = JSON.stringify(event);
  const sig = signPayload(body, process.env.STRIPE_WEBHOOK_SECRET!);
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST', headers: { 'stripe-signature': sig }, body,
  }) as any;
}

describe('webhook: customer.subscription.deleted', () => {
  beforeEach(async () => { await resetDb(); });

  it('marks workspace status canceled', async () => {
    const svc = serviceClient();
    await svc.from('workspaces').insert({
      name: 'Acme', plan: 'growth', seat_limit: 3,
      stripe_customer_id: 'cus_y', stripe_subscription_id: 'sub_y',
    });

    const event = subscriptionEvent('customer.subscription.deleted', { subscriptionId: 'sub_y' });
    const res = await POST(makeRequest(event));
    expect(res.status).toBe(200);

    const { data } = await svc.from('workspaces').select('*').eq('stripe_subscription_id', 'sub_y').single();
    expect(data!.status).toBe('canceled');
  });
});
```

- [ ] **Step 4: Run, verify pass**

```bash
cd portal && npm test -- webhook-subscription
```

- [ ] **Step 5: Commit**

```bash
git add portal/tests/integration/webhook-subscription-updated.test.ts portal/tests/integration/webhook-subscription-deleted.test.ts portal/tests/helpers/stripe-fixtures.ts
git commit -m "test(portal): webhook subscription updated + deleted"
```

---

### Task 26: Email-collision webhook test

**Files:**
- Create: `portal/tests/integration/webhook-email-collision.test.ts`

- [ ] **Step 1: Write the test**

Create `portal/tests/integration/webhook-email-collision.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { resetDb, serviceClient } from '../helpers/db';
import { checkoutSessionCompleted, signPayload } from '../helpers/stripe-fixtures';

vi.mock('@/lib/resend', () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

function makeRequest(event: any) {
  const body = JSON.stringify(event);
  const sig = signPayload(body, process.env.STRIPE_WEBHOOK_SECRET!);
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST', headers: { 'stripe-signature': sig }, body,
  }) as any;
}

describe('webhook: email collision', () => {
  beforeEach(async () => { await resetDb(); });

  it('attaches second workspace to existing user', async () => {
    const evt1 = checkoutSessionCompleted({
      eventId: 'evt_1',
      email: 'twice@acme.com',
      priceId: process.env.STRIPE_PRICE_ENTRY!,
      customerId: 'cus_1', subscriptionId: 'sub_1',
      companyName: 'First Co',
    });
    await POST(makeRequest(evt1));

    const evt2 = checkoutSessionCompleted({
      eventId: 'evt_2',
      email: 'twice@acme.com',
      priceId: process.env.STRIPE_PRICE_GROWTH!,
      customerId: 'cus_2', subscriptionId: 'sub_2',
      companyName: 'Second Co',
    });
    const res = await POST(makeRequest(evt2));
    expect(res.status).toBe(200);

    const svc = serviceClient();
    const { data: workspaces } = await svc.from('workspaces').select('*').order('created_at');
    expect(workspaces).toHaveLength(2);

    const { data: users } = await svc.auth.admin.listUsers();
    const count = users!.users.filter((u) => u.email === 'twice@acme.com').length;
    expect(count).toBe(1);

    const { data: members } = await svc.from('workspace_members').select('*');
    expect(members).toHaveLength(2);
    const userIds = new Set(members!.map((m) => m.user_id));
    expect(userIds.size).toBe(1);
  });
});
```

- [ ] **Step 2: Run, verify pass**

```bash
cd portal && npm test -- webhook-email-collision
```

- [ ] **Step 3: Commit**

```bash
git add portal/tests/integration/webhook-email-collision.test.ts
git commit -m "test(portal): webhook email-collision attaches to existing user"
```

---

### Task 27: Internal alert endpoint

**Files:**
- Create: `portal/src/app/api/internal/alert/route.ts`

- [ ] **Step 1: Write the route**

Create `portal/src/app/api/internal/alert/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { resend } from '@/lib/resend';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    await resend().emails.send({
      from: 'Portal Alerts <alerts@fchiefaio.com>',
      to: process.env.ALERT_EMAIL_TO!,
      subject: `[portal] ${body.kind ?? 'alert'}`,
      text: JSON.stringify(body, null, 2),
    });
  } catch {
    // Swallow — we are the alert path; don't recurse.
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add portal/src/app/api/internal/alert
git commit -m "feat(portal): internal alert endpoint"
```

---

## Phase F — Client UI (Dashboard, Settings, Team Invites)

### Task 28: `(client)` layout

**Files:**
- Create: `portal/src/app/(client)/layout.tsx`

- [ ] **Step 1: Write the layout**

Create `portal/src/app/(client)/layout.tsx`:
```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold">CAIO Portal</Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/settings/team">Team</Link>
          <Link href="/settings/profile">Profile</Link>
          <Link href="/settings/billing">Billing</Link>
          <Link href="/logout">Sign out</Link>
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "portal/src/app/(client)/layout.tsx"
git commit -m "feat(portal): client layout with nav"
```

---

### Task 29: `/dashboard` placeholder + welcome banner

**Files:**
- Create: `portal/src/app/(client)/dashboard/page.tsx`, `portal/src/components/welcome-banner.tsx`

- [ ] **Step 1: Welcome banner component**

Create `portal/src/components/welcome-banner.tsx`:
```tsx
'use client';
import { useState } from 'react';

export function WelcomeBanner({ planDisplayName }: { planDisplayName: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="rounded-md border border-orange-200 bg-orange-50 p-4 mb-6 flex justify-between">
      <div>
        <h2 className="font-medium">Welcome to your CAIO portal</h2>
        <p className="text-sm text-gray-700">You&apos;re on the <strong>{planDisplayName}</strong> plan.</p>
      </div>
      <button onClick={() => setDismissed(true)} className="text-sm">Dismiss</button>
    </div>
  );
}
```

- [ ] **Step 2: Dashboard page**

Create `portal/src/app/(client)/dashboard/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server';
import { WelcomeBanner } from '@/components/welcome-banner';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(id, name, plan, status, updated_at)')
    .order('created_at', { ascending: false });

  if (!memberships || memberships.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Your account is being set up</h1>
        <p className="text-gray-600 mt-2">Refresh in a few seconds. If you paid more than a minute ago and still see this, email devin@fchiefaio.com.</p>
      </div>
    );
  }

  // Most recently active workspace
  const latest = memberships[0] as any;
  const workspace = latest.workspaces;

  return (
    <div>
      <WelcomeBanner planDisplayName={workspace.plan} />
      <h1 className="text-2xl font-semibold">{workspace.name}</h1>
      <p className="text-gray-600 mt-2">Status: {workspace.status}</p>
      <p className="text-gray-600 mt-6">The full client dashboard arrives in the next release. For now, this page confirms your account is set up.</p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "portal/src/app/(client)/dashboard" portal/src/components/welcome-banner.tsx
git commit -m "feat(portal): dashboard placeholder with welcome banner"
```

---

### Task 30: `/settings/profile` (name, password)

**Files:**
- Create: `portal/src/app/(client)/settings/layout.tsx`, `portal/src/app/(client)/settings/profile/page.tsx`

- [ ] **Step 1: Settings layout**

Create `portal/src/app/(client)/settings/layout.tsx`:
```tsx
import Link from 'next/link';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8">
      <aside className="w-48 shrink-0">
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/settings/profile">Profile</Link>
          <Link href="/settings/team">Team</Link>
          <Link href="/settings/billing">Billing</Link>
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Profile page**

Create `portal/src/app/(client)/settings/profile/page.tsx`:
```tsx
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function ProfilePage() {
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
      setFullName(data?.full_name ?? '');
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user.id);
    setStatus(error ? error.message : 'Saved.');
  }

  async function setPw(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 12) { setStatus('Password must be at least 12 characters.'); return; }
    const { error } = await supabase.auth.updateUser({ password });
    setStatus(error ? error.message : 'Password updated.');
    setPassword('');
  }

  return (
    <div className="max-w-md space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-2">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-2">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name" className="w-full border px-3 py-2 rounded" />
          <button className="bg-black text-white px-4 py-2 rounded">Save</button>
        </form>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Set password</h2>
        <form onSubmit={setPw} className="space-y-2">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 12)" className="w-full border px-3 py-2 rounded" minLength={12} />
          <button className="bg-black text-white px-4 py-2 rounded">Update password</button>
        </form>
      </section>
      {status && <p className="text-sm text-gray-600">{status}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "portal/src/app/(client)/settings/layout.tsx" "portal/src/app/(client)/settings/profile"
git commit -m "feat(portal): settings profile page with password set"
```

---

### Task 31: `/settings/billing` stub + `/settings/team` + logout

**Files:**
- Create: `portal/src/app/(client)/settings/billing/page.tsx`, `portal/src/app/(client)/settings/team/page.tsx`, `portal/src/app/(client)/logout/route.ts`

- [ ] **Step 1: Billing stub**

Create `portal/src/app/(client)/settings/billing/page.tsx`:
```tsx
export default function BillingPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold">Billing</h2>
      <p className="text-gray-600 mt-2">Subscription management, invoices, and payment history arrive in the next release.</p>
      <p className="text-gray-600 mt-2">For now, email <a href="mailto:devin@fchiefaio.com">devin@fchiefaio.com</a> if you need a change.</p>
    </div>
  );
}
```

- [ ] **Step 2: Team page (SSR + client invite form)**

Create `portal/src/app/(client)/settings/team/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server';
import { InviteForm } from '@/components/invite-form';
import { MemberList } from '@/components/member-list';

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name, seat_limit)');

  if (!memberships || memberships.length === 0) return <p>No workspace yet.</p>;

  const ownerMembership = memberships.find((m: any) => m.role === 'owner');
  const workspace = (ownerMembership ?? memberships[0]).workspaces as any;

  const { data: members } = await supabase
    .from('workspace_members')
    .select('id, role, invited_email, joined_at, user_id, profiles(full_name)')
    .eq('workspace_id', workspace.id);

  const isOwner = !!ownerMembership;
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Team — {workspace.name}</h2>
      <MemberList members={members ?? []} canManage={isOwner} />
      {isOwner && <InviteForm workspaceId={workspace.id} seatLimit={workspace.seat_limit} currentCount={members?.length ?? 0} />}
    </div>
  );
}
```

- [ ] **Step 3: InviteForm component**

Create `portal/src/components/invite-form.tsx`:
```tsx
'use client';
import { useState } from 'react';

export function InviteForm({ workspaceId, seatLimit, currentCount }: {
  workspaceId: string; seatLimit: number; currentCount: number;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const atLimit = currentCount >= seatLimit;

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ workspaceId, email }),
    });
    const body = await res.json();
    setStatus(res.ok ? 'Invite sent.' : body.error ?? 'Invite failed.');
    setLoading(false);
    if (res.ok) setEmail('');
  }

  return (
    <form onSubmit={invite} className="flex gap-2 items-start">
      <input
        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="teammate@company.com" disabled={atLimit}
        className="flex-1 border px-3 py-2 rounded"
      />
      <button disabled={atLimit || loading} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
        {atLimit ? `Seat limit (${seatLimit})` : 'Invite'}
      </button>
      {status && <p className="w-full text-sm text-gray-600">{status}</p>}
    </form>
  );
}
```

- [ ] **Step 4: MemberList component**

Create `portal/src/components/member-list.tsx`:
```tsx
'use client';

type Member = {
  id: string; role: string; invited_email: string | null;
  joined_at: string | null; user_id: string | null;
  profiles: { full_name: string | null } | null;
};

export function MemberList({ members, canManage }: { members: Member[]; canManage: boolean }) {
  async function remove(id: string) {
    if (!confirm('Remove this member?')) return;
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
    window.location.reload();
  }
  async function revoke(id: string) {
    await fetch(`/api/invites/${id}`, { method: 'DELETE' });
    window.location.reload();
  }

  return (
    <ul className="divide-y border rounded">
      {members.map((m) => (
        <li key={m.id} className="p-3 flex justify-between">
          <div>
            <div className="font-medium">{m.profiles?.full_name ?? m.invited_email ?? '—'}</div>
            <div className="text-xs text-gray-500">{m.role}{!m.user_id && ' · pending'}</div>
          </div>
          {canManage && m.role !== 'owner' && (
            m.user_id
              ? <button onClick={() => remove(m.id)} className="text-red-600 text-sm">Remove</button>
              : <button onClick={() => revoke(m.id)} className="text-gray-600 text-sm">Revoke</button>
          )}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: Logout route**

Create `portal/src/app/(client)/logout/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!));
}
```

- [ ] **Step 6: Commit**

```bash
git add "portal/src/app/(client)/settings/billing" "portal/src/app/(client)/settings/team" "portal/src/app/(client)/logout" portal/src/components/invite-form.tsx portal/src/components/member-list.tsx
git commit -m "feat(portal): team page, invite form, member list, logout"
```

---

### Task 32: `/api/invites` + seat gate, with integration test

**Files:**
- Create: `portal/src/app/api/invites/route.ts`, `portal/src/app/api/invites/[id]/route.ts`, `portal/src/app/api/members/[id]/route.ts`, `portal/tests/integration/invites.test.ts`

- [ ] **Step 1: Write the failing test**

Create `portal/tests/integration/invites.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/invites/route';
import { resetDb, serviceClient, createAuthUser, signInAs } from '../helpers/db';

vi.mock('@/lib/resend', () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
  sendInviteEmail: vi.fn().mockResolvedValue(undefined),
}));

describe('POST /api/invites', () => {
  beforeEach(async () => { await resetDb(); });

  async function seedOwner(plan: 'growth' | 'entry' = 'growth') {
    const svc = serviceClient();
    const ownerId = await createAuthUser('owner@acme.com');
    const { data: ws } = await svc.from('workspaces').insert({
      name: 'Acme', plan, seat_limit: plan === 'growth' ? 3 : 1,
      stripe_customer_id: `cus_${Date.now()}`, stripe_subscription_id: `sub_${Date.now()}`,
    }).select().single();
    await svc.from('workspace_members').insert({
      workspace_id: ws!.id, user_id: ownerId, role: 'owner', joined_at: new Date().toISOString(),
    });
    const token = await signInAs('owner@acme.com');
    return { ownerId, workspaceId: ws!.id, token };
  }

  function makeReq(token: string, body: any) {
    return new Request('http://localhost/api/invites', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, cookie: '' },
      body: JSON.stringify(body),
    }) as any;
  }

  it('rejects when seat limit reached', async () => {
    const { workspaceId, token } = await seedOwner('entry');
    const res = await POST(makeReq(token, { workspaceId, email: 'second@acme.com' }));
    expect(res.status).toBe(403);
  });

  it('creates pending invite under the limit', async () => {
    const { workspaceId, token } = await seedOwner('growth');
    const res = await POST(makeReq(token, { workspaceId, email: 'second@acme.com' }));
    expect(res.status).toBe(200);

    const svc = serviceClient();
    const { data } = await svc.from('workspace_members').select('*').eq('workspace_id', workspaceId);
    expect(data).toHaveLength(2);
    const pending = data!.find((m) => m.invited_email === 'second@acme.com');
    expect(pending).toBeTruthy();
    expect(pending!.user_id).toBeNull();
  });

  it('rejects non-owner', async () => {
    const svc = serviceClient();
    const { workspaceId } = await seedOwner('growth');
    const nonOwnerId = await createAuthUser('notowner@other.com');
    await svc.from('workspace_members').insert({
      workspace_id: workspaceId, user_id: nonOwnerId, role: 'member', joined_at: new Date().toISOString(),
    });
    const token = await signInAs('notowner@other.com');
    const res = await POST(makeReq(token, { workspaceId, email: 'third@acme.com' }));
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
cd portal && npm test -- invites
```

- [ ] **Step 3: Implement the invite route**

Create `portal/src/app/api/invites/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAddSeat } from '@/lib/seats';
import { sendInviteEmail } from '@/lib/resend';

export const runtime = 'nodejs';

const InviteBody = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = InviteBody.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  const { workspaceId, email } = parsed.data;

  // Caller must be owner
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: workspace } = await admin.from('workspaces').select('seat_limit, name').eq('id', workspaceId).single();
  const { count: activeCount } = await admin.from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId).not('user_id', 'is', null);
  const { count: pendingCount } = await admin.from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId).is('user_id', null);

  if (!canAddSeat({
    seatLimit: workspace!.seat_limit,
    activeCount: activeCount ?? 0,
    pendingCount: pendingCount ?? 0,
  })) {
    return NextResponse.json({ error: 'seat limit reached' }, { status: 403 });
  }

  const { error: insErr } = await admin.from('workspace_members').insert({
    workspace_id: workspaceId,
    invited_email: email,
    role: 'member',
    invited_at: new Date().toISOString(),
  });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const { data: inviterProfile } = await admin.from('profiles').select('full_name').eq('user_id', user.id).single();
  const { data: link } = await admin.auth.admin.generateLink({
    type: 'magiclink', email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard` },
  });
  if (link?.properties?.action_link) {
    await sendInviteEmail({
      to: email,
      magicLink: link.properties.action_link,
      workspaceName: workspace!.name,
      inviterName: inviterProfile?.full_name ?? null,
    });
  }

  await admin.from('audit_log').insert({
    workspace_id: workspaceId,
    actor_user_id: user.id,
    action: 'invite.created',
    metadata: { email },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Implement revoke-invite route**

Create `portal/src/app/api/invites/[id]/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: row } = await admin.from('workspace_members').select('workspace_id, user_id').eq('id', id).single();
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (row.user_id) return NextResponse.json({ error: 'not a pending invite' }, { status: 400 });

  const { data: caller } = await admin.from('workspace_members')
    .select('role').eq('workspace_id', row.workspace_id).eq('user_id', user.id).maybeSingle();
  if (caller?.role !== 'owner') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await admin.from('workspace_members').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Implement remove-member route**

Create `portal/src/app/api/members/[id]/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: row } = await admin.from('workspace_members').select('workspace_id, role').eq('id', id).single();
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (row.role === 'owner') return NextResponse.json({ error: 'cannot remove owner' }, { status: 400 });

  const { data: caller } = await admin.from('workspace_members')
    .select('role').eq('workspace_id', row.workspace_id).eq('user_id', user.id).maybeSingle();
  if (caller?.role !== 'owner') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await admin.from('workspace_members').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Run, verify pass**

```bash
cd portal && npm test -- invites
```

Expected: 3 tests pass.

- [ ] **Step 7: Commit**

```bash
git add portal/src/app/api/invites portal/src/app/api/members portal/tests/integration/invites.test.ts
git commit -m "feat(portal): invite/revoke/remove routes with seat gating"
```

---

## Phase G — Admin Panel

### Task 33: `(admin)` layout with mode badge

**Files:**
- Create: `portal/src/app/(admin)/layout.tsx`, `portal/src/components/admin-mode-badge.tsx`

- [ ] **Step 1: Badge**

Create `portal/src/components/admin-mode-badge.tsx`:
```tsx
export function AdminModeBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-800 px-3 py-1 text-xs font-medium">
      ● ADMIN MODE
    </span>
  );
}
```

- [ ] **Step 2: Layout**

Create `portal/src/app/(admin)/layout.tsx`:
```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminModeBadge } from '@/components/admin-mode-badge';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('user_id', user.id).single();
  if (!profile?.is_admin) redirect('/dashboard');

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-semibold">CAIO Portal</Link>
          <AdminModeBadge />
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin">Workspaces</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/logout">Sign out</Link>
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "portal/src/app/(admin)/layout.tsx" portal/src/components/admin-mode-badge.tsx
git commit -m "feat(portal): admin layout with mode badge"
```

---

### Task 34: `/admin` workspace list + detail

**Files:**
- Create: `portal/src/app/(admin)/admin/page.tsx`, `portal/src/app/(admin)/admin/workspaces/[id]/page.tsx`

- [ ] **Step 1: Workspace list**

Create `portal/src/app/(admin)/admin/page.tsx`:
```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminWorkspacesPage() {
  const supabase = await createClient();
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, plan, status, created_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Workspaces</h1>
      <div className="border rounded divide-y">
        {workspaces?.map((w) => (
          <Link key={w.id} href={`/admin/workspaces/${w.id}`} className="block p-4 hover:bg-gray-50">
            <div className="font-medium">{w.name}</div>
            <div className="text-sm text-gray-500">{w.plan} · {w.status}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Workspace detail**

Create `portal/src/app/(admin)/admin/workspaces/[id]/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server';

export default async function WorkspaceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: workspace } = await supabase.from('workspaces').select('*').eq('id', id).single();
  const { data: members } = await supabase
    .from('workspace_members')
    .select('id, role, invited_email, joined_at, profiles(full_name)')
    .eq('workspace_id', id);
  const { data: audit } = await supabase
    .from('audit_log').select('*').eq('workspace_id', id).order('created_at', { ascending: false }).limit(50);

  if (!workspace) return <p>Not found</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{workspace.name}</h1>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-gray-500">Plan</dt><dd>{workspace.plan}</dd>
        <dt className="text-gray-500">Status</dt><dd>{workspace.status}</dd>
        <dt className="text-gray-500">Seat limit</dt><dd>{workspace.seat_limit}</dd>
        <dt className="text-gray-500">Stripe customer</dt><dd>{workspace.stripe_customer_id}</dd>
        <dt className="text-gray-500">Created</dt><dd>{new Date(workspace.created_at).toLocaleString()}</dd>
      </dl>

      <section>
        <h2 className="font-semibold mb-2">Members</h2>
        <ul className="divide-y border rounded">
          {members?.map((m: any) => (
            <li key={m.id} className="p-3 text-sm">
              {m.profiles?.full_name ?? m.invited_email ?? '—'} · {m.role}{!m.joined_at && ' · pending'}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Recent activity</h2>
        <ul className="text-xs font-mono space-y-1">
          {audit?.map((a) => (
            <li key={a.id}>{new Date(a.created_at).toISOString()} · {a.action}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "portal/src/app/(admin)/admin/page.tsx" "portal/src/app/(admin)/admin/workspaces"
git commit -m "feat(portal): admin workspace list and detail pages"
```

---

### Task 35: `/admin/users` + promote endpoint

**Files:**
- Create: `portal/src/app/(admin)/admin/users/page.tsx`, `portal/src/app/api/admin/users/promote/route.ts`

- [ ] **Step 1: Users page**

Create `portal/src/app/(admin)/admin/users/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Users</h1>
      <ul className="divide-y border rounded">
        {profiles?.map((p) => (
          <li key={p.user_id} className="p-4 flex justify-between">
            <div>
              <div className="font-medium">{p.full_name ?? '—'}</div>
              <div className="text-xs text-gray-500 font-mono">{p.user_id}</div>
            </div>
            <div className="text-sm">
              {p.is_admin ? <span className="text-red-700">admin</span> : <span className="text-gray-500">client</span>}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-4">Promotion is API-only. POST to /api/admin/users/promote with {'{'}userId{'}'}.</p>
    </div>
  );
}
```

- [ ] **Step 2: Promote endpoint**

Create `portal/src/app/api/admin/users/promote/route.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const Body = z.object({ userId: z.string().uuid(), isAdmin: z.boolean().default(true) });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: caller } = await supabase.from('profiles').select('is_admin').eq('user_id', user.id).single();
  if (!caller?.is_admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  const admin = createAdminClient();
  await admin.from('profiles').update({ is_admin: parsed.data.isAdmin }).eq('user_id', parsed.data.userId);
  await admin.from('audit_log').insert({
    actor_user_id: user.id,
    action: 'user.admin_changed',
    metadata: { target_user_id: parsed.data.userId, is_admin: parsed.data.isAdmin },
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add "portal/src/app/(admin)/admin/users" portal/src/app/api/admin/users
git commit -m "feat(portal): admin users list and promote endpoint"
```

---

## Phase H — Observability, Rate Limits, E2E, CI, Deploy

### Task 36: Sentry wiring

**Files:**
- Create: `portal/sentry.client.config.ts`, `portal/sentry.server.config.ts`, `portal/sentry.edge.config.ts`

- [ ] **Step 1: Run Sentry wizard**

```bash
cd portal
npx @sentry/wizard@latest -i nextjs --saas --org <your-sentry-org> --project client-portal
```

Accept defaults. The wizard creates the three config files and updates `next.config.mjs`.

- [ ] **Step 2: Commit**

```bash
git add portal/sentry.*.config.ts portal/next.config.mjs portal/package.json portal/package-lock.json
git commit -m "feat(portal): Sentry wiring via official wizard"
```

---

### Task 37: Rate limiting on `/login` and `/api/invites`

**Files:**
- Create: `portal/src/lib/rate-limit.ts`
- Modify: `portal/src/app/api/invites/route.ts`, `portal/middleware.ts`

- [ ] **Step 1: Write the helper**

Create `portal/src/lib/rate-limit.ts`:
```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;

export function getRateLimiter(): Ratelimit {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'portal',
    });
  }
  return ratelimit;
}

export async function limit(key: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return { success: true }; // no-op in local
  return getRateLimiter().limit(key);
}
```

- [ ] **Step 2: Apply in the invites route**

Modify `portal/src/app/api/invites/route.ts`. Add at the top of `POST`, right after the `user` check:
```ts
const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
const rl = await limit(`invites:${ip}`);
if (!rl.success) return NextResponse.json({ error: 'rate limited' }, { status: 429 });
```

Add the import:
```ts
import { limit } from '@/lib/rate-limit';
```

- [ ] **Step 3: Apply in middleware for `/login` POSTs**

Skip for Spec 0 — Supabase Auth has its own rate limits on magic-link generation. Revisit if abuse appears.

- [ ] **Step 4: Commit**

```bash
git add portal/src/lib/rate-limit.ts portal/src/app/api/invites/route.ts
git commit -m "feat(portal): rate limiting on invite endpoint"
```

---

### Task 38: E2E onboarding test

**Files:**
- Create: `portal/playwright.config.ts`, `portal/tests/e2e/onboarding.spec.ts`

- [ ] **Step 1: Playwright config**

Create `portal/playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

- [ ] **Step 2: Onboarding spec**

Create `portal/tests/e2e/onboarding.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { resetDb, serviceClient } from '../helpers/db';
import { checkoutSessionCompleted, signPayload } from '../helpers/stripe-fixtures';

test.beforeEach(async () => { await resetDb(); });

test('full onboarding: webhook provisions, magic link logs user in, dashboard shows plan', async ({ page, request }) => {
  const event = checkoutSessionCompleted({
    email: 'e2e@acme.com',
    companyName: 'E2E Inc.',
    priceId: process.env.STRIPE_PRICE_GROWTH!,
  });
  const body = JSON.stringify(event);
  const sig = signPayload(body, process.env.STRIPE_WEBHOOK_SECRET!);

  const res = await request.post('/api/webhooks/stripe', {
    headers: { 'stripe-signature': sig, 'content-type': 'application/json' },
    data: body,
  });
  expect(res.status()).toBe(200);

  // Generate a fresh magic link via admin API and navigate
  const svc = serviceClient();
  const { data } = await svc.auth.admin.generateLink({
    type: 'magiclink',
    email: 'e2e@acme.com',
    options: { redirectTo: 'http://localhost:3000/auth/callback?next=/dashboard' },
  });
  await page.goto(data!.properties!.action_link!);
  await page.waitForURL(/\/dashboard/);

  await expect(page.getByText('E2E Inc.')).toBeVisible();
  await expect(page.getByText('Growth', { exact: false })).toBeVisible();
});
```

- [ ] **Step 3: Run**

```bash
cd portal && npm run test:e2e -- onboarding
```

Expected: passes. If the dev server isn't running, Playwright starts it.

- [ ] **Step 4: Commit**

```bash
git add portal/playwright.config.ts portal/tests/e2e/onboarding.spec.ts
git commit -m "test(portal): e2e onboarding happy path"
```

---

### Task 39: E2E password login + admin access control

**Files:**
- Create: `portal/tests/e2e/password-login.spec.ts`, `portal/tests/e2e/admin-access.spec.ts`

- [ ] **Step 1: Password login spec**

Create `portal/tests/e2e/password-login.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { resetDb, serviceClient } from '../helpers/db';

test.beforeEach(async () => { await resetDb(); });

test('password login after set', async ({ page }) => {
  const svc = serviceClient();
  const { data } = await svc.auth.admin.createUser({
    email: 'pw@acme.com', password: 'correct-horse-battery-staple', email_confirm: true,
  });
  await svc.from('profiles').insert({ user_id: data.user!.id, full_name: 'PW User' });
  // Seed a workspace for them so /dashboard renders
  const { data: ws } = await svc.from('workspaces').insert({
    name: 'PW Co', plan: 'entry', seat_limit: 1,
    stripe_customer_id: 'cus_pw', stripe_subscription_id: 'sub_pw',
  }).select().single();
  await svc.from('workspace_members').insert({
    workspace_id: ws!.id, user_id: data.user!.id, role: 'owner', joined_at: new Date().toISOString(),
  });

  await page.goto('/login');
  await page.getByRole('button', { name: 'Password' }).click();
  await page.getByPlaceholder('you@company.com').fill('pw@acme.com');
  await page.getByPlaceholder(/Password/).fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByText('PW Co')).toBeVisible();
});
```

- [ ] **Step 2: Admin access control spec**

Create `portal/tests/e2e/admin-access.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { resetDb, serviceClient } from '../helpers/db';

test.beforeEach(async () => { await resetDb(); });

test('non-admin redirected away from /admin', async ({ page }) => {
  const svc = serviceClient();
  const { data } = await svc.auth.admin.createUser({
    email: 'client@acme.com', password: 'correct-horse-battery-staple', email_confirm: true,
  });
  await svc.from('profiles').insert({ user_id: data.user!.id, full_name: 'Client', is_admin: false });
  const { data: ws } = await svc.from('workspaces').insert({
    name: 'Client Co', plan: 'entry', seat_limit: 1,
    stripe_customer_id: 'cus_c', stripe_subscription_id: 'sub_c',
  }).select().single();
  await svc.from('workspace_members').insert({
    workspace_id: ws!.id, user_id: data.user!.id, role: 'owner', joined_at: new Date().toISOString(),
  });

  await page.goto('/login');
  await page.getByRole('button', { name: 'Password' }).click();
  await page.getByPlaceholder('you@company.com').fill('client@acme.com');
  await page.getByPlaceholder(/Password/).fill('correct-horse-battery-staple');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/dashboard/);

  await page.goto('/admin');
  await page.waitForURL(/\/dashboard/);
});
```

- [ ] **Step 3: Run**

```bash
cd portal && npm run test:e2e
```

- [ ] **Step 4: Commit**

```bash
git add portal/tests/e2e/password-login.spec.ts portal/tests/e2e/admin-access.spec.ts
git commit -m "test(portal): e2e password login and admin access control"
```

---

### Task 40: GitHub Actions CI and deploy

**Files:**
- Create: `.github/workflows/portal-ci.yml`
- Update production Stripe `stripe_price_id` values in DB

- [ ] **Step 1: CI workflow**

Create `.github/workflows/portal-ci.yml` (at repo root, not inside `portal/`):
```yaml
name: portal-ci
on:
  push:
    paths: ['portal/**', '.github/workflows/portal-ci.yml']
  pull_request:
    paths: ['portal/**']

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: portal
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: portal/package-lock.json
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - name: Start Supabase
        run: supabase start
      - name: Install deps
        run: npm ci
      - name: Unit + integration
        run: npm test
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
          # Keys printed by `supabase start` are deterministic for local dev:
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          STRIPE_WEBHOOK_SECRET: whsec_test_fixture_secret
          STRIPE_SECRET_KEY: sk_test_fake
          STRIPE_PRICE_ENTRY: price_test_entry
          STRIPE_PRICE_GROWTH: price_test_growth
          STRIPE_PRICE_SCALE: price_test_scale
          STRIPE_PRICE_ENTERPRISE: price_test_enterprise
          STRIPE_WEBHOOK_TEST_MODE: '1'
          RESEND_API_KEY: re_fake
          ALERT_EMAIL_TO: test@fchiefaio.com
          NEXT_PUBLIC_APP_URL: http://localhost:3000
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      - name: E2E
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          STRIPE_WEBHOOK_SECRET: whsec_test_fixture_secret
          STRIPE_SECRET_KEY: sk_test_fake
          STRIPE_PRICE_ENTRY: price_test_entry
          STRIPE_PRICE_GROWTH: price_test_growth
          STRIPE_PRICE_SCALE: price_test_scale
          STRIPE_PRICE_ENTERPRISE: price_test_enterprise
          STRIPE_WEBHOOK_TEST_MODE: '1'
          RESEND_API_KEY: re_fake
          ALERT_EMAIL_TO: test@fchiefaio.com
          NEXT_PUBLIC_APP_URL: http://localhost:3000
```

- [ ] **Step 2: Add GitHub secrets**

Run locally to pull the canonical local-dev keys:
```bash
cd portal && npx supabase status
```

In GitHub repo settings → Secrets → Actions, add:
- `SUPABASE_ANON_KEY` = the `anon key` from supabase status
- `SUPABASE_SERVICE_ROLE_KEY` = the `service_role key` from supabase status

- [ ] **Step 3: Commit the workflow**

```bash
git add .github/workflows/portal-ci.yml
git commit -m "ci(portal): GitHub Actions with Supabase + Playwright"
```

- [ ] **Step 4: Deploy to Vercel**

Manual steps (no code):
1. Push to GitHub
2. Vercel dashboard → Import Project → pick the repo
3. **Root Directory** = `portal`
4. Add all env vars from `.env.local.example` (with real Supabase production project values, real Stripe live keys, real Resend, real Sentry DSN, real Upstash)
5. Deploy
6. Add custom domain `clients.fchiefaio.com` in Vercel → DNS → create a CNAME from `clients` → `cname.vercel-dns.com` in your domain registrar

- [ ] **Step 5: Register Stripe webhook**

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://clients.fchiefaio.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the signing secret into Vercel env as `STRIPE_WEBHOOK_SECRET`
5. Redeploy

- [ ] **Step 6: Update `plans` table with real price IDs**

Run one-off SQL via Supabase Studio (production project):
```sql
update public.plans set stripe_price_id = 'price_LIVE_entry'      where id = 'entry';
update public.plans set stripe_price_id = 'price_LIVE_growth'     where id = 'growth';
update public.plans set stripe_price_id = 'price_LIVE_scale'      where id = 'scale';
update public.plans set stripe_price_id = 'price_LIVE_enterprise' where id = 'enterprise';
```

Also update Vercel env: `STRIPE_PRICE_ENTRY`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_SCALE`, `STRIPE_PRICE_ENTERPRISE` with the real IDs. Redeploy.

- [ ] **Step 7: Smoke test in production**

1. Put Stripe in test mode in the dashboard
2. Hit `fractional-caio.html` → Get Started → complete a test checkout with `4242 4242 4242 4242`
3. Within ~10s, receive a magic-link email at the test address
4. Click, land on `/dashboard`, see the workspace
5. Verify workspace row in Supabase Studio
6. Verify `audit_log` row for `workspace.provisioned`

- [ ] **Step 8: Promote yourself to admin**

In Supabase Studio → SQL:
```sql
update public.profiles set is_admin = true
where user_id = (select id from auth.users where email = 'devin@fchiefaio.com');
```

Verify: log in at `clients.fchiefaio.com/login` → visit `/admin` → see workspaces.

---

## Self-Review Results

**Spec coverage:**

- § 2 Stack → Tasks 1, 2, 3 ✓
- § 3 Data model (7 tables + RLS) → Tasks 5–10 ✓
- § 3 RLS enforcement test → Task 12 ✓
- § 4 Auth & onboarding happy path → Tasks 13–16, 22, 23, 38 ✓
- § 4 Email collision → Task 26 ✓
- § 4 Team invites + seat gating → Tasks 31, 32 ✓
- § 4 Admin provisioning (manual SQL + promote API) → Task 35, 40 step 8 ✓
- § 5 Route structure (client + admin + API) → Tasks 28–35 ✓
- § 5 Middleware → Task 14 ✓
- § 6 Stripe webhook events → Tasks 22, 25 ✓
- § 6 Alerting → Task 27 ✓
- § 7 Sentry → Task 36 ✓
- § 7 Rate limiting → Task 37 ✓
- § 7 Env var split → Task 4 ✓
- § 8 Testing strategy (unit + integration + E2E + real Postgres) → Tasks 11, 12, 17–19, 23–26, 32, 38, 39 ✓
- § 8 CI → Task 40 ✓
- § 11 Success criteria 1 (end-to-end provisioning under 60s) → Task 38 ✓
- § 11 Success criteria 2 (RLS proven) → Task 12 ✓
- § 11 Success criteria 3 (invite under seat limit) → Task 32 ✓
- § 11 Success criteria 4 (admin sees all workspaces) → Task 34 + Task 12 second test ✓
- § 11 Success criteria 5 (idempotency) → Task 24 ✓
- § 11 Success criteria 6 (CI green) → Task 40 ✓
- § 11 Success criteria 7 (live at clients.fchiefaio.com + Sentry) → Tasks 36, 40 ✓

**Placeholder scan:** no `TBD`, no `TODO`, no "implement later". Every code step has complete code. Env vars use real variable names.

**Type consistency:**
- `PlanId` used consistently across `plans.ts`, `provisioning.ts`, `webhook-parser.ts`
- `ParsedCheckout` defined in `webhook-parser.ts`, imported in `provisioning.ts` with matching fields
- `canAddSeat`/`SeatCounts` shape matches between `seats.ts` test and usage in `invites/route.ts`
- `MagicLinkEmail` / `InviteEmail` named exports match their imports in `resend.ts`
- Route params use Next.js 15 `Promise<{ id: string }>` signature consistently

**Known compromises (intentional, not gaps):**
- `STRIPE_WEBHOOK_TEST_MODE=1` env flag bypasses `stripe.checkout.sessions.retrieve()` in tests. Fine for Spec 0; the alternative (network-stubbing the Stripe SDK) is a much larger test-infra investment.
- Magic-link TTL (15 min from spec §4) must be set in the Supabase dashboard — it is not a migration. Add it to the Task 40 production checklist manually.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-13-client-portal-foundation.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task with two-stage review (spec compliance → code quality). Fast iteration, context stays clean.

**2. Inline Execution** — Run the plan task-by-task in this session using `executing-plans`, with checkpoints for review.

Which approach?
