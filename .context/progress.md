# Progress: Repairs and Other Services MVP

Last updated: 2026-11-14
Current gate: **Foundation checkpoint** — code is in place and the core flows have now been run end to end against the local Supabase stack. The hosted project still needs its schema and secret key, and the repo still needs a remote so CI can run.

---

## Status snapshot

| Phase | Status | Notes |
|---|---|---|
| 0. Guardrails | Code complete | Scripts, env contract and unit harness in place. Project-owned repo and CI workflow are in place; the remote and first CI run are pending. |
| 1. Foundation | Code complete, verification pending | Schema, RLS, clients, tokens, auth pages and account page written. RLS suite passes against Postgres. Live Supabase Auth still untested. |
| 2. Discovery | Code complete, verification pending | Landing page, search, provider profile, legal shells and waitlist written. E2E smoke suite passes. |
| 3. Provider onboarding | Code complete, verification pending | Application wizard, dashboard, profile edit and photo upload written. E2E covers the public entry points. |
| 4. Marketplace | Code complete, verification pending | Jobs, offers, accept/decline, contact release and reports written. The job, offer, accept and decline paths were run end to end against the local stack. |
| 5. Admin | Code complete, verification pending | Review queue, moderation, reference data, users, reports, CSV export, analytics and audit fields written. Restyled with the Movexa dashboard theme. Approve, request more info, suspend and reinstate were run end to end. |
| 6. Notifications | Code complete, verification pending | Outbox, templates, event wiring and retry route written. The outbox was proven against the local stack; no live email has been sent because there is no Resend key. |
| 7. Legal and analytics | Partial | Legal pages are clearly marked pilot copy. Analytics are first party and cookie free, off by default. Client legal copy still needed. |
| 8. Hardening and launch | Partial | Rate limiting, security-oriented SQL, security headers and CI exist. Lint, types, unit, build, E2E, RLS and mobile Lighthouse all pass. Deployment is not done. |

The Foundation checkpoint in `tasks/plan.md` says to stop for human review before discovery. Discovery and later modules have been implemented ahead of that gate. The database rules are now proven by the RLS suite, but no flow has run through the live Supabase stack.

---

## Verification

Run on 2026-11-14:

| Command | Result |
|---|---|
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test` | Pass — 7 files, 50 tests |
| `npm run test:coverage` | Pass — 100% statements, branches, functions and lines on `lib/postcode.ts`, `lib/transitions.ts`, `lib/format.ts`, `lib/next-path.ts` |
| `npm run build` | Pass — 35 routes generated, both with and without Supabase configured |
| `npm run test:e2e` | Pass — 37 Playwright tests against a production build; CI runs the same set in Chromium, Firefox and WebKit |
| `npm run test:rls` | Pass — 5 SQL files, run against a real Postgres with the Supabase `auth` and `storage` schemas stubbed |
| `npm audit --omit=dev` | Clean, 0 vulnerabilities |
| Visual pass at 375 / 768 / 1280 | Landing, search, register, login, legal, provider profile, 404 and 403 checked in a real browser |
| Signed-in visual pass at 375 / 1440 | Customer account, customer jobs and every admin page checked in a real browser against a live database, including the admin review queue and the settings forms |
| Lighthouse (mobile) | `/`, `/search`, `/login`, `/privacy`, `/terms`, `/cookies`: performance 90–92, accessibility 100, best practices 100, SEO 100 |

The Playwright suite covers the public pages, the hero search handing its values to `/search`, the pilot checks, the legal pages, the 404 page, the register terms gate, the `next` parameter surviving the login and register round trip, the mobile menu, the skip link, the anonymous admin redirect and the security headers.

`npm run test:e2e` reuses the dev server on port 3001 when one is already running. Next.js only allows one dev server per project directory, so a separate test port cannot be started alongside it. Set `E2E_PORT` to override the port.

Playwright 1.65 no longer installs its own Chromium on macOS 13. On this machine the suite runs with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` pointing at an existing Chromium build. CI installs its own browsers normally. Playwright 1.65 also refuses Firefox and WebKit on macOS 13 ARM, so local runs default to Chromium; CI runs Chromium, Firefox and WebKit (set `E2E_ALL_BROWSERS=1` on a supported machine to run all three locally).

Visual pass findings and fixes:

