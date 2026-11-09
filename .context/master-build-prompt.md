# Master build prompt: Repairs and Other Services MVP

Paste everything below the line into Claude Code (or Cursor, Windsurf, etc.) at the root of an empty repository. Attach `design-system.md` and the `core-features/` folder to the project so the assistant can read them. Build in the phases at the end, one phase per session, and run the checks after each.

---

## Role and goal

You are a senior full-stack engineer. Build a production-quality MVP of **Repairs and Other Services**, a local community services marketplace piloting in Glasgow's West End and selected university communities. Customers search for services by category and postcode, view approved providers, and post jobs. Individuals, sole traders and businesses apply to become providers, build a profile with photos, and send offers on jobs. An admin approves providers and moderates content.

Work autonomously, but follow the scope rules below exactly. If a requirement is ambiguous, choose the simplest option, record it in `DECISIONS.md`, and continue.

## Scope rules

**In scope:** everything in this prompt.

**Out of scope (do not build, do not stub UI for):** payments, commissions, live chat or messaging, SMS, maps or GPS distance, booking calendars, identity verification APIs, reviews and ratings, subscriptions, AI matching, mobile apps, multi-admin role hierarchy, social login, two-factor authentication.

Contact details are shared only after a customer accepts an offer. The platform never claims providers are verified, qualified or insured.

## Stack

- Next.js (App Router), React, TypeScript (strict)
- Tailwind CSS and shadcn/ui, styled per `design-system.md` (tokens as CSS variables, fonts Archivo and Atkinson Hyperlegible Next)
- Supabase: Postgres, Auth, Storage, Row Level Security. Use `@supabase/ssr`
- Zod for validation (shared between client and server), React Hook Form for forms
- Resend for transactional email (react-email templates)
- Vercel hosting, GitHub for source
- Vitest for unit tests, Playwright for end-to-end tests
- Do not add other dependencies without recording why in `DECISIONS.md`

## Architecture rules

1. **Reads** happen in Server Components using the server Supabase client. Pass data down as props.
2. **Writes** happen only in Server Actions (`app/**/actions.ts`). Every action: authenticate, authorise by role and ownership, validate with Zod, execute, emit domain events, revalidate paths, return a typed `ActionResult`.
3. **Client state** is local only: form state (React Hook Form), UI state (dialogs, drawers, step index) with `useState`/`useReducer`, and URL search params for search filters and admin table filters. No global store, no client-side data fetching library.
4. **Authorisation is enforced twice:** in the Server Action and again by Row Level Security. Never rely on hiding UI.
5. **Never trust the client:** recompute postcode district, status transitions and ownership on the server.
6. **No secrets in the client.** Service role key is used only in server-only modules (`lib/supabase/admin.ts`) and only for system tasks such as sending notifications.

```ts
// lib/actions/result.ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };
```

Error messages follow the design system voice: say what went wrong and how to fix it, no apologies.

## Roles

| Role | How assigned | Capabilities |
|---|---|---|
| `customer` | Default on sign-up | Post and manage own jobs, view offers on own jobs, accept/decline offers |
| `provider` | Becomes provider on submitting an application (`provider_status = pending`). Gains provider powers only when `approved` | Manage own profile, services, photos; view open matching jobs; send, edit, withdraw offers |
| `admin` | Set manually in the database | Everything below in the admin area |

A user can be both a customer and a provider. Store one `role` for admin versus non-admin and a separate provider status.

## Data model (Supabase migration)

Create `supabase/migrations/0001_init.sql` with the following. Add indexes on foreign keys and on `job_requests(status, postcode_district)`, `provider_profiles(status)`, and `provider_services(category_id)`.

