# Implementation Plan: Repairs and Other Services MVP

Status: **draft — awaiting approval**
Date: 2026-11-08
Approved inputs: `SPEC.md`, `CAPABILITY-MAP.md`, `.context/01`–`11`, `.context/design-system.md`, `.context/master-build-prompt.md`
Task list target: `tasks/todo.md`

---

## Overview

Build the MVP in nine delivery phases: guardrails, foundation, discovery, provider onboarding, marketplace, admin, notifications, legal/analytics, and hardening/launch. Each phase ends in a checkpoint where lint, typecheck, tests and a working user flow are verified before moving on.

Foundation is necessarily horizontal (schema, auth, tokens, shared libraries). Every phase after it is sliced vertically: schema, action, page and test for one user capability at a time.

---

## Architecture decisions

| Decision | Rationale |
|---|---|
| Next.js 16 App Router, React Server Components for reads | Matches the installed stack and keeps data fetching server-side |
| Writes only through Server Actions returning `ActionResult` | One authorisation and validation path; no hidden client API |
| Supabase RLS as the second enforcement layer | An action bug must not become a data breach |
| One `app_role` plus separate `provider_status` | A customer can also be a provider; admin is the only privileged role |
| Postcode district coverage, no distance or maps | Budget-appropriate pilot model and explicitly in scope |
| Integer pence for money; null means "Quote on inspection" | Avoids floating-point money bugs and matches the copy |
| Domain events write an outbox row, then send non-blocking | A failed email must never fail a user action |
| Design tokens as CSS variables; proposal palette | Client can rebrand without touching components |
| Test the risky pure logic and every RLS policy group | Highest defect cost, cheapest to test |
| Module ids from `CAPABILITY-MAP.md` stay stable | Plans, specs and tasks select work by module id |

---

## Delivery phases

| Phase | Module(s) | Tasks | Exit gate |
|---|---|---|---|
| 0 | guardrails | T01–T03 | Scripts, env contract and repo/CI decision in place |
| 1 | `foundation` | T04–T23 | Schema + seed applied, auth works, tokens applied, shared libs tested |
| 2 | `discovery` | T24–T30 | Home → search → provider profile works; pilot and non-pilot paths pass |
| 3 | `provider-onboarding` | T31–T38 | Application with photos reaches pending; provider dashboard shows status |
| 4 | `marketplace` | T39–T46 | Job → offer → accept → contact release works |
| 5 | `admin` | T47–T54 | Admin can approve, reject, suspend, moderate, manage reference data and export |
| 6 | `notifications` | T55–T59 | Every trigger sends exactly one email; failures never block actions |
| 7 | `legal-and-analytics` | T60–T62 | Legal pages live with consent; analytics events recorded |
| 8 | `hardening-and-launch` | T63–T69 | Security, RLS, E2E, a11y, handover and deployment complete |

---

## Task list

### Phase 0 — Guardrails

#### T01 — Test and script harness
**Description:** Make the quality commands real before any product code exists.
**Acceptance:**
- [ ] `npm run typecheck`, `npm run test`, `npm run test:unit`, `npm run test:rls`, `npm run test:e2e` all run.
- [ ] Vitest resolves `@/`, uses jsdom where needed, and runs `tests/unit`.
- [ ] Coverage provider installed and `npm run test -- --coverage` works.
**Verify:** run each command; `npm run typecheck` exits 0.
**Depends:** none
**Files:** `package.json`, `vitest.config.ts`, `tests/setup.ts`
**Scope:** S (3 files). Adding `@vitest/coverage-v8` needs approval.

#### T02 — Environment contract
**Description:** Document every variable and validate it at the server boundary.
**Acceptance:**
- [ ] `.env.example` lists site URL, Supabase URL/anon/service key, Resend key, sender, admin email.
- [ ] `lib/env.ts` parses server and public variables separately with Zod; a missing server var fails with a clear message.
- [ ] No server-only value can be imported into a client component.
**Verify:** `npm run test -- env`; `npm run build`.
**Depends:** T01
**Files:** `.env.example`, `lib/env.ts`, `tests/unit/env.test.ts`
**Scope:** S (3 files)

#### T03 — Project-owned repository and CI baseline (ASK FIRST)
**Description:** Separate the project from the home-directory git repo and add CI.
**Acceptance:**
- [ ] Project has its own git repository and remote, with the scaffold committed.
- [ ] CI runs install, lint, typecheck and unit tests on push/PR.
- [ ] A separate Playwright job is defined but may be gated until the app runs.
**Verify:** push a branch; CI green.
**Depends:** T01
**Files:** `.github/workflows/ci.yml`, `.gitignore`, `README.md`
**Scope:** S (3 files). **Blocked on explicit approval** because the current git root is `/Users/oladimeji`.

---

### Phase 1 — Foundation

#### T04 — Supabase config and schema migration
**Description:** Create the database exactly as specified.
**Acceptance:**
- [ ] All enums, tables, indexes, foreign keys, `updated_at` trigger, profile-on-signup trigger and `is_admin()` exist.
- [ ] `npx supabase db reset` applies cleanly on a fresh local instance.
**Verify:** `npx supabase start && npx supabase db reset`; query `information_schema.tables`.
**Depends:** T02
**Files:** `supabase/config.toml`, `supabase/migrations/0001_init.sql`
**Scope:** M (2 files, large SQL)

#### T05 — Seed data
**Description:** Seed categories, pilot districts and site settings.
**Acceptance:**
- [ ] Seven starter categories with slugs, order and extra-checks flags.
- [ ] Districts `G12`, `G11`, `G3`, `G4` with area names, all enabled.
- [ ] `pilot_notice` and `reapprove_on_key_change` settings exist.
**Verify:** `npx supabase db reset`; SQL count queries.
**Depends:** T04
**Files:** `supabase/seed.sql`
**Scope:** S (1 file)