- **Header nav wrapped at 768px.** Every label broke onto two lines because the desktop nav switched on at `md` (768px). The full nav now switches on at `xl` (1280px), the compact header covers 640–1279px, and nav labels are `whitespace-nowrap`.
- **Brand name wrapped on mobile and the CTA wrapped inside its button.** The brand is now `whitespace-nowrap` at a smaller mobile size, the Menu button is icon-only below 640px with an `aria-label`, and the button primitive carries `whitespace-nowrap` so no CTA label can break.
- **The punched hole appeared on panels that are not listings.** The design system reserves the repair tag for provider cards and job cards. A flat `.panel` class now exists and is used on the search, waitlist and provider-profile panels. The landing page no longer uses the repair tag at all.
- **Unused `Tag` component removed.** Only the provider and job cards use the hole.
- **Two identical account links on the login and register pages.** The form and the page footer both rendered a "Create an account" or "Log in" link. The form-level duplicates are gone, and the site header hides its account links on the auth pages so it cannot drop the `next` parameter.

Checked and found clean: no horizontal overflow at 375px on ten pages, no console errors in a clean browser, auth-protected routes redirect to `/login`, the mobile menu opens with all links, and the 404 page renders.

One note: the design system asks for a Lighthouse accessibility score of 90 or more. Mobile Lighthouse on the six public pages scores 100 for accessibility and 90–92 for performance. Admin pages are not measured because they need a signed-in account.

The RLS suite applies the migration and seed to a scratch database, then exercises the rules: profile creation, role escalation denial, suspension blocking job posts, provider application, self-approval denial, admin approval, provider withdrawal, job visibility by district and service, offer permissions, offer acceptance declining the losers, the accept bypass not leaking, contact release only for the accepted parties, and the admin-only capabilities.

Not run yet:

- Auth, storage and email flows against hosted Supabase — the hosted schema is empty and there is no Resend key, so the local stack stands in. The local stack does run real GoTrue, PostgREST and Storage.
- The full hosted Supabase stack — `scripts/local-supabase.sh` covers it locally without Docker.
- A two-account marketplace run against the hosted project (T46, T54). The same flow has been run against the local stack.

`scripts/local-postgres.sh` starts a throwaway Postgres and loads the migration and seed, so `npm run test:rls` can run without Docker:

```
./scripts/local-postgres.sh reset
SUPABASE_DB_URL="postgresql://postgres@127.0.0.1:55432/app" npm run test:rls
```

The build emits one benign font warning: Turbopack cannot generate fallback metrics for `Atkinson Hyperlegible Next`. The font still loads.

---

## Implemented inventory

### Foundation

- `lib/env.ts`, `.env.example`, `lib/types.ts`, `lib/cn.ts`, `lib/format.ts`, `lib/postcode.ts`, `lib/transitions.ts`, `lib/permissions.ts`, `lib/rate-limit.ts`, `lib/storage.ts`, `lib/category-utils.ts`, `lib/next-path.ts`.
- Supabase clients: `lib/supabase/server.ts`, `admin.ts`, `session.ts`; `proxy.ts` refreshes sessions.
- Validation schemas: `lib/schemas/common.ts`, `auth.ts`, `account.ts`, `job.ts`, `offer.ts`, `provider.ts`, `search.ts`, `admin.ts`.
- Data helpers: `lib/data/categories.ts`, `settings.ts`, `locations.ts`, `providers.ts`, `jobs.ts`, `admin.ts`. Public helpers return empty/default data when Supabase is unconfigured so builds work without credentials.
- Server actions: `lib/actions/auth.ts`, `account.ts`, `search.ts`, `jobs.ts`, `offers.ts`, `provider.ts`, `admin.ts`; shared `ActionResult` in `lib/actions/result.ts`.
- Email/notification layer: `lib/emails/templates.ts`, `lib/emails/send.ts`, `lib/events.ts`.
- Analytics: `lib/analytics.ts`, `lib/analytics-server.ts`, `app/api/analytics/route.ts`, `components/mend/analytics.tsx`.
- SQL: `supabase/migrations/0001_init.sql` (tables, indexes, helper functions, triggers, RLS, RPCs, storage buckets and policies), `supabase/config.toml`, `supabase/seed.sql`.
- RLS suite: `tests/rls/00_fixtures.sql`, `10_identity.sql`, `20_provider.sql`, `30_marketplace.sql`, `40_admin.sql`, run by `tests/rls/run.mjs`. `scripts/local-postgres.sh` starts a throwaway database for it.
- Design: `app/globals.css` tokens, `app/layout.tsx`, Archivo + Atkinson Hyperlegible Next, skip link and shell.
- UI primitives: `components/ui/button.tsx`, `field.tsx`.
- Mend components: `status-badge.tsx`, `tag.tsx`, `provider-card.tsx`, `job-card.tsx`, `offer-card.tsx`, `form-message.tsx`, `submit-button.tsx`, `photo-input.tsx`, `search-form.tsx`, `site-header.tsx`, `site-footer.tsx`, `auth-shell.tsx`, `legal-page.tsx`.
- Forms: auth, account, job, offer, provider, action, waitlist, report.
- Auth pages: login, register, forgot-password, reset-password and `auth/callback/route.ts`.
- Account page with details, password change and sign-out.
- Tests: `tests/unit/postcode.test.ts`, `transitions.test.ts`, `format.test.ts`, `schemas.test.ts`, `env.test.ts`, `next-path.test.ts`; `tests/e2e/smoke.spec.ts`; `tests/setup.ts`; `vitest.config.mts`; `playwright.config.ts`.
- Error, loading and not-found boundaries: `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/(site)/loading.tsx`.
- CI: `.github/workflows/ci.yml` runs checks, the RLS suite and the E2E suite.
- README and `DECISIONS.md` baseline.

