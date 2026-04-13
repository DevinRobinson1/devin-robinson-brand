# Client Portal — Spec 0: Foundation

**Date:** 2026-04-13
**Status:** Draft — awaiting user review
**Owner:** Devin Robinson
**Project:** Fractional CAIO Client Portal (`clients.fchiefaio.com`)

---

## 1. Context & Goals

Devin Robinson runs a Fractional CAIO consulting practice with four recurring tiers: Entry Retainer ($2,500/mo), Growth CAIO ($3,500/mo), Scale CAIO ($5,000/mo), Enterprise CAIO (custom). Today the business is a static marketing site on Netlify with no backend. Clients are onboarded manually and there is no central system for intake surveys, project status, billing transparency, team logins, or deliverables.

The client portal will fix this in staged releases. **This spec covers Spec 0 — the Foundation layer only.** It is the plumbing every later spec depends on. When Spec 0 ships, paying a CAIO tier automatically provisions a client workspace and emails the client a login. Nothing else is in scope here.

**Later specs (not part of this document):**
- Spec 1: Status dashboard (projects, milestones, activity feed)
- Spec 2: Intake & surveys
- Spec 3: Full billing UI + Stripe Customer Portal embed
- Spec 4: Document / asset hub

### Goals for Spec 0

1. A paying CAIO client can log in to `clients.fchiefaio.com` within 60 seconds of Stripe checkout completing, with zero manual steps from Devin.
2. Devin and his ops team can log in to an admin area and view every workspace.
3. Client data is isolated at the database level (Row-Level Security), not the application level.
4. The system is testable end-to-end locally and in CI against a real Postgres.

### Non-goals for Spec 0

- Project/status UI (Spec 1)
- Survey collection (Spec 2)
- Stripe Customer Portal embed, invoice history UI, dunning (Spec 3)
- File storage UI (Spec 4)
- 2FA, SSO, SAML, GDPR tooling, audit log UI

---

## 2. Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Unified FE/BE, Vercel-native, server actions |
| Database + Auth + Storage | Supabase (Pro plan) | Postgres with RLS, Auth, Storage, Realtime in one service; branching for PR previews |
| Payments | Stripe (already live with CAIO products) | Subscriptions, Customer Portal, webhooks |
| Hosting | Vercel | First-class Next.js deploy; marketing site stays on Netlify |
| Transactional email | Resend | Branded magic-link and invite emails |
| Error tracking | Sentry | Free tier adequate for current scale |
| Testing | Vitest + Playwright + Supabase local stack | Real Postgres, no DB mocks |

### Domains

- `fchiefaio.com` — marketing, stays on Netlify
- `clients.fchiefaio.com` — the portal, Vercel deployment, pointed via CNAME

---

## 3. Data Model

Seven tables. All tenant-scoped tables carry `workspace_id` and RLS policies.

```
workspaces
  id                       uuid pk
  name                     text                 -- company name from Stripe checkout
  plan                     enum(entry|growth|scale|enterprise)
  seat_limit               int                  -- denormalized: 1|3|5|999
  stripe_customer_id       text unique
  stripe_subscription_id   text
  status                   enum(active|past_due|canceled|paused)
  created_at, updated_at

workspace_members
  id                       uuid pk
  workspace_id             fk -> workspaces
  user_id                  fk -> auth.users  (nullable until invite accepted)
  role                     enum(owner|member)
  invited_email            text                 -- set before user accepts invite
  invited_at, joined_at
  unique(workspace_id, user_id)

profiles                                            -- 1:1 with auth.users
  user_id                  pk, fk -> auth.users
  full_name                text
  avatar_url               text
  is_admin                 bool default false   -- flipped via SQL for Devin + ops
  created_at

plans                                               -- static lookup, seeded once
  id                       enum pk (entry|growth|scale|enterprise)
  display_name             text
  monthly_price_cents      int
  seat_limit               int
  stripe_price_id          text                 -- maps checkout line_item -> plan

webhook_events                                      -- Stripe idempotency log
  stripe_event_id          text pk
  type                     text
  payload                  jsonb
  processed_at             timestamptz

audit_log
  id                       uuid pk
  workspace_id             fk -> workspaces (nullable for admin-level events)
  actor_user_id            fk -> auth.users (nullable for system events)
  action                   text
  metadata                 jsonb
  created_at               timestamptz
```