```sql
create type app_role as enum ('user', 'admin');
create type provider_type as enum ('individual', 'sole_trader', 'business');
create type provider_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type job_status as enum ('open', 'receiving_offers', 'closed', 'removed');
create type offer_status as enum ('submitted', 'accepted', 'declined', 'withdrawn');
create type report_status as enum ('open', 'reviewed', 'dismissed');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'user',
  full_name text not null,
  phone text,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table service_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references service_categories(id),
  name text not null,
  slug text not null unique,
  description text,
  requires_extra_checks boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table locations (            -- pilot coverage
  id uuid primary key default gen_random_uuid(),
  postcode_district text not null unique,   -- e.g. 'G12'
  area_name text not null,
  is_enabled boolean not null default true
);

create table provider_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  provider_type provider_type not null,
  display_name text not null,
  business_name text,
  bio text not null,
  service_districts text[] not null default '{}',
  price_note text,                            -- e.g. 'from £40'
  status provider_status not null default 'pending',
  rejection_reason text,
  needs_more_info_note text,
  declaration_accepted_at timestamptz not null,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table provider_services (
  provider_id uuid references provider_profiles(user_id) on delete cascade,
  category_id uuid references service_categories(id),
  primary key (provider_id, category_id)
);

create table provider_photos (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references provider_profiles(user_id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);  -- max 6 per provider, enforced in action and by trigger

create table job_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references service_categories(id),
  title text not null,
  description text not null,
  postcode text not null,
  postcode_district text not null,
  timeframe text not null,          -- 'today' | 'this_week' | 'next_two_weeks' | 'flexible'
  status job_status not null default 'open',
  accepted_offer_id uuid,
  removed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references job_requests(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0
);  -- max 4 per job

create table provider_offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references job_requests(id) on delete cascade,
  provider_id uuid not null references provider_profiles(user_id) on delete cascade,
  message text not null,
  indicative_price_pence int,       -- null = 'Quote on inspection'
  estimated_timeframe text,
  status offer_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, provider_id)
);

alter table job_requests
  add constraint fk_accepted_offer foreign key (accepted_offer_id) references provider_offers(id);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id),
  target_type text not null check (target_type in ('provider', 'job')),
  target_id uuid not null,
  reason text not null,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

create table interest_signups (     -- waitlist for non-pilot postcodes
  id uuid primary key default gen_random_uuid(),
  email text not null,
  postcode text not null,
  created_at timestamptz not null default now()
);

create table notifications (        -- email outbox and log
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  to_email text not null,
  template text not null,
  payload jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued','sent','failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,             -- e.g. 'provider.approved'
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table site_settings (        -- editable content, e.g. pilot notice
  key text primary key,
  value text not null
);
```

Also create: a trigger that creates a `profiles` row on `auth.users` insert; an `updated_at` trigger; a Postgres function `is_admin()` (security definer); and seed data in `supabase/seed.sql` (categories listed in `core-features/03-service-categories.md`, pilot districts G12, G11, G3, G4 as placeholders, and site settings).

### Row Level Security (enable on every table)

| Table | Select | Insert | Update | Delete |
|---|---|---|---|---|
| `profiles` | own row; admin all | via trigger | own row (not `role`, not `is_suspended`); admin all | none |
| `service_categories` | active rows, public; admin all | admin | admin | admin (only if unused, else deactivate) |
| `locations` | public | admin | admin | admin |
| `provider_profiles` | `approved` public; owner own; admin all | owner (own id, status forced `pending`) | owner (cannot touch `status`, `reviewed_*`); admin all | none (suspend instead) |
| `provider_services`, `provider_photos` | public if provider approved; owner; admin | owner | owner | owner, admin |
| `job_requests` | owner; admin; approved providers for `open`/`receiving_offers` jobs where district and category match their profile | any signed-in, non-suspended user (customer_id = self) | owner (title, description, timeframe, only while `open`; can set `closed`); admin (`removed`) | none |
| `job_photos` | same visibility as parent job | owner | none | owner |
| `provider_offers` | offer owner; job owner; admin | approved provider, once per job, job must be open/receiving | offer owner (only while `submitted`); job owner (accept/decline via action) | none (withdraw instead) |
| `reports` | admin | signed-in | admin | none |
| `interest_signups` | admin | public (via action with rate limit) | none | none |
| `notifications`, `audit_log` | admin | service role only | service role only | none |
| `site_settings` | public | admin | admin | none |

**Contact release:** build a security-definer function `get_contact_for_accepted_offer(offer_id)` that returns each party's name, email and phone only when `provider_offers.status = 'accepted'` and the caller is the job owner or that provider.