#### T06 — Table RLS and contact release function
**Description:** Enable and implement the policy matrix for every table.
**Acceptance:**
- [ ] RLS enabled on all tables; policies match the matrix in the master prompt.
- [ ] `get_contact_for_accepted_offer` is security-definer and returns contact only to the job owner or accepted provider.
- [ ] Service-role-only tables have no public policies.
**Verify:** `npx supabase db reset`; policy existence query.
**Depends:** T04
**Files:** `supabase/migrations/0002_rls.sql`
**Scope:** M (1 large SQL file)

#### T07 — Storage buckets and policies
**Description:** Create photo storage with ownership and type rules.
**Acceptance:**
- [ ] `provider-photos` is public-read, owner-write under `{user_id}/...`.
- [ ] `job-photos` is private; access via signed URLs only.
- [ ] Buckets restrict MIME types and size to JPG/PNG/WebP and 5 MB.
**Verify:** `npx supabase db reset`; storage policy query.
**Depends:** T04
**Files:** `supabase/migrations/0003_storage.sql`
**Scope:** S (1 file)

#### T08 — RLS harness and identity/reference tests
**Description:** Prove the identity, category and location policies.
**Acceptance:**
- [ ] Helper creates anonymous, customer, provider and admin clients.
- [ ] Tests cover own-row profile access, role escalation denial, active-only categories and public locations.
**Verify:** `npm run test:rls`.
**Depends:** T06, T01
**Files:** `tests/rls/helpers.ts`, `tests/rls/identity.test.ts`, `tests/rls/reference.test.ts`
**Scope:** M (3 files)

#### T09 — RLS marketplace tests
**Description:** Prove provider, job, offer and contact-release policies.
**Acceptance:**
- [ ] Pending providers and jobs are invisible to anonymous users.
- [ ] Matching approved providers can read open jobs; other providers cannot.
- [ ] Offers are visible only to the offer owner, job owner and admin.
- [ ] Contact release fails before acceptance and succeeds after.
**Verify:** `npm run test:rls`.
**Depends:** T06, T08
**Files:** `tests/rls/providers.test.ts`, `tests/rls/jobs.test.ts`, `tests/rls/offers.test.ts`, `tests/rls/contact.test.ts`
**Scope:** L (4 files, at the upper bound)

#### T10 — Postcode library
**Description:** Normalise UK postcodes and extract the district.
**Acceptance:**
- [ ] Handles spaced, unspaced, lowercase and invalid input.
- [ ] `postcodeDistrict("G12 8QQ")` returns `G12`.
- [ ] 100% branch coverage.
**Verify:** `npm run test -- postcode`.
**Depends:** T01
**Files:** `lib/postcode.ts`, `tests/unit/postcode.test.ts`
**Scope:** S (2 files)

#### T11 — Transition library
**Description:** Centralise job and offer status rules.
**Acceptance:**
- [ ] Job transitions: open → receiving_offers → closed; any → removed by admin; terminal states reject changes.
- [ ] Offer transitions: submitted → accepted/declined/withdrawn only.
- [ ] Invalid transitions throw a typed error; 100% branch coverage.
**Verify:** `npm run test -- transitions`.
**Depends:** T01
**Files:** `lib/transitions.ts`, `tests/unit/transitions.test.ts`
**Scope:** S (2 files)

#### T12 — Supabase clients and session middleware
**Description:** Wire cookie-based SSR auth and protected-route redirects.
**Acceptance:**
- [ ] Server, browser and admin clients exist; admin client is server-only.
- [ ] Middleware refreshes the session and redirects unauthenticated users with a `next` param.
- [ ] No service-role key is reachable from client code.
**Verify:** `npm run typecheck`; manual redirect check.
**Depends:** T02
**Files:** `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/admin.ts`, `lib/supabase/middleware.ts`, `middleware.ts`
**Scope:** M (5 files)

#### T13 — Format and permission helpers
**Description:** Add money formatting and role/ownership guards.
**Acceptance:**
- [ ] `£45`, `£45.50`, and "Quote on inspection" for null.
- [ ] Guards for customer, approved provider, admin and ownership.
- [ ] Suspended users are rejected with a clear code.
**Verify:** `npm run test -- format permissions`.
**Depends:** T12
**Files:** `lib/format.ts`, `lib/permissions.ts`, `tests/unit/format.test.ts`, `tests/unit/permissions.test.ts`
**Scope:** M (4 files)

#### T14 — Result type, auth schemas and auth actions
**Description:** Implement the auth write path.
**Acceptance:**
- [ ] `ActionResult` type matches the spec.
- [ ] Register, sign in, sign out, request reset and reset password actions validate with Zod.
- [ ] Users cannot set `role` or `is_suspended` through sign-up.
**Verify:** `npm run test -- auth`; `npm run typecheck`.
**Depends:** T12, T13
**Files:** `lib/actions/result.ts`, `lib/schemas/auth.ts`, `lib/actions/auth.ts`, `tests/unit/auth-schema.test.ts`
**Scope:** M (4 files)

#### T15 — Design tokens, fonts and root layout
**Description:** Apply the visible-mending design system at the shell level.
**Acceptance:**
- [ ] Colour, spacing and semantic tokens from `design-system.md` are CSS variables.
- [ ] Archivo and Atkinson Hyperlegible Next load; `lang="en-GB"`; metadata set.
- [ ] Skip link, reduced-motion support and base focus styles exist.
**Verify:** `npm run build`; visual check at 375/768/1280.
**Depends:** T01
**Files:** `app/globals.css`, `app/layout.tsx`, `lib/fonts.ts`
**Scope:** S (3 files)

#### T16 — shadcn setup and core primitives (ASK FIRST for new deps)
**Description:** Install the component layer and core form primitives.
**Acceptance:**
- [ ] shadcn configured for Tailwind 4 and the project alias.
- [ ] Button, input, label and textarea match tokens and show visible focus.
- [ ] No default shadcn theme colours leak into the UI.
**Verify:** `npm run build`; visual check.
**Depends:** T15
**Files:** `components.json`, `lib/utils.ts`, `components/ui/button.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`
**Scope:** M (6 files; dependency additions need approval)