### RLS policies

Default **DENY** on every table. Explicit policies below.

- **workspaces, workspace_members, audit_log**
  - `SELECT`: user is a member of the row's `workspace_id` **OR** `profiles.is_admin = true`
  - `INSERT/UPDATE/DELETE`: service role only (all mutations go through API routes)
- **profiles**
  - `SELECT`: `user_id = auth.uid()` **OR** `is_admin = true`
  - `UPDATE`: `user_id = auth.uid()` (users can edit their own profile); `is_admin` column is NOT updatable from client
- **plans**: world-readable (public SELECT); no client writes
- **webhook_events**: service role only, never exposed

### Denormalization note

`workspaces.plan` and `workspaces.seat_limit` duplicate data available via join on `plans`. This is intentional — RLS policies check seat count without a join, and subscription updates are rare enough that drift risk is negligible. The webhook handler is the single source of truth that keeps them in sync.

---

## 4. Auth & Onboarding Flow

### Happy path (automated provisioning)

1. Prospect clicks "Get Started" on a tier on `fractional-caio.html`
2. Redirected to Stripe Checkout (hosted). Stripe collects email, name, card, and a custom field: **Company Name**
3. Payment succeeds. Stripe fires `checkout.session.completed`
4. `POST /api/webhooks/stripe` handler runs:
   1. Verifies signature against `STRIPE_WEBHOOK_SECRET`
   2. Checks `webhook_events` for `event.id` — if present, returns 200 immediately
   3. Looks up `plans` row by `stripe_price_id`
   4. In a single transaction:
      - `INSERT webhook_events` (pending)
      - `INSERT workspaces` (name, plan, seat_limit, stripe_*, status=active)
      - Create `auth.users` via Supabase Admin API (service role key)
         - If email already exists, link to existing user (email-collision case, see §4.3)
      - `INSERT profiles` with full_name from `session.customer_details.name`
      - `INSERT workspace_members` (role=owner, joined_at=NOW)
      - `INSERT audit_log` (action='workspace.provisioned')
      - `UPDATE webhook_events SET processed_at = NOW()`
   5. Calls `supabase.auth.admin.generateLink({ type: 'magiclink', email })`
   6. Sends the link via Resend using a branded template
   7. Returns 200
5. Client clicks magic link in email → `/auth/callback` → session set → `/dashboard`
6. First time on `/dashboard`: dismissible banner reads "Welcome, you're on the {plan} plan."

### Auth options after first login