### Storage

- Bucket `provider-photos`: public read; write only by the owning provider under `{user_id}/...`; allowed types JPG/PNG/WebP; max 5 MB. Photos of non-approved providers are not linked anywhere public.
- Bucket `job-photos`: private. Serve with short-lived signed URLs to the job owner, matching providers and admin.
- Validate mime type and size on the server in the action, not only in the browser.

## Domain rules

- **Postcode:** `normalisePostcode(input)` uppercases, trims, inserts the single space before the last three characters, and validates UK format. `postcodeDistrict(postcode)` returns the outward code (for example `G12 8QQ` gives `G12`). Both are pure functions in `lib/postcode.ts` with unit tests covering spaced, unspaced, lowercase, and invalid inputs.
- **Pilot check:** a postcode is in the pilot if its district exists in `locations` with `is_enabled = true`.
- **Search:** category plus district. Return providers where `status = 'approved'`, the provider offers the category (including child categories if the parent is chosen), and `service_districts` contains the district.
- **Provider approval for categories with `requires_extra_checks`:** the admin screen shows a clear notice and the admin must tick "I have seen the evidence required for this category" before approving.
- **Provider edit after approval:** changing `bio`, `service_districts` or `provider_services` keeps the profile live and logs the change. Changing `display_name` or `provider_type` returns the profile to `pending` (setting in `site_settings`: `reapprove_on_key_change`, default true).
- **Job status transitions** (enforced in one function `assertJobTransition(from, to)` with tests):
  `open -> receiving_offers` (on first offer), `open|receiving_offers -> closed` (customer closes or accepts an offer), `any -> removed` (admin only). `closed` and `removed` are terminal.
- **Offer status transitions:** `submitted -> accepted | declined | withdrawn`. Accepting one offer sets the job to `closed`, sets `accepted_offer_id`, and declines all other `submitted` offers on that job.
- **Money:** store pence as integers. Display as £ with two decimals only when needed (`£45`, `£45.50`). Null means "Quote on inspection".
- **Suspended users** (`is_suspended`) cannot post jobs or send offers and see a notice explaining that their account is suspended and how to contact the administrator.
- **Privacy:** public and provider-facing job views show only the postcode district. Full postcode is visible to the job owner and admin only.

## Routes and screens

