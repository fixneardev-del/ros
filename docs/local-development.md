# Local Development

How to run the whole marketplace on this machine, and the sign-in details for
each role.

## Requirements

- Node.js and npm
- PostgreSQL client tools (`psql`, `initdb`, `pg_ctl`)
- No Docker required

Docker Desktop is not installed here, so `npx supabase start` cannot run.
`scripts/local-supabase.sh` starts the same services directly: Postgres,
GoTrue (the auth API) and PostgREST (the REST API), with a small gateway in
front of them so the app uses one URL exactly as it does in production.

## Start everything

```bash
# 1. Download the binaries, start the services and load the schema and seed.
scripts/local-supabase.sh start

# 2. Put the values it prints into .env.local.
scripts/local-supabase.sh url

# 3. Optional: add sample providers, jobs and offers.
scripts/local-demo-data.sh

# 4. Start the app.
npm run dev
```

The app runs at <http://localhost:3001>.

To stop the services:

```bash
scripts/local-supabase.sh stop
```

### Where the data lives

The local stack and the RLS scratch database live outside the operating
system's temporary folder, because macOS purges that folder in the background
and takes a running database with it.

| What | Where |
|---|---|
| Local Supabase stack | `~/.local/share/repairs-and-other-services/local-supabase` |
| RLS scratch database | `~/.local/share/repairs-and-other-services/rls-postgres` |

Set `STACK_ROOT` or `PGROOT` to put them somewhere else.

### Ports

| Service | Port |
|---|---|
| Gateway (the `NEXT_PUBLIC_SUPABASE_URL`) | 54321 |
| PostgREST | 54322 |
| GoTrue (auth API) | 9999 |
| Postgres | 55433 |
| Next.js dev server | 3001 |

## Sign-in details

All local accounts use the password `password123`.

| Email | Role | Notes |
|---|---|---|
| `admin@example.com` | Site owner (admin) | Full admin area |
| `customer@example.com` | Customer | Has two jobs, one with an offer |
| `provider@example.com` | Approved provider | Has services in G12 and G11 |
| `pending@example.com` | Approved provider | Added during the admin review test |
| `callum@example.com` | Customer | Added as a second customer |

Sign in at <http://localhost:3001/login>.

The first admin is the account whose email is `ADMIN_NOTIFICATION_EMAIL`. The
local stack sets it to `admin@example.com` and promotes that profile to the
admin role.

## Dashboard URLs

| Link | What it is |
|---|---|
| <http://localhost:3001/admin> | Admin overview with the KPI strip |
| <http://localhost:3001/admin/providers> | Provider review queue |
| <http://localhost:3001/admin/jobs> | Job moderation |
| <http://localhost:3001/admin/offers> | Offer moderation |
| <http://localhost:3001/admin/categories> | Service categories |
| <http://localhost:3001/admin/pilot-area> | Pilot districts |
| <http://localhost:3001/admin/users> | Users and roles |
| <http://localhost:3001/admin/reports> | Reports |
| <http://localhost:3001/admin/analytics> | Analytics, cookie free |
| <http://localhost:3001/jobs> | Customer jobs with KPI cards |
| <http://localhost:3001/account> | Customer account and profile card |
| <http://localhost:3001/post-job> | Post a job |
| <http://localhost:3001/provide> | Provider dashboard |
| <http://localhost:3001/provide/jobs> | Matching jobs |
| <http://localhost:3001/provide/offers> | Offers the provider sent |
| <http://localhost:3001/provide/apply> | Provider application |

A provider detail page looks like
`/admin/providers/<user-id>`. The local accounts' ids are in `auth.users`.

## Email

There is no Resend key locally, so emails are not sent. The delivery outbox in
`notification_deliveries` still records every trigger, which is how the event
layer is checked.

## The hosted project

The hosted project is `eohqgkxnjshnzwadglnh`. Its publishable key is in
`.env.local.hosted.example`. The database is empty, so the schema has to be
applied before the app can use it:

```bash
scripts/hosted-setup.sh <database-password>
```

That applies `supabase/migrations/0001_init.sql` and `supabase/seed.sql`.
Demo accounts are opt-in in a non-production environment:

```bash
ALLOW_DEMO_ACCOUNTS=1 scripts/hosted-setup.sh <database-password> --with-demo-accounts
```

The server-only key is needed as well, for the admin approve, reject and
suspend actions and the notification outbox. It is `SUPABASE_SECRET_KEY`
(the older `SUPABASE_SERVICE_ROLE_KEY` still works).

## Tests

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
npm run test:rls
```

The RLS suite runs against a throwaway Postgres:

```bash
scripts/local-postgres.sh reset
SUPABASE_DB_URL="postgresql://postgres@127.0.0.1:55432/app" npm run test:rls
```

Playwright 1.65 cannot install its own browser on this machine, so the local
run points at an existing Chromium build:

```bash
export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$HOME/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell"
npm run test:e2e
```