#### T17 — Feedback and overlay primitives
**Description:** Add the primitives used by forms, tables and admin dialogs.
**Acceptance:**
- [ ] Dialog traps focus and returns focus to the trigger.
- [ ] Badge supports status variants; table is responsive; tabs are keyboard accessible.
- [ ] Toast is DOM-based and announces politely.
**Verify:** `npm run build`; manual keyboard check.
**Depends:** T16
**Files:** `components/ui/dialog.tsx`, `badge.tsx`, `table.tsx`, `tabs.tsx`, `toast.tsx`
**Scope:** M (5 files)

#### T18 — Mend base components
**Description:** Build the product-specific visual vocabulary.
**Acceptance:**
- [ ] `Tag` has the punched-hole listing shape; `StatusBadge` uses icon + text.
- [ ] `StitchLine` appears only for unfinished states.
- [ ] `EmptyState` always offers a next action; `Skeleton` matches final layout.
**Verify:** render tests or visual check; `npm run build`.
**Depends:** T15, T17
**Files:** `components/mend/tag.tsx`, `status-badge.tsx`, `stitch-line.tsx`, `empty-state.tsx`, `skeleton.tsx`
**Scope:** M (5 files)

#### T19 — Login and register pages
**Description:** Ship the first complete vertical auth slice.
**Acceptance:**
- [ ] Register requires name, email, password (min 10) and terms acceptance.
- [ ] Login returns users to the `next` path; errors are inline, not toasts.
- [ ] Pages are keyboard accessible and labelled correctly.
**Verify:** manual sign-up and sign-in against local Supabase; `npm run build`.
**Depends:** T14, T16, T18
**Files:** `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `components/auth/auth-form.tsx`
**Scope:** M (4 files)

#### T20 — Password reset and auth callback
**Description:** Complete the auth recovery path.
**Acceptance:**
- [ ] Reset request always returns a neutral message.
- [ ] Callback exchanges the code; reset page sets a new password.
- [ ] Expired or invalid links show a clear recovery action.
**Verify:** manual flow with local Supabase email inbox.
**Depends:** T19
**Files:** `app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx`, `app/auth/callback/route.ts`
**Scope:** M (3 files)

#### T21 — Account page and update action
**Description:** Let signed-in users manage their account.
**Acceptance:**
- [ ] View and update name and phone; sign out works.
- [ ] Role and provider status are displayed read-only.
- [ ] Suspended accounts see the suspension notice.
**Verify:** manual update; `npm run typecheck`.
**Depends:** T19, T13
**Files:** `app/(customer)/account/page.tsx`, `lib/actions/account.ts`, `lib/schemas/account.ts`, `components/account/account-form.tsx`
**Scope:** M (4 files)

#### T22 — Error, loading and not-found boundaries
**Description:** Make failures and slow states usable and safe.
**Acceptance:**
- [ ] Error boundary offers retry; global error catches root failures.
- [ ] Private resources return 404 without revealing existence.
- [ ] Loading skeletons match the final layout.
**Verify:** `npm run build`; manual forced-error check.
**Depends:** T15, T18
**Files:** `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`, `app/loading.tsx`, `components/mend/error-state.tsx`
**Scope:** M (5 files)

#### T23 — README and DECISIONS baseline
**Description:** Document the foundation before building on it.
**Acceptance:**
- [ ] README covers install, env, Supabase start/reset, seed, first admin and test commands.
- [ ] `DECISIONS.md` records assumptions, dependency additions and deviations.
**Verify:** follow README from a clean shell.
**Depends:** T04–T22
**Files:** `README.md`, `DECISIONS.md`
**Scope:** S (2 files)

#### Checkpoint: Foundation
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` pass.
- [ ] `npm run test:rls` passes against local Supabase.
- [ ] A new user can register, confirm, log in, reset a password and edit their account.
- [ ] Tokens and fonts match the design system at 375/768/1280.
- [ ] **Human review before Phase 2.**

---

### Phase 2 — Discovery

#### T24 — Legal page shells
**Description:** Create footer-reachable placeholder legal pages.
**Acceptance:**
- [ ] Privacy, terms and cookies pages exist and are clearly marked as pending client copy.
- [ ] Shared legal layout supports headings and prose.
**Verify:** `npm run build`; links resolve.
**Depends:** T15, T18
**Files:** `app/(public)/privacy/page.tsx`, `app/(public)/terms/page.tsx`, `app/(public)/cookies/page.tsx`, `components/legal/legal-page.tsx`
**Scope:** S (4 files)

#### T25 — Public shell
**Description:** Build the header, footer and mobile navigation.
**Acceptance:**
- [ ] Navigation: Home, Find Help, Post a Job, Offer Services, Log in/Account.
- [ ] Footer links privacy, terms, contact and pilot notice.
- [ ] Mobile nav is keyboard accessible and closes on route change.
**Verify:** visual check at 375/768/1280; keyboard run.
**Depends:** T24, T16, T18
**Files:** `app/(public)/layout.tsx`, `components/site/site-header.tsx`, `site-footer.tsx`, `mobile-nav.tsx`
**Scope:** M (4 files)

#### T26 — Categories read layer and homepage
**Description:** Ship the landing page and hero search.
**Acceptance:**
- [ ] Only active categories appear in the dropdown.
- [ ] Hero submits service + postcode to `/search`; three primary verbs route correctly.
- [ ] Pilot notice comes from `site_settings`, not hard-coded.
**Verify:** manual at three widths; `npm run build`.
**Depends:** T25, T05
**Files:** `lib/data/categories.ts`, `app/(public)/page.tsx`, `components/mend/hero-search.tsx`, `components/mend/pilot-notice.tsx`, `components/site/photo-strip.tsx`
**Scope:** L (5 files)