Implement per `design-system.md` (tags for provider and job cards, status badges with icon and text, stitch line for unfinished states, vocabulary: Job, Offer, Provider).

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Hero with repair-tag search, photo strip, provider invitation, pilot notice |
| `/search?service=&postcode=` | public | Results, filters, empty and out-of-pilot states |
| `/providers/[id]` | public (approved only, else 404; owner and admin can preview) | Profile, gallery, report link |
| `/post-job` | signed in (redirect to register keeping form data) | Job form |
| `/jobs` | signed in | Customer's jobs list |
| `/jobs/[id]` | owner, admin, matching approved providers | Job detail, offers, actions |
| `/provide/apply` | signed in | 4-step provider application (About you, Services, Photos, Review) |
| `/provide` | provider (any status) | Dashboard: status, profile, photos, services |
| `/provide/jobs` | approved provider | Open matching jobs |
| `/provide/offers` | approved provider | My offers |
| `/account` | signed in | Name, phone, password, sign out |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback` | public | Auth |
| `/admin` | admin | Overview counts |
| `/admin/providers`, `/admin/providers/[id]` | admin | Queue and review |
| `/admin/jobs`, `/admin/offers` | admin | Moderation |
| `/admin/categories`, `/admin/pilot-area` | admin | Reference data |
| `/admin/users`, `/admin/reports` | admin | Users and reports |
| `/privacy`, `/terms`, `/cookies` | public | Legal pages (placeholder text until the client supplies approved copy) |

Add `middleware.ts` to refresh the Supabase session and redirect unauthenticated users from protected routes with a `next` param. Add `not-found`, `error`, and `loading` boundaries with skeletons.

## CRUD matrix

C = create, R = read, U = update, D = delete (soft where noted). Every mutation is a Server Action with Zod validation and ownership checks.

| Entity | Customer | Provider | Admin |
|---|---|---|---|
| Account/profile | R U own | R U own | R, suspend/unsuspend users |
| Provider profile | C (apply) | R U own; no delete | R, approve, reject (reason), suspend, request more info |
| Provider services | n/a | C D own | R |
| Provider photos | n/a | C D own (max 6, reorder, alt text) | R D any |
| Categories | R | R | C R U, deactivate (D only if unused) |
| Pilot districts | R | R | C R U, enable/disable |
| Jobs | C R U (while open), close own | R matching only | R, remove (reason) |
| Job photos | C D own (max 4) | R matching only | R |
| Offers | R on own jobs, accept/decline | C R U own, withdraw | R, remove inappropriate (sets withdrawn plus audit entry) |
| Reports | C (via Report link) | C | R, mark reviewed/dismissed |
| Waitlist signups | C (via out-of-pilot form) | n/a | R, CSV export |
| Site settings | R | R | U |

## Server Actions (exact list)

Group by file. Every action returns `ActionResult`, writes an audit entry where noted, and emits the event in brackets.

**`lib/actions/auth.ts`**
- `registerUser({ fullName, email, password, acceptedTerms })` [user.registered]
- `signIn({ email, password })`, `signOut()`
- `requestPasswordReset({ email })`, `resetPassword({ password })`

**`lib/actions/account.ts`**
- `updateAccount({ fullName, phone })`

**`lib/actions/search.ts`**
- `checkPostcode(postcode)` returns `{ valid, district, inPilot }`
- `joinWaitlist({ email, postcode })` [waitlist.joined]

**`lib/actions/provider.ts`**
- `submitProviderApplication(input)` creates `provider_profiles` (pending), services, uploads handled by `addProviderPhoto` [provider.applied] audit
- `updateProviderProfile(input)` [provider.updated] audit
- `setProviderServices({ categoryIds })`
- `addProviderPhoto(formData)` validates type, size, count limit
- `updatePhoto({ id, altText, sortOrder })`, `deleteProviderPhoto(id)`

**`lib/actions/jobs.ts`**
- `createJob(input)` validates postcode and pilot, uploads up to 4 photos [job.created]
- `updateJob(id, input)` only while `open` and no offers accepted
- `closeJob(id)` [job.closed]
- `reportContent({ targetType, targetId, reason })` [report.created]

**`lib/actions/offers.ts`**
- `createOffer(jobId, input)` first offer moves job to `receiving_offers` [offer.created]
- `updateOffer(id, input)` only while `submitted`
- `withdrawOffer(id)` [offer.withdrawn]
- `acceptOffer(offerId)` transaction: accept this, decline others, close job [offer.accepted] [offer.declined]
- `declineOffer(offerId)` [offer.declined]

**`lib/actions/admin.ts`** (all verify `is_admin()` and write audit entries)
- `approveProvider(id, { extraChecksConfirmed })` [provider.approved]
- `rejectProvider(id, { reason })` [provider.rejected]
- `requestMoreInfo(id, { note })` [provider.more_info_requested]
- `suspendProvider(id, { reason })`, `reinstateProvider(id)`
- `removeJob(id, { reason })` [job.removed]
- `removeOffer(id, { reason })`
- `suspendUser(id)`, `unsuspendUser(id)`
- `upsertCategory(input)`, `reorderCategories(ids)`, `setCategoryActive(id, bool)`
- `upsertDistrict(input)`, `setDistrictEnabled(id, bool)`
- `resolveReport(id, { status })`
- `updateSiteSetting(key, value)`
- `exportProvidersCsv()`, `exportJobsCsv()`, `exportWaitlistCsv()` as route handlers, admin only

## Events and notifications

Implement a tiny domain-event layer: `emit(event, payload)` in `lib/events.ts` that (1) writes the notification row(s) for the templates below, then (2) sends via Resend in a non-blocking `after()`/try-catch so a failed email never fails the user's action. Mark `status = 'sent' | 'failed'` with the error text. Provide a retry route handler for failed notifications, admin-only.

| Event | Email to | Template |
|---|---|---|
| `user.registered` | user | Confirm your email (Supabase-sent; do not duplicate) |
| `provider.applied` | provider and admin | Application received / New provider to review |
| `provider.approved` | provider | You're approved, with a link to open jobs |
| `provider.rejected` | provider | Not approved, includes the admin's reason |
| `provider.more_info_requested` | provider | More information needed, includes the admin's note |
| `job.created` | customer and admin | Your job is posted / New job posted |
| `offer.created` | job owner | You have a new offer |
| `offer.accepted` | provider (and customer receives contact details on the page, not by email) | Your offer was accepted |
| `offer.declined` | provider | Offer was not chosen |
| `job.removed` | customer | Your job was removed, with reason |
| `waitlist.joined` | admin (digest optional) | New waitlist signup |
| `report.created` | admin | New report |

Rules: plain branded HTML plus text fallback, sender from an environment variable, no sensitive data beyond need, every link absolute using `NEXT_PUBLIC_SITE_URL`.

Client-side UI events (use toasts per the design system; verbs match button labels): "Job posted", "Offer sent", "Offer accepted", "Provider approved", "Profile saved", "Photo added". Errors stay inline, not toasts.

## Validation (Zod, in `lib/schemas/`)

- Names 2 to 80 chars. Email valid. Password min 10 chars.
- Job: title 5 to 100, description 20 to 2000, postcode valid and in pilot, timeframe enum, category active.
- Provider: bio 40 to 1500, at least 1 service, at least 1 district from enabled pilot districts, declaration accepted, 1 to 6 photos required before submitting the application.
- Offer: message 20 to 1000, price 0 to 100000 pounds or null, timeframe up to 80 chars.
- Photos: JPG/PNG/WebP only, max 5 MB, magic-byte check on server.
- Rejection reason, removal reason, more-info note: 10 to 500 chars.
- Sanitise all free text for output (React escapes by default; never use `dangerouslySetInnerHTML` with user content).

## State management spec

| State | Where it lives |
|---|---|
| Session and user | Server (cookies via Supabase SSR), read in layouts and passed to client components that need it |
| Search filters (service, postcode, sort, page) | URL search params, read in the page Server Component |
| Admin table filters and pagination | URL search params |
| Provider application wizard | `useReducer` with steps `about \| services \| photos \| review`; draft persisted to `sessionStorage` (try/catch guarded) so a refresh does not lose it; cleared on submit |
| Post-job form | React Hook Form; on login redirect, draft kept in `sessionStorage` and restored |
| Photo upload | Local array of `{ file, previewUrl, status: 'queued' \| 'uploading' \| 'done' \| 'error', error? }` |
| Dialog and drawer open state | Local `useState`, focus returned to the trigger on close |
| Optimistic UI | Only for withdraw offer and delete photo, with rollback on `ok: false` |

Use `useActionState`/`useFormStatus` for pending state. Buttons show a loading label and set `aria-busy`.

## Error, empty and loading behaviour

Follow the design system copy bank. Every list has a skeleton, an empty state with a next action, and an error boundary with a retry. 404 for unapproved provider IDs and for jobs a user cannot see (never reveal existence).

## Accessibility and quality

WCAG 2.2 AA per the design system checklist: visible focus, 44px targets, labels above fields, error summary linked to fields, `aria-live` for result counts and stepper, skip link, landmarks, one `h1` per page, reduced motion respected, `lang="en-GB"`. Responsive from 320px.

## Security checklist (implement, do not just list)

- RLS on every table, tested with at least one automated test per policy group (anonymous, customer, provider, other provider, admin).
- Rate limit sign-up, login, waitlist, job creation and offer creation (simple Postgres or in-memory limiter per IP/user; document the limitation).
- CSRF protection via Server Actions defaults; validate `Origin` on route handlers.
- Security headers in `next.config` (CSP appropriate to Supabase, Resend and fonts, `X-Content-Type-Options`, `Referrer-Policy`, frame-ancestors none).
- No PII in logs. Redact emails and phone numbers.
- `.env.example` with every variable; never commit secrets.
- Soft-delete only where specified; audit log for admin and approval actions.

## Environment variables

```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only
RESEND_API_KEY=
EMAIL_FROM=
ADMIN_NOTIFICATION_EMAIL=
```

## Folder structure

```
app/
  (public)/            page.tsx, search/, providers/[id]/, privacy/, terms/, cookies/
  (auth)/              login/, register/, forgot-password/, reset-password/, auth/callback/
  (customer)/          post-job/, jobs/, jobs/[id]/, account/
  (provider)/          provide/, provide/apply/, provide/jobs/, provide/offers/
  (admin)/             admin/, admin/providers/, admin/jobs/, admin/offers/,
                       admin/categories/, admin/pilot-area/, admin/users/, admin/reports/
  api/                 admin/export/[type]/route.ts, notifications/retry/route.ts