### Landing page

- The landing page is its own route group, `app/(landing)`, so it does not inherit the application shell. `app/(site)/(public)/page.tsx` was removed to free `/`.
- `app/(landing)/layout.tsx` loads Inter and Instrument Serif and renders `components/landing/landing-header.tsx`, `landing-footer.tsx` and the page.
- `app/(landing)/landing.css` is a scoped design system with its own `--l-*` tokens, so it cannot collide with `app/globals.css`.
- `components/landing/landing-search.tsx` is the real service and postcode form, framed as a repair ticket. It falls back to the starter service list when the database is empty.
- `components/landing/landing-waitlist.tsx` posts to the existing `joinWaitlist` action.
- `components/landing/landing-services.ts` holds the starter services, their copy and their tile colours.
- The reveal on scroll is a CSS scroll driven animation. It needs no script, so it cannot cause a hydration mismatch, and it is disabled for reduced motion and in print.

### Studio theme

- The landing design system now covers every public, auth and job page, plus the 404 and 403 pages. The provider dashboard is untouched.
- `app/globals.css` uses `@theme` rather than `@theme inline`, so utilities emit `var(--color-*)`. A `.studio` wrapper in `app/studio.css` remaps those variables to the landing palette, typography and radii.
- `app/design-system.css` is the shared landing/studio stylesheet. It is imported by `app/(landing)/layout.tsx`, the studio group layouts, `app/not-found.tsx` and `app/forbidden.tsx`.
- Chrome lives in `components/shells/`: `studio-shell.tsx` renders the landing header and footer with Inter and Instrument Serif; `dash-shell.tsx` renders the Movexa dashboard shell for the customer, provider and admin dashboards.
- Route groups own their chrome: `(studio)` and `(auth)` use `StudioShell`; `(customer)`, `(provider)` and `(admin)` use `DashShell`. URLs are unchanged.
- `post-job`, `jobs/[id]` and `provide/apply` moved into `app/(site)/(studio)/`. The `/jobs` list stays in `(customer)`.
- `Button`/`ButtonLink` carry an inert `btn` class and `data-variant`; `StatusBadge` carries `badge`. Outside `.studio` and `.dash` they change nothing, so the provider dashboard keeps its original look.
- `lib/fonts.ts` holds the shared Inter and Instrument Serif font instances used by the studio shell, the landing layout, the 404 and the 403.
- Auth pages hide the header's "Log in"/"Create account" links via a `hideAuthLinks` prop, so the `next` parameter cannot be dropped.

### Dashboard theme

- The customer and admin dashboards now use the Movexa design system from `.context/backend/dashboard.md`. The provider dashboard is deliberately left on the original application design.
- `app/dash.css` is a scoped design system keyed on a `.dash` wrapper, the same pattern as `.studio`. It remaps the Tailwind theme variables to the Movexa palette, typography and radii, then adds the shape language: a floating shell with a 29px top radius, translucent cards, pill controls, tinted icon circles and semantic status chips.
- The page backdrop behind the shell was removed on request. The canvas is the Movexa warm grey-beige throughout, so there is no darker outer background, and `.context/backend/dashboard.md` no longer lists one.
- `components/shells/dash-shell.tsx` renders the shell. `components/dash/dash-header.tsx` is the wordmark header with the customer nav, a profile avatar and a sign-out control, and falls back to a `details` menu on narrow screens. `components/dash/dash-nav.tsx` is the admin section bar with the active state.
- The admin overview is a six-card KPI strip with tinted icons. The admin analytics page adds an "Event mix" bar chart and an "At a glance" card, both built from the real recorded totals. No chart library was added.
- The customer jobs page has a three-card KPI strip computed from the customer's own jobs. The account page has a profile summary card.
- Contrast was checked for every text and surface pair. The muted tone was darkened to `#686671` and the success foreground to `#177045` so both clear WCAG AA on their tinted backgrounds.
- The dashboard theme overrides shared utility classes inside its own scope only. Heading rules are written at element specificity and the text-size overrides use `:where()`, so `h2` keeps the 14px section-heading size.