#### T27 — Search schemas and actions
**Description:** Implement postcode checking and waitlist capture server-side.
**Acceptance:**
- [ ] `checkPostcode` returns `{ valid, district, inPilot }` and never trusts client parsing.
- [ ] `joinWaitlist` validates email and postcode and records the signup.
- [ ] Both actions return typed results.
**Verify:** `npm run test -- search`; `npm run typecheck`.
**Depends:** T10, T12, T26
**Files:** `lib/schemas/search.ts`, `lib/actions/search.ts`, `tests/unit/search-schema.test.ts`
**Scope:** M (3 files)

#### T28 — Search results, provider cards and waitlist
**Description:** Ship the customer search result path with every state.
**Acceptance:**
- [ ] Returns only approved, active providers offering the category in an enabled district.
- [ ] Parent-category search includes child categories.
- [ ] Invalid, out-of-pilot, empty and results states each have a next action.
- [ ] Result count is announced with `aria-live`; only postcode district is shown.
**Verify:** manual with seeded data; `npm run test:e2e -- search`.
**Depends:** T27, T18
**Files:** `app/(public)/search/page.tsx`, `components/mend/provider-card.tsx`, `search-filters.tsx`, `waitlist-form.tsx`, `lib/data/search.ts`
**Scope:** L (5 files)

#### T29 — Public provider profile
**Description:** Let customers evaluate an approved provider.
**Acceptance:**
- [ ] Approved providers render name, bio, categories, areas, price note and gallery.
- [ ] Pending, rejected, suspended and unknown IDs return 404; owner and admin can preview.
- [ ] Profile includes the platform disclaimer and a "Post a job" prompt.
**Verify:** manual with approved and pending fixtures; `npm run build`.
**Depends:** T28
**Files:** `app/(public)/providers/[id]/page.tsx`, `components/mend/provider-gallery.tsx`, `components/mend/platform-disclaimer.tsx`
**Scope:** M (3 files)

#### T30 — Discovery E2E and accessibility
**Description:** Prove the discovery path and its accessibility.
**Acceptance:**
- [ ] Pilot postcode returns providers; non-pilot shows message and waitlist form.
- [ ] Mobile viewport passes the same flow.
- [ ] Axe reports zero serious/critical issues on home and search.
**Verify:** `npm run test:e2e -- discovery`.
**Depends:** T26–T29
**Files:** `tests/e2e/discovery.spec.ts`, `tests/e2e/accessibility.spec.ts`
**Scope:** M (2 files)