components/
  ui/                  shadcn primitives
  mend/                Tag, ProviderCard, JobCard, OfferCard, StatusBadge, Stepper,
                       PostcodeField, PhotoUpload, PilotNotice, StitchLine, EmptyState
lib/
  actions/             auth.ts, account.ts, search.ts, provider.ts, jobs.ts, offers.ts, admin.ts, result.ts
  schemas/             zod schemas
  supabase/            server.ts, client.ts, admin.ts, middleware.ts
  postcode.ts  events.ts  transitions.ts  permissions.ts  format.ts
emails/                react-email templates
supabase/              migrations/, seed.sql
tests/                 unit/, rls/, e2e/
DECISIONS.md  README.md  .env.example
```

## Testing requirements

- **Unit (Vitest):** postcode normalisation and district, job and offer transition functions, price formatting, Zod schemas.
- **RLS tests:** run against a local Supabase instance; prove anonymous users cannot read pending providers or any job, providers cannot read other providers' offers, customers cannot see other customers' jobs, only the job owner or accepted provider can call `get_contact_for_accepted_offer`.
- **E2E (Playwright), mobile and desktop viewports:**
  1. Home search for a pilot postcode returns approved providers; non-pilot postcode shows the pilot message and waitlist form.
  2. Register, post a job with a photo, see it in My jobs.
  3. Apply as provider, admin approves, provider sees the matching job and sends an offer.
  4. Customer accepts the offer, job closes, other offers decline, contact details appear for both parties only.
  5. Admin removes a job and suspends a provider; they disappear from public views.
  6. Keyboard-only run through post-a-job; axe scan with zero serious violations on home, search, post-job, provider profile.

## Definition of done (acceptance criteria)

- [ ] Every route above works with real data, with empty, loading and error states
- [ ] All Server Actions above exist, validate, authorise, and emit their events
- [ ] RLS and storage policies pass the RLS tests
- [ ] Out-of-scope features are absent
- [ ] Design tokens match `design-system.md` (denim, thread, chalk; Archivo plus Atkinson; stitch only for unfinished state; no card shadows)
- [ ] Lighthouse accessibility 90 or above on home and search
- [ ] `npm run lint`, `typecheck`, `test`, and `test:e2e` pass
- [ ] `README.md` explains local setup, migrations, seeding, creating the first admin, environment variables, and deployment to Vercel and Supabase
- [ ] `DECISIONS.md` lists every assumption and any deviation, with the reason

## Build order (work one phase at a time; stop and report at the end of each)

1. **Foundation:** project setup, tokens, fonts, layout, Supabase migration and seed, auth, middleware, roles, `lib/postcode.ts`, tests.
2. **Discovery and profiles:** categories, pilot districts, search page, provider application wizard, photo upload, profile page, provider dashboard, `submitProviderApplication` and photo actions.
3. **Marketplace and admin:** job creation and management, offers (create, update, withdraw, accept, decline), contact release function, admin dashboard screens and actions, reports.
4. **Notifications, legal, hardening:** email events and templates, legal pages, analytics hook (provider chosen by client), rate limiting, security headers, RLS tests, E2E suite, accessibility pass, README and handover notes.

At the end of each phase output: what was built, how to run it, what is untested, and any decision you made that the client should confirm.

Start with phase 1. Before writing code, print a short plan: file list, migration summary, and anything in this prompt you found ambiguous.