- **Magic link** remains always available from `/login`
- **Password** can be set from `/settings/profile`. Once set, either magic link or password works. Min 12 characters; Supabase handles hashing and rate limiting.
- No 2FA in Spec 0.
- Magic link TTL: **15 minutes** (tightened from Supabase's 60-minute default).

### Email-collision case

Supabase Auth allows one user per email. If the same email appears on a second Stripe checkout (returning client, multi-company buyer), the webhook attaches a new `workspace` to the existing `auth.users` row. The user will then belong to more than one workspace.

**For Spec 0**, we do not build a workspace switcher UI. The dashboard shows the **most recently active** workspace for the user (highest `updated_at` among their memberships). If this edge case materializes in production, we add a switcher in a follow-up (expected <1 day of work).

### Team member invites

Available on Growth (3 seats), Scale (5 seats), Enterprise (unlimited).

- Owner visits `/settings/team`, enters an email, clicks Invite
- Server validates: active member count + pending invites < `seat_limit`
- On success: `INSERT workspace_members` with `invited_email` set, `user_id` null
- Resend sends a branded invite email with a magic link
- On first login, a server-side callback links `user_id` to the pending `workspace_members` row by matching email
- Owners can revoke pending invites or remove active members from the same page
- Only owners (not members) can invite. Only Devin is involved if a client emails asking for help.

### Admin provisioning

- Devin signs up via magic link once (Stripe webhook is not triggered for him)
- One-off SQL: `UPDATE profiles SET is_admin = true WHERE user_id = '<devin-uuid>'`
- Promotes ops team members the same way
- Admin promotion UI is **not** in Spec 0 — a simple `/api/admin/users` endpoint with `promote` action is, so it can be scripted

---

## 5. Route Structure

```
clients.fchiefaio.com/
├── /                           → session-aware redirect (login|dashboard|admin)
├── /login                      → email input, magic link OR password
├── /auth/callback              → Supabase magic-link landing
│
├── (client)/                   [middleware: session required; workspace membership checked per-page]
│   ├── /dashboard              → placeholder in Spec 0; first-login welcome banner
│   ├── /settings/profile       → name, avatar, set/change password
│   ├── /settings/team          → list, invite (seat-gated), revoke, remove
│   ├── /settings/billing       → stub: "Manage your subscription in Stripe" link; real in Spec 3
│   └── /logout
│
├── (admin)/                    [middleware: session + profiles.is_admin]
│   ├── /admin                  → workspace list + search
│   ├── /admin/workspaces/[id]  → workspace detail: members, plan, status, audit log
│   └── /admin/users            → user list + promote action (POST to API)
│
└── /api/
    ├── /webhooks/stripe        → POST, signature-verified
    ├── /invites                → POST (create), DELETE (revoke) — owner only
    ├── /members/[id]           → DELETE (remove member) — owner only
    └── /admin/users/promote    → POST — existing admin only
```

### Middleware

`middleware.ts` runs on every non-static request:

1. Refresh Supabase session via `@supabase/ssr`
2. Routes in `(client)` or `(admin)` without a session → redirect to `/login?next=<path>`
3. Routes in `(admin)` without `profiles.is_admin` → redirect to `/dashboard`
4. Workspace membership is **not** enforced in middleware — it is checked inside `/dashboard` and `/settings/*` page components. A user with no workspace and no admin flag sees a "Your account is being set up — refresh in a few seconds" state on `/dashboard`. This avoids a redirect loop for clients whose magic link arrives a few ms before the webhook transaction commits.
5. Webhook and `/auth/callback` bypass middleware

The `(admin)` layout renders a persistent "Admin Mode" badge in the header so Devin always knows he is in god mode.

---

## 6. Stripe Webhook — Events Handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Provision workspace, owner user, send magic link |
| `customer.subscription.updated` | Update `workspaces.plan` + `seat_limit` if price changed |
| `customer.subscription.deleted` | Set `workspaces.status = 'canceled'` |

Events related to dunning, payment failures, and invoice lifecycle are **not** handled in Spec 0 — they belong to Spec 3. If Stripe sends them, we log to `webhook_events` and return 200 without side effects.

### Failure modes

| Failure | Handling |
|---|---|
| Invalid signature | 400, log, no retry |
| Transaction failure mid-flight | Rollback, return 500, Stripe retries for up to 3 days |
| Email collision | Link new workspace to existing user, succeed |
| Resend email failure | Log, return 200 (state is correct; owner can request new link at `/login`) |
| Unknown `price_id` | 500 + alert Devin via Resend email; workspace not created |
| Duplicate event | Idempotency check returns 200 instantly |

### Alerting

One minimal endpoint: `/api/internal/alert` sends an email to Devin via Resend on any webhook 5xx or unknown `price_id`. Slack/PagerDuty escalation is deferred.

---

## 7. Error Handling, Observability, Security

### Error handling
- All API routes wrapped in `withErrorHandler`: catch → log to console + Sentry → return sanitized 500
- Client-facing errors use `sonner` toasts; never show stack traces to clients

### Observability
- **Sentry** for error tracking (free tier)
- **Vercel Analytics** for page views and Core Web Vitals
- `audit_log` table is the breadcrumb trail; raw SQL access only in Spec 0

### Security
- **RLS on every tenant-scoped table**, default deny
- **Service role key** never touches the browser; only in API routes and webhook
- **Env split**: `NEXT_PUBLIC_*` (Supabase anon key, Stripe publishable key) vs. server-only (service role, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `SENTRY_DSN`)
- **Rate limiting** on `/login` and `/api/invites`: Upstash Redis + `@upstash/ratelimit`, 5 req/min per IP
- **CSRF**: Next.js server actions have built-in protection; API routes use SameSite=Lax session cookies
- **Webhook replay protection**: `webhook_events` idempotency table
- **Magic link TTL**: 15 minutes

---

## 8. Testing Strategy

Real Postgres, no DB mocks. Per the Superpowers TDD skill, tests that lie about DB behavior are worse than no tests.

### Layers

**Unit tests** (Vitest, no DB)
- Plan lookup, seat math, webhook payload parser, email fallback logic

**Integration tests** (Vitest + Supabase local stack)
- Webhook handler end-to-end: signed payload in → workspace/user/member rows out, audit log written, event marked processed
- **RLS enforcement**: create two workspaces, authenticate as user A, assert SELECT on workspace B returns zero rows
- Invite flow: over seat limit → 403; under limit → row created, email queued
- Idempotency: POST same event twice → second is a no-op
- Email collision: two checkouts with same email → second attaches to existing user

**E2E tests** (Playwright, 3–5 critical paths only)
- Full onboarding: Stripe CLI fires checkout event → magic link arrives in Mailpit → click → `/dashboard` with correct plan
- Password login: set password → log out → log in → `/dashboard`
- Admin access control: non-admin hits `/admin` → redirected to `/dashboard`

### Not tested
- UI snapshots (brittle, low value)
- Third-party internals (we don't test that Stripe sends webhooks)
- Every component in isolation — test behavior, not implementation

### CI

GitHub Actions on push:
1. `supabase start` in the runner
2. Run migrations
3. Unit + integration tests
4. Playwright E2E
5. On PR: Vercel preview deploy + Supabase branch for the PR's ephemeral DB

---

## 9. Environment Variables

| Name | Scope | Source |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client | Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Supabase project — never exposed |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | client | Stripe dashboard |
| `STRIPE_SECRET_KEY` | server | Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | server | Stripe CLI / dashboard |
| `RESEND_API_KEY` | server | Resend dashboard |
| `SENTRY_DSN` | server | Sentry project |
| `UPSTASH_REDIS_REST_URL` | server | Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | server | Upstash |
| `NEXT_PUBLIC_APP_URL` | client | `https://clients.fchiefaio.com` |

---

## 10. Out of Scope (Explicitly Deferred)

- Project/status UI → Spec 1
- Survey collection and response storage → Spec 2
- Stripe Customer Portal embed, invoice history UI, dunning → Spec 3
- File storage UI → Spec 4
- 2FA / TOTP
- SSO / SAML / SCIM
- Workspace switcher UI (added when email-collision case materializes)
- Admin UI for promoting users
- Audit log UI (raw SQL access only)
- GDPR export / "delete my account"

---

## 11. Success Criteria

Spec 0 is done when **all** of the following are true:

1. A new CAIO purchase on Stripe test mode provisions a workspace and delivers a magic-link email to the buyer within 60 seconds, verified in an end-to-end Playwright test
2. RLS tests prove a client cannot read another client's data
3. An owner can invite a team member up to the plan's seat limit, and the invitee can log in and see the workspace
4. Devin, marked `is_admin=true`, can log in and view all workspaces at `/admin`
5. Webhook handler is idempotent under Stripe's retry behavior
6. CI (GitHub Actions) passes unit, integration, and E2E tests against a real Supabase Postgres
7. The portal is live at `clients.fchiefaio.com` with Sentry wired up

---

## 12. Open Questions

None at time of writing. Locked decisions:
- Stack: Next.js + Supabase + Stripe + Vercel + Resend + Sentry (Approach 1)
- Workspace model: hybrid — seats included by tier (1/3/5/∞)
- Admin model: Devin + ops team, full access across all workspaces
- Onboarding: fully automated via Stripe webhook + magic link
- Auth: magic link always available; password optional after first login
- Invites: owner-driven
- Email-collision: attach to existing user, switcher deferred
- Unknown price_id: email alert to Devin