#### Checkpoint: Discovery
- [ ] Home → search → profile works with seeded data.
- [ ] Pilot, non-pilot, invalid and empty states all render.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` pass.
- [ ] **Human review before Phase 3.**

---

### Phase 3 — Provider onboarding

#### T31 — Provider schemas and application action
**Description:** Implement the provider application write path.
**Acceptance:**
- [ ] Bio 40–1500, at least one service, at least one enabled district, declaration accepted.
- [ ] Status is forced to `pending`; audit entry written.
- [ ] Duplicate applications are rejected.
**Verify:** `npm run test -- provider`; `npm run typecheck`.
**Depends:** T14, T05, T13
**Files:** `lib/schemas/provider.ts`, `lib/actions/provider.ts`, `tests/unit/provider-schema.test.ts`
**Scope:** M (3 files)

#### T32 — Application wizard shell and step 1
**Description:** Build the four-step wizard and "About you" step.
**Acceptance:**
- [ ] Reducer handles `about | services | photos | review`; draft persists to `sessionStorage` safely.
- [ ] Step 1 validates provider type, display name, optional business name and bio.
- [ ] Stepper announces the current step and is keyboard usable.
**Verify:** manual refresh mid-wizard; `npm run build`.
**Depends:** T31, T16, T18
**Files:** `app/(provider)/provide/apply/page.tsx`, `components/provider/application-wizard.tsx`, `components/provider/step-about.tsx`
**Scope:** M (3 files)

#### T33 — Wizard step 2: services and areas
**Description:** Let providers choose categories and pilot districts.
**Acceptance:**
- [ ] Active categories including children are selectable.
- [ ] Only enabled districts are selectable; at least one of each is required.
- [ ] Selection is keyboard accessible and survives step navigation.
**Verify:** manual; `npm run build`.
**Depends:** T32, T26
**Files:** `components/provider/step-services.tsx`, `components/mend/district-picker.tsx`
**Scope:** S (2 files)

#### T34 — Wizard step 3: photos and photo actions
**Description:** Implement validated photo upload and management.
**Acceptance:**
- [ ] 1–6 images, JPG/PNG/WebP, max 5 MB, magic-byte check on the server.
- [ ] Owner-only add, reorder, alt text and delete; pending profiles are not public.
- [ ] Upload state shows queued/uploading/done/error.
**Verify:** manual oversized and wrong-type rejection; `npm run test -- photo`.
**Depends:** T32, T07
**Files:** `components/provider/step-photos.tsx`, `components/mend/photo-upload.tsx`, `lib/actions/provider.ts`, `lib/schemas/photo.ts`
**Scope:** L (4 files)

#### T35 — Wizard step 4: review and submit
**Description:** Complete the application flow.
**Acceptance:**
- [ ] Review shows all entered data and photos with edit links back to each step.
- [ ] Declaration is required; submit creates profile, services and photo links.
- [ ] Draft clears on success; user lands on provider dashboard with pending status.
**Verify:** manual end-to-end; `npm run test:e2e -- provider-apply`.
**Depends:** T34, T31
**Files:** `components/provider/step-review.tsx`, `app/(provider)/provide/apply/page.tsx`
**Scope:** S (2 files)

#### T36 — Provider dashboard
**Description:** Show status and profile summary to the provider.
**Acceptance:**
- [ ] Status banner explains pending, approved, rejected with reason, or suspended.
- [ ] Approved providers see links to open jobs and offers; pending providers see what happens next.
- [ ] Profile summary shows services, areas, photos and public-profile link when approved.
**Verify:** manual with each status fixture.
**Depends:** T35
**Files:** `app/(provider)/provide/page.tsx`, `components/provider/status-banner.tsx`, `components/provider/profile-summary.tsx`
**Scope:** M (3 files)

#### T37 — Provider profile edit and reapproval rule
**Description:** Let providers edit their profile without breaking trust rules.
**Acceptance:**
- [ ] Bio, services, areas, photos and price note are editable.
- [ ] Display name or provider type change returns the profile to `pending` when the setting is true.
- [ ] Every edit is audited.
**Verify:** manual edit and status change; `npm run test -- provider`.
**Depends:** T36
**Files:** `components/provider/provider-profile-form.tsx`, `lib/actions/provider.ts`, `lib/schemas/provider.ts`
**Scope:** M (3 files)

#### T38 — Provider onboarding E2E
**Description:** Prove the application path.
**Acceptance:**
- [ ] A new user applies with a photo and sees pending status.
- [ ] The pending profile is not public.
- [ ] Axe reports zero serious issues on the application page.
**Verify:** `npm run test:e2e -- provider-apply`.
**Depends:** T35–T37
**Files:** `tests/e2e/provider-apply.spec.ts`
**Scope:** S (1 file)

#### Checkpoint: Provider onboarding
- [ ] Application with photos reaches pending and is invisible publicly.
- [ ] Dashboard and edit flows work for every status.
- [ ] Unit, RLS and E2E suites pass.
- [ ] **Human review before Phase 4.**

---

### Phase 4 — Marketplace

#### T39 — Job schemas and actions
**Description:** Implement job creation and lifecycle.
**Acceptance:**
- [ ] Title 5–100, description 20–2000, valid pilot postcode, active category, timeframe enum.
- [ ] Up to 4 photos; status starts `open`; district recomputed server-side.
- [ ] Update only while `open`; close works for owner; transitions enforced.
**Verify:** `npm run test -- job`; `npm run typecheck`.
**Depends:** T14, T10, T13
**Files:** `lib/schemas/job.ts`, `lib/actions/jobs.ts`, `tests/unit/job-schema.test.ts`
**Scope:** M (3 files)

#### T40 — Post-job page and draft restore
**Description:** Ship the customer job form.
**Acceptance:**
- [ ] Unauthenticated submit redirects to register/login and returns to the form.
- [ ] Draft survives the auth round trip via `sessionStorage`.
- [ ] Postcode pilot errors are inline; photos validate before upload.
**Verify:** manual logged-out and logged-in runs; `npm run test:e2e -- post-job`.
**Depends:** T39, T18
**Files:** `app/(customer)/post-job/page.tsx`, `components/jobs/post-job-form.tsx`, `components/mend/postcode-field.tsx`
**Scope:** M (3 files)

#### T41 — Customer jobs list and detail
**Description:** Let customers manage their jobs.
**Acceptance:**
- [ ] List shows only the owner's jobs with status and offer count.
- [ ] Detail shows full postcode to the owner only; close action works while open.
- [ ] Skeleton, empty and error states exist.
**Verify:** manual; `npm run build`.
**Depends:** T40
**Files:** `app/(customer)/jobs/page.tsx`, `app/(customer)/jobs/[id]/page.tsx`, `components/jobs/job-card.tsx`, `components/jobs/job-detail.tsx`
**Scope:** M (4 files)

#### T42 — Provider matching jobs and detail
**Description:** Show approved providers the jobs they can answer.
**Acceptance:**
- [ ] Only approved providers access the route.
- [ ] Jobs match category and district; only `open`/`receiving_offers` are listed.
- [ ] Detail shows district only and never other providers' offers.
**Verify:** manual with two providers; `npm run test:rls -- jobs`.
**Depends:** T41
**Files:** `app/(provider)/provide/jobs/page.tsx`, `components/jobs/matching-job-card.tsx`, `app/(provider)/jobs/[id]/page.tsx`
**Scope:** M (3 files)

#### T43 — Offer schemas and actions
**Description:** Implement the offer lifecycle and acceptance transaction.
**Acceptance:**
- [ ] Message 20–1000; price pence or null; one offer per provider per job.
- [ ] First offer moves job to `receiving_offers`.
- [ ] Accepting one offer closes the job, accepts it, declines all others, and releases contact only after acceptance.
**Verify:** `npm run test -- offer`; `npm run test:rls -- offers`.
**Depends:** T39, T11
**Files:** `lib/schemas/offer.ts`, `lib/actions/offers.ts`, `tests/unit/offer-schema.test.ts`
**Scope:** M (3 files)

#### T44 — Offer UI, accept/decline and contact release
**Description:** Ship the offer experience for both sides.
**Acceptance:**
- [ ] Providers send, edit while submitted, and withdraw; optimistic withdraw rolls back on failure.
- [ ] Customers see all offers with provider summary and profile link.
- [ ] Accept/decline confirms, updates statuses, and shows contact details to both parties only after acceptance.
**Verify:** manual two-account flow; `npm run test:e2e -- marketplace`.
**Depends:** T43, T42
**Files:** `components/jobs/offer-form.tsx`, `components/jobs/offer-list.tsx`, `components/jobs/offer-card.tsx`, `app/(customer)/jobs/[id]/page.tsx`
**Scope:** L (4 files)

#### T45 — Report content
**Description:** Add the report link and action.
**Acceptance:**
- [ ] Signed-in users can report a provider or job with a 10–500 character reason.
- [ ] Reports appear for admin review; audit entry written.
- [ ] Duplicate spam is limited.
**Verify:** manual; `npm run test -- report`.
**Depends:** T41, T29
**Files:** `components/mend/report-dialog.tsx`, `lib/actions/reports.ts`, `lib/schemas/report.ts`
**Scope:** S (3 files)

#### T46 — Marketplace E2E
**Description:** Prove the full job-to-contact flow.
**Acceptance:**
- [ ] Customer posts a job with a photo and sees it in My jobs.
- [ ] Matching provider sends an offer; customer accepts; job closes and other offers decline.
- [ ] Contact details appear only after acceptance.
**Verify:** `npm run test:e2e -- marketplace`.
**Depends:** T44, T45, T38
**Files:** `tests/e2e/marketplace.spec.ts`
**Scope:** M (1 file)

#### Checkpoint: Marketplace
- [ ] Job → offer → accept → contact release works with two accounts.
- [ ] Job and offer transitions are enforced in actions and RLS.
- [ ] **Human review before Phase 5.**

---

### Phase 5 — Admin

#### T47 — Admin guard, layout and overview
**Description:** Build the admin shell and counts.
**Acceptance:**
- [ ] Non-admins get a 403/redirect enforced server-side.
- [ ] Overview shows pending/approved providers, open/closed jobs and offers.
- [ ] Admin navigation covers every screen.
**Verify:** manual as customer and admin; `npm run test:rls -- identity`.
**Depends:** T14, T17
**Files:** `app/(admin)/layout.tsx`, `app/(admin)/admin/page.tsx`, `lib/data/admin.ts`, `components/admin/stat-card.tsx`
**Scope:** M (4 files)

#### T48 — Provider queue, review and decisions
**Description:** Let the admin run provider approvals.
**Acceptance:**
- [ ] Queue filters by status and category; detail shows application, photos and extra-checks notice.
- [ ] Approve requires the extra-checks tick when any category requires it.
- [ ] Reject requires a 10–500 character reason; request-more-info stores a note; all actions audited.
**Verify:** manual approve/reject; `npm run test:e2e -- admin`.
**Depends:** T47, T31, T07
**Files:** `app/(admin)/admin/providers/page.tsx`, `app/(admin)/admin/providers/[id]/page.tsx`, `lib/actions/admin.ts`, `components/admin/provider-review.tsx`
**Scope:** L (4 files)

#### T49 — Suspension controls
**Description:** Suspend and reinstate providers and users.
**Acceptance:**
- [ ] Suspended providers disappear from search and public profiles.
- [ ] Suspended users cannot post jobs or send offers and see a clear notice.
- [ ] Suspend/reinstate actions are audited.
**Verify:** manual; `npm run test:rls -- jobs offers`.
**Depends:** T48, T13
**Files:** `lib/actions/admin.ts`, `app/(admin)/admin/users/page.tsx`, `components/admin/user-table.tsx`
**Scope:** M (3 files)

#### T50 — Job and offer moderation
**Description:** Let the admin remove inappropriate content.
**Acceptance:**
- [ ] Admin can view all jobs and offers per job.
- [ ] Removing a job requires a reason and hides it from public and provider views.
- [ ] Removing an offer withdraws it and writes an audit entry.
**Verify:** manual; `npm run test:e2e -- admin`.
**Depends:** T47, T39, T43
**Files:** `app/(admin)/admin/jobs/page.tsx`, `app/(admin)/admin/offers/page.tsx`, `lib/actions/admin.ts`, `components/admin/moderation-table.tsx`
**Scope:** M (4 files)

#### T51 — Categories and pilot area management
**Description:** Give the admin control of reference data.
**Acceptance:**
- [ ] Add, rename, reorder and deactivate categories; set the extra-checks flag.
- [ ] Deactivation hides a category without deleting records.
- [ ] Enable/disable pilot districts; only enabled districts are searchable.
**Verify:** manual; `npm run test:rls -- reference`.
**Depends:** T47, T05
**Files:** `app/(admin)/admin/categories/page.tsx`, `app/(admin)/admin/pilot-area/page.tsx`, `lib/actions/admin.ts`, `components/admin/category-form.tsx`, `components/admin/district-form.tsx`
**Scope:** L (5 files)

#### T52 — Reports and site settings
**Description:** Resolve reports and edit the pilot notice.
**Acceptance:**
- [ ] Reports can be marked reviewed or dismissed; audit entry written.
- [ ] Admin can update `pilot_notice` and `reapprove_on_key_change`.
- [ ] Changes revalidate public pages.
**Verify:** manual; `npm run build`.
**Depends:** T47, T45
**Files:** `app/(admin)/admin/reports/page.tsx`, `lib/actions/admin.ts`, `components/admin/site-settings-form.tsx`
**Scope:** S (3 files)

#### T53 — CSV exports
**Description:** Export providers, jobs and waitlist signups.
**Acceptance:**
- [ ] Route handlers are admin-only and validate `Origin`.
- [ ] CSV headers are correct; values are escaped; no unnecessary PII.
**Verify:** `npm run test -- csv`; manual download.
**Depends:** T47
**Files:** `app/api/admin/export/[type]/route.ts`, `lib/csv.ts`, `tests/unit/csv.test.ts`
**Scope:** S (3 files)

#### T54 — Admin E2E and accessibility
**Description:** Prove the admin path and permissions.
**Acceptance:**
- [ ] Non-admin gets 403 on every admin route.
- [ ] Approve makes a provider public; suspend hides them; remove hides a job.
- [ ] Axe reports zero serious issues on the provider queue.
**Verify:** `npm run test:e2e -- admin`.
**Depends:** T48–T53
**Files:** `tests/e2e/admin.spec.ts`
**Scope:** M (1 file)

#### Checkpoint: Admin
- [ ] Admin can approve, reject, request info, suspend, reinstate, moderate, manage reference data and export.
- [ ] Provider approval makes them public; suspension removes them.
- [ ] **Human review before Phase 6.**

---

### Phase 6 — Notifications

#### T55 — Event layer and notification outbox
**Description:** Implement non-blocking domain events.
**Acceptance:**
- [ ] `emit(event, payload)` writes notification rows and sends after the response.
- [ ] Failures are caught, logged without PII, and marked `failed` with the error.
- [ ] A user action never fails because an email failed.
**Verify:** `npm run test -- events`; manual with an invalid Resend key.
**Depends:** T04, T02
**Files:** `lib/events.ts`, `lib/emails/send.ts`, `tests/unit/events.test.ts`
**Scope:** M (3 files)

#### T56 — Provider lifecycle email templates
**Description:** Build the provider application and decision emails.
**Acceptance:**
- [ ] Templates for applied (provider + admin), approved, rejected with reason, more info requested.
- [ ] Branded HTML plus text fallback; absolute links from `NEXT_PUBLIC_SITE_URL`.
- [ ] No sensitive data beyond what the recipient needs.
**Verify:** render previews; `npm run test -- emails`.
**Depends:** T55
**Files:** `emails/components/email-layout.tsx`, `emails/provider-applied.tsx`, `provider-approved.tsx`, `provider-rejected.tsx`, `provider-more-info.tsx`
**Scope:** M (5 files)

#### T57 — Job and offer email templates
**Description:** Build the marketplace emails.
**Acceptance:**
- [ ] Templates for job created (customer + admin), new offer, offer accepted, offer declined.
- [ ] Copy matches the design-system voice; links resolve.
**Verify:** render previews.
**Depends:** T55
**Files:** `emails/job-created.tsx`, `emails/offer-created.tsx`, `emails/offer-accepted.tsx`, `emails/offer-declined.tsx`
**Scope:** M (4 files)

#### T58 — Admin, report and waitlist templates
**Description:** Build the remaining notification emails.
**Acceptance:**
- [ ] Templates for job removed with reason, new report, waitlist signup.
- [ ] Admin recipients come from `ADMIN_NOTIFICATION_EMAIL`.
**Verify:** render previews.
**Depends:** T55
**Files:** `emails/job-removed.tsx`, `emails/report-created.tsx`, `emails/waitlist-joined.tsx`
**Scope:** S (3 files)

#### T59 — Wire events, retry route and tests
**Description:** Connect every trigger and add failure recovery.
**Acceptance:**
- [ ] Every trigger in the spec emits exactly one notification to the correct recipient.
- [ ] Retry route is admin-only and re-sends only failed rows.
- [ ] Tests assert recipient, template and non-blocking behaviour.
**Verify:** `npm run test -- notifications`; `npm run test:e2e -- admin`.
**Depends:** T56–T58, T48, T50, T52
**Files:** `lib/actions/*.ts`, `app/api/notifications/retry/route.ts`, `tests/unit/notification-wiring.test.ts`
**Scope:** M (3+ files)

#### Checkpoint: Notifications
- [ ] Each trigger sends exactly one email; failed sends are logged and retryable.
- [ ] No action fails because of email.
- [ ] **Human review before Phase 7.**

---

### Phase 7 — Legal and analytics

#### T60 — Legal content and consent
**Description:** Replace placeholders with client-approved copy and enforce consent.
**Acceptance:**
- [ ] Privacy, terms and cookies contain the approved text and are linked from every footer.
- [ ] Sign-up requires terms acceptance for customers and providers.
- [ ] No "placeholder" marker remains.
**Verify:** manual link check; `npm run test:e2e -- auth`.
**Depends:** T24, T19
**Files:** `app/(public)/privacy/page.tsx`, `app/(public)/terms/page.tsx`, `app/(public)/cookies/page.tsx`, `components/legal/legal-page.tsx`
**Scope:** S (4 files). **Blocked on client copy.**

#### T61 — Analytics hook and events
**Description:** Record page views and the agreed product events.
**Acceptance:**
- [ ] Page views and search, job submission and provider sign-up events fire once.
- [ ] No PII is sent; the chosen provider is isolated behind one module.
- [ ] Disabled gracefully when no analytics key is configured.
**Verify:** manual network check; `npm run test -- analytics`.
**Depends:** T15
**Files:** `lib/analytics.ts`, `components/analytics.tsx`, `app/layout.tsx`
**Scope:** S (3 files). **Provider choice is an open question.**

#### T62 — Consent banner (conditional)
**Description:** Add a consent banner only if the chosen tool requires it.
**Acceptance:**
- [ ] Banner stores the choice and blocks non-essential scripts until consent.
- [ ] Keyboard accessible; does not reappear after a decision.
**Verify:** manual with cleared storage.
**Depends:** T61
**Files:** `components/consent-banner.tsx`, `lib/consent.ts`
**Scope:** S (2 files)

#### Checkpoint: Legal and analytics
- [ ] Legal pages are final and linked everywhere.
- [ ] Consent and analytics behave per the chosen tool.
- [ ] **Human review before Phase 8.**

---

### Phase 8 — Hardening and launch

#### T63 — Security headers and rate limiting
**Description:** Harden the app before exposure.
**Acceptance:**
- [ ] CSP allows Supabase, Resend and fonts; `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'` set.
- [ ] Sign-up, login, waitlist, job creation and offer creation are rate limited.
- [ ] Limiter limitation is documented.
**Verify:** `npm run test -- rate-limit`; header check with `curl -I`.
**Depends:** T12, T27, T39, T43
**Files:** `next.config.ts`, `lib/rate-limit.ts`, `tests/unit/rate-limit.test.ts`
**Scope:** M (3 files)

#### T64 — RLS and permission regression
**Description:** Re-run and complete the policy suite against the final schema.
**Acceptance:**
- [ ] Every policy group from the master prompt has a passing test.
- [ ] Suspended users and unapproved providers are blocked everywhere.
- [ ] Contact release is tested for both allowed and denied callers.
**Verify:** `npm run test:rls`.
**Depends:** T09, T49
**Files:** `tests/rls/*.test.ts`, `tests/unit/permissions.test.ts`
**Scope:** M (test updates)

#### T65 — Full E2E, mobile viewports and CI
**Description:** Make the full suite runnable and green.
**Acceptance:**
- [ ] Six required flows pass on desktop Chromium and a mobile viewport.
- [ ] Playwright starts the app and local Supabase in CI.
- [ ] CI blocks merge on failure.
**Verify:** `npm run test:e2e`; CI run.
**Depends:** T30, T46, T54, T03
**Files:** `playwright.config.ts`, `tests/e2e/*.spec.ts`, `.github/workflows/ci.yml`
**Scope:** M (3+ files)

#### T66 — Accessibility and responsive pass
**Description:** Close the accessibility and layout gaps.
**Acceptance:**
- [ ] Axe zero serious/critical on home, search, post-job and provider profile.
- [ ] Keyboard-only post-a-job works; focus is visible; targets are 44px.
- [ ] Layout holds from 320px to 1280px; reduced motion respected.
**Verify:** `npm run test:e2e -- accessibility`; manual keyboard run.
**Depends:** T65
**Files:** `app/globals.css`, `components/**`, `tests/e2e/accessibility.spec.ts`
**Scope:** M (cross-cutting fixes)

#### T67 — Handover documentation and admin guide
**Description:** Make the project transferable.
**Acceptance:**
- [ ] README covers setup, migrations, seed, first admin, env, deploy and troubleshooting.
- [ ] Admin guide covers approvals, moderation, categories, coverage and exports.
- [ ] Handover lists third-party accounts and owners.
**Verify:** follow both docs from a clean environment.
**Depends:** all prior tasks
**Files:** `README.md`, `DECISIONS.md`, `docs/admin-guide.md`, `docs/handover.md`
**Scope:** M (4 files)

#### T68 — Manual test script and acceptance run
**Description:** Verify every client acceptance criterion.
**Acceptance:**
- [ ] Manual script covers every criterion in features 01–10.
- [ ] Results recorded with pass/fail and evidence.
- [ ] Defects are triaged into fix or accepted deviation.
**Verify:** run the script on staging.
**Depends:** T66
**Files:** `docs/manual-test-script.md`
**Scope:** M (1 file)

#### T69 — Staging and production deployment
**Description:** Ship to client-owned accounts.
**Acceptance:**
- [ ] Staging preview accepted by the client.
- [ ] Production runs on client-owned Vercel and Supabase with SSL and correct env vars.
- [ ] Smoke tests pass; rollback procedure documented.
**Verify:** production smoke run; `npm run build`.
**Depends:** T67, T68, T03
**Files:** `docs/deploy.md`, `.env.example`, `vercel.json` (only if needed)
**Scope:** M (3 files). **Blocked on client accounts and DNS.**

#### Checkpoint: Complete
- [ ] All success criteria in `SPEC.md` §8 are met.
- [ ] `lint`, `typecheck`, unit, RLS and E2E suites pass.
- [ ] Client has accepted staging and production is live.
- [ ] Handover package delivered.

---

## Dependency graph (summary)

```
T01 → T02 → T04 → T05
        │      ├── T06 → T08 → T09
        │      ├── T07
        │      └── T55 → T56/T57/T58 → T59
        └── T12 → T13 → T14 → T19 → T20
                     │      └── T21
                     └── T15 → T16 → T17 → T18 → T19

T10, T11 → T39/T43
T26 → T27 → T28 → T29 → T30
T31 → T32 → T33/T34 → T35 → T36 → T37 → T38
T39 → T40 → T41 → T42 → T44 → T46
T47 → T48 → T49
T47 → T50/T51/T52/T53 → T54
T63/T64/T65/T66 → T68 → T69
```

---

## Parallelization

**Safe to parallelize once foundation is complete:**
- `discovery` and `provider-onboarding` share only categories/districts and can run in parallel after T26.
- `notifications` templates (T56–T58) are independent of each other.
- `legal-and-analytics` (T60–T62) is independent of marketplace and admin.
- Documentation (T67) can start once routes stabilise.

**Must stay sequential:**
- Schema → seed → RLS → RLS tests.
- Auth actions → auth pages → account.
- Job actions → offer actions → acceptance transaction → contact release.
- Provider application → admin approval (the approval E2E depends on both).

**Needs a contract first:**
- Provider public visibility contract (`provider-onboarding` → `discovery`, `marketplace`).
- Contact release contract (`marketplace` → `admin`, `notifications`).
- Notification event names and payloads (`notifications` consumed by every module).

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Project sits inside the home-directory git repo | High | T03 is ask-first; separate repo before CI and handover |
| Placeholder categories and districts | Medium | Seed from one source file; treat changes as migrations |
| Next.js 16 API drift | Medium | Read `node_modules/next/dist/docs/` before each unfamiliar API; keep framework-specific code isolated |
| RLS tests skipped in CI | High | CI starts local Supabase before `test:rls`; no silent skip |
| Email deliverability and DNS | Medium | Client-owned Resend domain; retry route; failures never block actions |
| Photo upload abuse | Medium | Server magic-byte check, size/MIME limits, bucket policies, count limit |
| Legal copy arrives late | Medium | Placeholder pages clearly marked; launch blocked until replaced |
| Scope creep | Medium | `SPEC.md` boundaries; out-of-scope list enforced; ask first |
| shadcn/Tailwind 4 incompatibility | Low | Verify in T16 before building screens |
| Contact leak before acceptance | High | RLS + security-definer function + E2E assertion |
| Admin approval E2E needs two modules | Medium | Sequence approval test in Phase 5, not Phase 3 |

---

## Open questions that can block tasks

| Question | Blocks |
|---|---|
| Approve separating the project into its own git repo | T03, T65, T69 |
| Confirm pilot districts and area names | T05, T26, T28 |
| Confirm categories and extra-checks flags | T05, T33, T51 |
| Approve the design-system proposal or supply brand assets | T15, T16 |
| Confirm first admin ownership and handover method | T23, T48 |
| Confirm Next 16 `cacheComponents` / `partialPrefetching` | T04, T15 |
| Confirm 1-photo minimum for provider applications | T31, T34 |
| Confirm `reapprove_on_key_change = true` | T37, T52 |
| Supply legal copy | T60, T68, T69 |
| Choose analytics tool and consent requirement | T61, T62 |
| Confirm sender domain and DNS access | T56–T59 |
| Confirm warranty length and Supabase plan | T67, T69 |

Non-blocking for Phase 1: legal copy, analytics, sender DNS, warranty and Supabase plan. Everything in Phase 1 can start once the repo decision, districts, categories, brand approval and first-admin ownership are answered.

---

## Approval

This plan and `tasks/todo.md` are submitted for review. On approval, implementation starts at **T01** and stops at the **Foundation checkpoint** for review.