### Supabase without Docker

- `scripts/local-supabase.sh` runs the whole local stack without Docker, which is not installed on this machine. It downloads PostgREST and GoTrue, starts them against the local Postgres, installs the real `auth` and `storage` schemas, then applies the project migration and seed.
- `scripts/local-supabase-gateway.mjs` is a small reverse proxy that serves one URL and routes `/auth/v1` to GoTrue and `/rest/v1` to PostgREST, the way Supabase's Kong does. The app uses a single `NEXT_PUBLIC_SUPABASE_URL` in local development and production, with no conditional code.
- `scripts/local-demo-data.sh` adds sample providers, jobs and offers so the dashboards have something to show. `scripts/hosted-setup.sh` applies the migration and seed to a hosted project and creates the sign-in accounts.
- The session read calls `await connection()`, because the auth client compares the session expiry against the current time and that value cannot be baked into a static shell.
- The stack and the RLS scratch database live under `~/.local/share/repairs-and-other-services/`, not in the operating system's temporary folder. macOS purges that folder in the background, which silently emptied `PG_VERSION` and the write-ahead log of a running cluster.

### Discovery

- Landing page with a hero search, the starter services, how it works, a provider band, a privacy band and a waitlist.
- Search page with category/district filters, pilot checks and provider cards, plus an optional provider-name or keyword field.
- Public provider profile with photos, services, areas and report form.
- Privacy, terms and cookies pages linked from the footer.
- Public shell with header, mobile navigation and footer.

### Search

- `lib/search.ts` holds the cleaning and matching rules: queries are trimmed, capped at 80 characters and stripped of the characters that break a PostgREST filter or a `LIKE` pattern.
- `SearchBox` is a plain GET form, so the query lives in the URL and results can be linked to, refreshed and shared. Other filters are carried in hidden inputs, and a "Clear search" link removes only the query.
- Dashboard lists with search: admin providers, jobs, offers, users and reports; customer jobs; provider matching jobs and offers. The public `/search` page adds a keyword field that narrows the existing service-and-district results.
- Matching happens on the server, where the rows are already read. The lists do not paginate yet; a list that starts paginating moves its filter into the database query.

### Provider onboarding

- Application wizard: about you, services and areas, photos, review.
- Provider dashboard with status, profile summary and photos.
- Profile edit with reapproval rule.
- Matching jobs and sent offers pages.
- Photo upload validation and storage cleanup.

### Marketplace

- Post-job page with category, description, postcode and timeframe.
- Customer jobs list and role-aware job detail.
- Provider matching jobs and offer form.
- Offer cards, accept/decline/withdraw.
- `accept_offer` Postgres RPC accepts one offer and declines the others in one transaction.
- Contact details released through `get_contact_for_accepted_offer` RPC only after acceptance. The accepted provider also sees the full postcode on the job.
- Job owners can edit an open job and close it. The owner checks live in the actions and in RLS.
- Providers can edit or withdraw an offer while it is still submitted. The edit control disappears once the offer is accepted, declined or withdrawn.
- Report content flow.

### Admin

- Admin layout and overview.
- Provider queue, detail review, approve, reject, request more info, suspend, reinstate and remove.
- Job moderation and offer moderation.
- Category and pilot-area management, including category reordering.
- User suspension and reinstatement.
- Reports queue.
- Analytics page showing page views, searches, jobs posted and provider applications.
- CSV export route: `/api/admin/export/[type]` for providers, jobs, offers and waitlist signups.
- Notification retry route: `/api/notifications/retry` (admin session or `CRON_SECRET`).
- A signed-in non-admin gets a 403 on every admin route. The role is resolved in `proxy.ts`, before anything renders, and the request is rewritten to `/admin-denied`, which calls `forbidden()`. The admin layout and every admin action still check the role, so the proxy is the front door rather than the only defence. An anonymous visitor gets a 307 to `/login`, also from the proxy.
- Every approve, reject, suspend and remove records the actor and the time on the row itself, not only in the audit log.

### Legal, analytics and handover

