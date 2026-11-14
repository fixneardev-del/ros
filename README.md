# Repairs and Other Services

A Glasgow West End local services marketplace. Customers post repair and service jobs; approved independent providers send offers; contact details are released only when an offer is accepted.

This is a pilot build. Payments, commission, live chat, SMS, maps, booking calendars, identity-verification APIs, reviews, subscriptions and AI matching are out of scope.

## Stack

- Next.js 16.4.5 App Router, React 19.3.0, TypeScript strict
- Tailwind CSS 4 with custom design tokens
- Supabase (Postgres, Auth, Storage, RLS)
- Resend for transactional email
- Vercel for hosting
- Vitest for unit tests, Playwright for end-to-end tests

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

The app builds and renders public pages without Supabase credentials. Auth, database-backed pages and admin tools need a configured Supabase project.

## Environment

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used in emails and auth redirects |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for admin operations and notifications |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | Sender shown on transactional email |
| `ADMIN_NOTIFICATION_EMAIL` | Admin contact and notification address |
| `CRON_SECRET` | Optional secret for the notification retry endpoint |

Never expose the service-role key to the browser.

## Database

The schema lives in `supabase/migrations/0001_init.sql`. It creates the tables, indexes, helper functions, triggers, RLS policies, RPCs and storage buckets. Starter categories, pilot districts and site settings are in `supabase/seed.sql`.

```bash
npx supabase start
npx supabase db reset
```

The first admin must be promoted server-side. The owner is the account whose email is `ADMIN_NOTIFICATION_EMAIL`. The profile trigger creates customer profiles automatically, so promote with SQL that bypasses the trigger or use the service role.

### Running without Docker

Docker Desktop is not required. `scripts/local-supabase.sh` runs Postgres, GoTrue and PostgREST as local processes, and a small gateway serves them from one URL the way Supabase's Kong does.

```bash
scripts/local-supabase.sh start      # download, start and load the schema
scripts/local-supabase.sh url        # print the values for .env.local
scripts/local-supabase.sh stop
scripts/local-demo-data.sh           # optional sample providers, jobs and offers
```

The script creates three accounts with the password `password123`: `admin@example.com` (the site owner), `customer@example.com` and `provider@example.com`. `docs/local-development.md` has the full list, the dashboard links and the hosted-project steps.

To use a hosted project instead, apply the schema and create the accounts with the database password:

```bash
scripts/hosted-setup.sh <database-password>
```

## RLS tests

The access rules live in Postgres, so the suite is plain SQL in `tests/rls/`. It runs every file in one transaction and rolls back, so the database is left untouched.

```bash
npm run test:rls
```

The runner never skips. If the database is unreachable the command fails. Point it at a database with `SUPABASE_DB_URL`, or with `SUPABASE_DB_HOST`, `SUPABASE_DB_PORT`, `SUPABASE_DB_NAME` and `SUPABASE_DB_PASSWORD`. It defaults to the local Supabase instance on port 54322.

The suite covers profile creation, role and suspension protection, provider application, approval and withdrawal, job visibility by district and service, offer permissions, offer acceptance, and contact release only after acceptance.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript without emitting |
| `npm test` | Vitest unit tests |
| `npm run test:unit` | Vitest unit tests only |
| `npm run test:coverage` | Unit tests with branch coverage |
| `npm run test:rls` | RLS suite in `tests/rls/` (needs a database) |
| `npm run test:e2e` | Playwright tests |

## Architecture

- Reads happen in Server Components. Writes happen only in Server Actions.
- Authorisation is enforced in the action and again in RLS.
- Actions return a typed `ActionResult`; forms use `useActionState` where typed feedback is needed.
- Notifications use a non-blocking outbox. A failed email never fails the action that triggered it.
- Money is stored as integer pence. A null price means "Quote on inspection".
- Status transitions live in `lib/transitions.ts` and are enforced in SQL triggers.
- Pilot coverage is by enabled postcode district, not distance or maps.
- Contact details are released only after an offer is accepted, through a Postgres RPC.

## Project documents

| Document | What it covers |
|---|---|
| `SPEC.md` | Product and technical specification |
| `CAPABILITY-MAP.md` | Modules and dependency direction |
| `tasks/plan.md` | 69-task delivery plan |
| `tasks/todo.md` | Task checklist and current gate |
| `docs/admin-guide.md` | How to run the pilot without touching the database |
| `docs/local-development.md` | Running the whole stack locally and the sign-in details for each role |
| `docs/manual-test-script.md` | The acceptance run for features 01 to 11 |
| `docs/handover.md` | Third party accounts, environment and deployment |
| `.context/progress.md` | Current state, decisions, risks and log |
| `.context/` | Client requirements, design system and master build prompt |
| `DECISIONS.md` | Why the build looks the way it does |

## Admin

Admin routes live under `/admin` and need an account with the `admin` role. A
signed-in non-admin gets a 403; an anonymous visitor is sent to sign in first.
The first admin is promoted with one SQL update, covered in
`docs/admin-guide.md`.

## Status

Foundation, discovery, provider onboarding, marketplace, admin, notification,
legal and analytics code is in place. Lint, typecheck, unit tests, the production
build, the RLS suite, the public Playwright suite and mobile Lighthouse pass.
Live Supabase/Resend flows, the two-account marketplace flow, signed-in admin
E2E, a git remote and final legal copy are still pending. See
`.context/progress.md` for the current gate and blockers.
# ros
# ros