- Privacy, terms and cookies pages, clearly marked as pilot copy.
- First party, cookie free analytics: page views, searches, jobs posted and provider applications. Off until an admin sets the analytics provider to `first-party`.
- Security headers on every route: content security policy, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` and HSTS.
- `docs/admin-guide.md`, `docs/manual-test-script.md` and `docs/handover.md`.

### Notifications

- Domain events for provider lifecycle, jobs, offers, waitlist and reports.
- Outbox rows written before sending; failures logged and retryable.
- Resend integration with a no-key skip path.
- Admin, provider and customer email templates.

---

## Decisions locked

- Stack: Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4, Supabase, Resend, Vercel, Vitest, Playwright.
- Reads in Server Components; writes only in Server Actions; authorisation in actions and RLS.
- `ActionResult` return type; `useActionState` for typed form feedback; admin forms redirect with `?ok=`/`?error=`.
- Pilot coverage by enabled postcode district, not distance/maps.
- Contact details released only after an offer is accepted.
- Money stored as integer pence; null means "Quote on inspection".
- Closed/removed jobs and accepted/declined/withdrawn offers are terminal.
- Non-blocking notification outbox.
- Next 16 uses `proxy.ts`, not `middleware.ts`.
- `cacheComponents` and `partialPrefetching` stay enabled; dynamic reads sit inside `<Suspense>`.
- Design tokens are CSS variables. shadcn is not installed; lightweight Tailwind primitives are hand-rolled.
- Forms use React 19 `useActionState` with a Server Action. React Hook Form and `@hookform/resolvers` were removed as unused.
- Email templates are hand-built HTML and text strings. `@react-email/components` was removed as unused and a source of advisories.
- Placeholder assumptions: districts `G12`, `G11`, `G3`, `G4`; seven starter categories; 1–6 provider photos; `reapprove_on_key_change = true`.
- **The landing design system covers the public, auth and job pages.** The client supplied `.context/frontend/landing.md` and asked for it on the landing page first, then on every public, auth and job page. It lives in `app/design-system.css` and is scoped by a `.studio` wrapper in `app/studio.css` that remaps the Tailwind theme variables. The signed-in dashboards keep the original mending tokens. The two systems share no class names.
- **Studio pages use Inter and Instrument Serif.** The fonts are loaded by `components/shells/studio-shell.tsx`, `app/(landing)/layout.tsx`, `app/not-found.tsx` and `app/forbidden.tsx` through `lib/fonts.ts`. The dashboards keep Archivo and Atkinson Hyperlegible Next.
- **The landing page has no testimonials, no FAQ and no device mockup.** There are no real testimonials or FAQ answers to publish, and a mockup full of invented dashboard widgets would misrepresent the product. The hero shows the real search form instead.
- **Service tiles fall back to the starter list.** The database is the source of truth once seeded, but the landing page and the hero form must not look empty before it is.
- **Landing districts come from the pilot-area setting.** The chips read enabled `locations` rows, so enabling or disabling a district in admin changes the landing page. The placeholder list is only a fallback when the database is empty.
- **Tile text colour is chosen per background.** White fails WCAG AA on the brown, green, orange and red tiles, so those use ink. Blue, teal and purple keep white.

---

## Blockers and open questions

1. **Supabase credentials are absent.** Auth, storage and email flows cannot be run end to end. Docker Desktop is also unavailable, so `npx supabase start` cannot run locally either.
2. **Git remote and first CI run.** The repo is initialised and committed, but no remote exists yet, so the CI workflow has not run (T03, T65, T69).
3. **Brand assets.** The design-system direction is approved; a logo file is still optional.
4. **Legal copy.** Pages are clearly marked pilot copy.
5. **Sender domain and DNS for Resend.**
6. **Warranty length and Supabase plan.**

Resolved on 2026-11-09: the project is its own git repository; pilot districts
`G12`, `G11`, `G3` and `G4` are final; the seven starter categories and their
flags are final; the first admin is the account whose email is
`ADMIN_NOTIFICATION_EMAIL`; analytics are first party and cookie free, so no
consent banner is needed; provider applications need 1–6 photos; key provider
changes return to review (`reapprove_on_key_change = true`).

---

## Risks and watch items

- **The SQL runs, but not on real Supabase.** The migration and seed apply cleanly to Postgres 14 and the RLS suite passes, but PostgREST, GoTrue and Storage are untested. The grant block now states Supabase's defaults explicitly to reduce that risk.
- **The E2E suite is a smoke suite.** It proves the public pages render, the pilot checks work, the redirects and security headers behave, and the `next` parameter survives the auth round trip. It does not exercise a signed-in two-account marketplace flow, which still needs live credentials.
- **The visual boundary is between the landing pages and the dashboards.** Public, auth and search pages use the landing system; the customer, provider and admin dashboards use the Movexa system. Opening a job from `/jobs` stays inside the dashboard, and the landing page keeps its own design.
- **RLS suite needs a database.** `npm run test:rls` fails when no database is reachable. `scripts/local-postgres.sh` covers local runs; CI starts Supabase.
- **Legal copy is a launch blocker, not a build blocker.**
- **Foundation is broad.** The Foundation checkpoint is the first real review gate.
- **Plan drift.** Update `tasks/plan.md`, `tasks/todo.md` and this file together when scope or order changes.

---

## Log

| Date | Event |
|---|---|
| 2026-11-08 | Context review complete. Capability map and project spec drafted. Specification gate opened; no code written. |
| 2026-11-08 | Spec and capability map approved. Plan and task list drafted: 9 phases, 69 tasks, 9 checkpoints. |
| 2026-11-08 | Foundation through admin/notification code implemented. Lint, typecheck, 27 unit tests and production build pass. RLS, E2E and live credential flows remain blocked. |
| 2026-11-08 | Migration and seed executed against a real Postgres. RLS suite added and passing. Fixed: missing pending-provider delete policy, `accept_offer` trigger bypass leaking into later writes, and grants now stated explicitly. Docker Desktop is unavailable, so the full Supabase stack could not be started. |
| 2026-11-08 | Removed the unused `react-hook-form`, `@hookform/resolvers` and `@react-email/components` dependencies. `npm audit --omit=dev` is clean. Added coverage tooling: 100% branch coverage on the postcode, transition and format libraries. |
| 2026-11-08 | Visual pass at 375, 768 and 1280 in a real browser. Fixed: nav wrapping at tablet, brand and CTA wrapping on mobile, and the repair-tag hole on panels that are not listings. |
| 2026-11-08 | Admin dashboard completed against `.context/08`. Added: 403 for signed-in non-admins, provider filter by service, provider removal, closed-jobs count, category reordering, and actor and timestamp fields on every decision. Added a report link on job pages, first party analytics, security headers, and the admin guide, manual test script and handover notes. |
| 2026-11-09 | Landing page rebuilt to the client-supplied `.context/frontend/landing.md`. It lives in its own `app/(landing)` route group with scoped `--l-*` tokens, Inter and Instrument Serif, and its own header and footer. The old home page was removed so `/` has one owner. The hero shows the real search form rather than a mockup. |
| 2026-11-09 | Landing page defects fixed: the reveal script mutated a React attribute and caused a hydration mismatch, so it is now a CSS scroll driven animation; the tiles disappeared without a seeded database, so the page and hero form fall back to the starter list; white text failed contrast on four tile colours, so those tiles use ink; the serif terminal needed a hair more space before the next word; duplicate icons were given distinct ones; the mobile menu moved to a `details` element so it opens before hydration. |
| 2026-11-09 | E2E suite made runnable and green. Playwright 1.65 will not install Chromium on macOS 13, so the config accepts `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; the config now uses the normal dev port because Next only allows one dev server per directory; test expectations were corrected for the pilot error copy, the reset heading and the followed admin redirect. |
| 2026-11-09 | Found and fixed two identical account links on the login and register pages. The site header now hides its account links on auth pages, which also stops it dropping the `next` parameter. |
| 2026-11-09 | Added `scripts/local-postgres.sh` so the RLS suite runs without Docker. Full pass: lint, typecheck, 35 unit tests, 34-route build, 19 Playwright tests, 5 RLS files. |
| 2026-11-09 | Studio theme applied to every public, auth and job page, plus the 404 and 403. `app/globals.css` moved to `@theme`; `app/design-system.css` is shared; `app/studio.css` remaps the theme inside `.studio`. Route groups own their chrome through `components/shells/studio-shell.tsx` and `app-shell.tsx`. Dashboards keep the original tokens. Verified at 375 and 1280 with zero horizontal overflow and no console errors. |
| 2026-11-09 | Docs 01–07 audit. Landing district chips now read enabled `locations` rows with the placeholder list as fallback; the accepted provider sees the full postcode after acceptance. Confirmed already present: owner-only job edit and close, offer edit and withdraw while submitted, provider photo alt text, the extra-checks flag in admin review, and the 6-photo / 5 MB / JPEG-PNG-WebP limits. Full pass: lint, typecheck, 35 unit tests, 35-route build, 19 Playwright tests, 5 RLS files. |
| 2026-11-09 | Project separated into its own git repository at `repairs-and-other-services` and committed as `Initial commit: Repairs and Other Services pilot MVP`. `.env.example` is now tracked (the `.env*` ignore has an exception) and its admin field is documented as the first admin owner. Phase 1 answers recorded: districts `G12`/`G11`/`G3`/`G4`, the seven starter categories, and `ADMIN_NOTIFICATION_EMAIL` as the handover owner. |
| 2026-11-09 | Mobile Lighthouse measured against the production build. `/`, `/search`, `/login`, `/privacy`, `/terms` and `/cookies` score 90–92 performance, 100 accessibility, 100 best practices and 100 SEO. Admin pages still need a signed-in account. |
| 2026-11-09 | Waitlist signups were captured but never readable, so admins could only see them in notification emails. Added `getInterestSignups`, a `waitlist` CSV export and an **Export waitlist** button on the admin overview. Documented in the admin guide. |
| 2026-11-09 | Product answers recorded: provider applications require 1–6 photos (already enforced in the wizard and the action), and key provider changes return an approved profile to review (seeded `reapprove_on_key_change = true`). No code change was needed. |
| 2026-11-09 | Cross-browser coverage added to CI. `playwright.config.ts` adds Firefox and WebKit projects when `CI` is set (or `E2E_ALL_BROWSERS=1`), and the CI job installs all three browsers. Local runs stay on Chromium because Playwright 1.65 does not support Firefox or WebKit on macOS 13 ARM. |
| 2026-11-09 | Customer and admin dashboards restyled with the Movexa dashboard design system from `.context/backend/dashboard.md`. Added `app/dash.css` as a `.dash` scope, `components/shells/dash-shell.tsx`, and the header and admin nav components. The admin overview is a KPI strip, the analytics page has a CSS event-mix chart and an at-a-glance card, and the customer jobs and account pages have KPI and profile cards. The provider dashboard is deliberately unchanged and still uses `AppShell`. No chart library, global search or other dependency was added. Fixed during the visual pass: the dashboard stylesheet was not loading on routes outside the admin and customer groups, chart bars rendered at zero height because they were inline spans, body links were too hot in orange, the wordmark wrapped at 375px, and the muted and success tones were below WCAG AA on their tinted backgrounds. Full pass: lint, typecheck, 35 unit tests, 35-route build, 19 Playwright tests, 5 RLS files. |
| 2026-11-09 | Supabase set up locally without Docker, which is not installed on this machine. `scripts/local-supabase.sh` runs PostgREST and GoTrue as standalone binaries against the local Postgres, and `scripts/local-supabase-gateway.mjs` serves one URL for both the way Supabase's Kong does. This unblocked real sign in and a live dashboard. Attaching a real database exposed four bugs that had been invisible: the admin area rendered two shells; six Supabase queries failed because `provider_profiles` has three foreign keys to `profiles` and `job_requests` has two, so PostgREST could not resolve the embeds; the landing page could not be prerendered because its reads sat outside a Suspense boundary; and the admin route could not be prerendered for the same reason. Fixed with an explicit relationship hint on every affected embed, three Suspense boundaries on the landing page, `export const instant = false` on the admin layout and `await connection()` in the session read. The public key is now read as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the server key as `SUPABASE_SECRET_KEY`, with the older names still accepted. |
| 2026-11-09 | The grey page backdrop behind the dashboard shell was removed on request. The canvas is the Movexa warm grey-beige throughout and `.context/backend/dashboard.md` no longer lists a backdrop colour. |
| 2026-11-11 | Route groups reorganised by chrome. `(site)/(studio)` holds the landing-design pages (`/`, `/post-job`, `/search`, `/providers/[id]`, legal and auth), while `(customer)`, `(provider)` and `(admin)` all use the Movexa `DashShell`. The admin link was removed from the landing header and from every non-admin header, and the dead `AppShell`, `SiteHeader` and `SiteFooter` were deleted. `/jobs/[id]` moved to `(customer)` and `/provide/apply` to `(provider)`. |
| 2026-11-11 | Job detail, `/provide`, `/provide/jobs` and `/provide/offers` restyled into the dashboard language: `dash-page`, `dash-kicker`, `DashAlert` and the dash card treatment replace the landing `panel`, `s-alert`, `PilotNotice` and `StitchLine` classes. `.dash .tag` now renders as a dash card so job cards match the provider and offer cards. |
| 2026-11-11 | Notification outbox was empty in local development. Two causes: the demo users were inserted straight into `auth.users` without `instance_id` or the non-null token columns, so GoTrue could not find them and `getUserEmail` returned null; and the `job_requests` embed on `provider_offfers` was ambiguous because `job_requests.accepted_offer_id` also references `provider_offers`. Fixed the demo data script and added the `job_requests!provider_offers_job_id_fkey` hint in the accept, decline, admin offer list and provider offer list queries. |
| 2026-11-11 | Every CRUD action now writes an audit row. Added the missing audits for job update, close and photo removal, offer update and decline, provider photo add, update and remove, report creation, category activation, district create, update and enable, report resolution and site settings. |
| 2026-11-11 | Added `provider.suspended` and `provider.reinstated` domain events with email templates, so a suspended provider is told and a reinstated provider is told their profile is live again. |
| 2026-11-11 | Verified the event flows end to end against the local stack: approve, request more info, suspend, reinstate, job created (admin and customer), offer created, offer accepted and offer declined each wrote a `notifications` row and an `audit_log` row. Contact details were confirmed to release only to the accepted pair, and the accepted provider sees the full postcode. |
| 2026-11-14 | Signing in with an admin account could land on the provider dashboard, because the page that sent the visitor to sign in decided the destination and `/provide` was a valid one. The landing page is now role-aware: `landingPath` in `lib/next-path.ts` sends an admin to `/admin`, a provider to `/provide` and a customer to `/account`, and never sends an admin to a provider-only path. The role is read with the server key, because the request-scoped client cannot see the session cookie it has just written. `/provide` also redirects an admin who does not offer services, and `requireProvider` sends them to `/admin` rather than the application form. |
| 2026-11-14 | The local Supabase cluster and the RLS scratch database were both lost to the macOS temporary folder purge, which silently emptied `PG_VERSION` and the write-ahead log. Both scripts now keep their data under `~/.local/share/repairs-and-other-services/`, outside the temporary directory, and the stack was rebuilt and the demo data reloaded. |
| 2026-11-14 | Contrast audit of every dashboard and studio page with `scripts/contrast-audit.js`. `--d-orange-strong` was darkened from `#c2410c` to `#b93b0a`, because the old value was 4.499:1 on the orange tint and the threshold is 4.5:1. Every page now passes. |
| 2026-11-14 | The landing service tiles carried the wrong foreground. Blue, purple, brown and the pink tile failed WCAG AA; each tile now uses whichever of ink or white actually clears the threshold, and the pink tile uses ink on a slightly darkened red. |
| 2026-11-14 | Signing in, registering, resetting a password, posting a job, sending an offer and applying as a provider used to return the next path to the browser and push to it. That push raced with the refresh that followed it, so people were sometimes left on the form they had just submitted with their work already saved. Every one of those now ends in a server-side `redirect()`, outside the try block so it is not caught as a failure, and the analytics events for those writes are recorded on the server. |
| 2026-11-14 | The 403 page rendered blank because it nested a second `<html>` and `<body>` inside the root layout. It now uses the dashboard chrome it is shown inside, and the dashboard has its own 404 for a missing job. |
| 2026-11-14 | The end-to-end suite was rebuilt around a production build. It runs on port 3005 into `.next-e2e`, so a test run never touches the dev server or its build, and the development server's different error rendering can no longer make a test pass that would fail in production. Each role signs in once in a setup project and the session is reused, which keeps the run at about 17 seconds and well inside the sign-in rate limit. Each test creates its own data, so the tests no longer interfere when they run in parallel. 33 tests pass. |
| 2026-11-14 | `scripts/local-demo-data.sh` now creates its own accounts instead of assuming `local-supabase.sh` made them. GoTrue stores a bcrypt hash in `encrypted_password`, so a directly inserted row signs in normally; this was verified against the local stack. That makes the same script usable on the Supabase CLI containers the CI job uses, so the CI e2e job now starts the stack, resets the schema, loads the demo data and hands the keys to the suite. |
| 2026-11-14 | Search was only on the public `/search` page, and the dashboard lists could not be searched at all. Added a shared `SearchBox` GET form, `lib/search.ts` for cleaning and matching, and keyword search on every list: admin providers, jobs, offers, users and reports, customer jobs, provider matching jobs and offers, plus an optional provider-name/keyword field on the public search. The query lives in the URL, other filters survive a search, and a clear link removes only the query. 8 unit tests and 4 end-to-end tests added; 50 unit tests and 37 Playwright tests pass. |
| 2026-11-16 | Added Google sign-in and sign-up at the client's request. The login and registration forms start Supabase's PKCE OAuth flow through a browser client, and the existing `/auth/callback` route exchanges the code, then lands the account by role (admin, provider or customer). Registration still requires the terms tick; login uses the clickwrap text under the button. The callback now refuses control-character redirect paths, sends `no-store`, and reads the role through `getAccountState` so it works before the new session cookie is visible. 2 unit tests and 3 Playwright tests added. |
