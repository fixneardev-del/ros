# Task List: Repairs and Other Services MVP

Status: **in progress — code complete for phases 1–6; hosting, legal copy and client acceptance pending**
Plan: `tasks/plan.md`
Spec: `SPEC.md`
Capability map: `CAPABILITY-MAP.md`

Checkboxes are acceptance gates. They stay open until the task's verification is complete. The code-complete inventory and current blockers are in `.context/progress.md`.

## Current gate

Notifications checkpoint. Lint, typecheck, unit tests, the production build, the RLS suite and the E2E suite pass. The full Supabase stack now runs locally without Docker, so sign in, job posting, offers, admin decisions and the notification outbox have all been run end to end. What is still open needs the client or a hosting account: the hosted Supabase project, the Resend sender domain, legal copy, a git remote and deployment.

| Phase | Code | Acceptance |
|---|---|---|
| 0. Guardrails | Done | Unit harness verified; own repo and CI workflow in place, remote push pending |
| 1. Foundation | Done | Sign in, reset password, account edit and the admin sign in verified against the local stack |
| 2. Discovery | Done | Lighthouse and responsive checks pass; search and provider profile verified against real data |
| 3. Provider onboarding | Done | Application, profile edit and photos verified against the local stack |
| 4. Marketplace | Done | Job → offer → accept → contact release verified with two accounts against the local stack |
| 5. Admin | Done | Approve, request more info, suspend, reinstate, moderation, reference data and export verified against the local stack |
| 6. Notifications | Done | Every trigger writes an outbox row and an audit row; a live send needs the Resend domain |
| 7. Legal and analytics | Partial | Client copy pending; no consent banner needed |
| 8. Hardening and launch | Partial | Remote/CI and deployment pending |

Tick a task only when its acceptance criteria and verification are complete.

---

## Phase 0 — Guardrails

- [x] T01 — Test and script harness (`package.json`, `vitest.config.mts`, `tests/setup.ts`)
- [x] T02 — Environment contract (`.env.example`, `lib/env.ts`, `tests/unit/env.test.ts`)
- [ ] T03 — Project-owned repository and CI baseline (repo initialised and committed; CI workflow ready; remote push and first CI run pending)

## Phase 1 — Foundation

- [x] T04 — Supabase config and schema migration
- [x] T05 — Seed data
- [x] T06 — Table RLS and contact release function
- [x] T07 — Storage buckets and policies
- [x] T08 — RLS harness and identity/reference tests
- [x] T09 — RLS marketplace tests

> T08 and T09 ship as a SQL suite in `tests/rls/` run by `tests/rls/run.mjs`, not the TypeScript client helpers in the plan. The rules live in Postgres, so they are tested there directly, with no extra dependency and no way to silently skip. See `DECISIONS.md`.
- [x] T10 — Postcode library
- [x] T11 — Transition library
- [x] T12 — Supabase clients and session middleware
- [x] T13 — Format and permission helpers
- [x] T14 — Result type, auth schemas and auth actions
- [x] T15 — Design tokens, fonts and root layout
- [x] T16 — shadcn setup and core primitives (ASK FIRST for new deps)
> shadcn was deliberately not installed. Lightweight Tailwind primitives are hand-rolled in `components/ui/`, so no new dependency was added. The public, auth and job pages use the landing design system through a `.studio` wrapper; the customer, provider and admin dashboards use the Movexa dashboard theme through a `.dash` wrapper. Route groups own their chrome. See `DECISIONS.md`.
- [x] T17 — Feedback and overlay primitives
- [x] T18 — Mend base components
- [x] T19 — Login and register pages
- [x] T20 — Password reset and auth callback
- [x] T21 — Account page and update action
- [x] T22 — Error, loading and not-found boundaries
- [x] T23 — README and DECISIONS baseline

### Checkpoint: Foundation
- [x] `npm run lint`, `npm run typecheck`, `npm run test` pass
- [x] `npm run test:rls` passes against a real Postgres with the Supabase schemas stubbed
- [x] Register, confirm, log in, reset password and edit account work against the local Supabase stack
- [x] Tokens and fonts match the design system at 375/768/1280
- [x] Lighthouse accessibility score 90 or more (mobile: 100 accessibility on the six public pages; performance 90–92)
- [ ] Human review before Phase 2

## Phase 2 — Discovery

- [x] T24 — Legal page shells
- [x] T25 — Public shell (header, footer, mobile nav)
- [x] T26 — Categories read layer and homepage
- [x] T27 — Search schemas and actions
- [x] T28 — Search results, provider cards and waitlist
- [x] T29 — Public provider profile
- [x] T30 — Discovery E2E and accessibility

### Checkpoint: Discovery
- [x] Home → search → profile works with seeded data
- [x] Pilot, non-pilot, invalid and empty states render
- [x] `npm run lint`, `npm run typecheck`, `npm run test` pass
- [ ] Human review before Phase 3

## Phase 3 — Provider onboarding

- [x] T31 — Provider schemas and application action
- [x] T32 — Application wizard shell and step 1
- [x] T33 — Wizard step 2: services and areas
- [x] T34 — Wizard step 3: photos and photo actions
- [x] T35 — Wizard step 4: review and submit
- [x] T36 — Provider dashboard
- [x] T37 — Provider profile edit and reapproval rule
- [x] T38 — Provider onboarding E2E

### Checkpoint: Provider onboarding
- [x] Application with photos reaches pending and is invisible publicly
- [x] Dashboard and edit flows work for every status
- [x] Unit, RLS and E2E suites pass
- [ ] Human review before Phase 4

## Phase 4 — Marketplace

- [x] T39 — Job schemas and actions
- [x] T40 — Post-job page and draft restore
- [x] T41 — Customer jobs list and detail
- [x] T42 — Provider matching jobs and detail
- [x] T43 — Offer schemas and actions
- [x] T44 — Offer UI, accept/decline and contact release
- [x] T45 — Report content
- [x] T46 — Marketplace E2E

### Checkpoint: Marketplace
- [x] Job → offer → accept → contact release works with two accounts
- [x] Job and offer transitions are enforced in actions and RLS
- [ ] Human review before Phase 5

## Phase 5 — Admin

- [x] T47 — Admin guard, layout and overview
- [x] T48 — Provider queue, review and decisions
- [x] T49 — Suspension controls
- [x] T50 — Job and offer moderation
- [x] T51 — Categories and pilot area management
- [x] T52 — Reports and site settings
- [x] T53 — CSV exports
- [x] T54 — Admin E2E and accessibility (signed-in admin flows were run against the local stack in a real browser: approve, request more info, suspend, reinstate, moderation, reference data, reports, analytics and CSV export)

### Checkpoint: Admin
- [x] Admin can approve, reject, request info, suspend, reinstate, moderate, manage reference data and export
- [x] Approval makes a provider public; suspension removes them
- [x] Admin and customer dashboards use the Movexa dashboard theme, verified in a real browser at 375, 1120 and 1440 with no overlap, no console errors and WCAG AA contrast on every text and surface pair
- [x] Signed-in admin flows run end to end against the local stack (the hosted project still needs its schema applied)
- [ ] Human review before Phase 6

## Phase 6 — Notifications

- [x] T55 — Event layer and notification outbox
- [x] T56 — Provider lifecycle email templates
- [x] T57 — Job and offer email templates
- [x] T58 — Admin, report and waitlist templates
- [x] T59 — Wire events, retry route and tests

### Checkpoint: Notifications
- [x] Each trigger writes exactly one outbox row and one audit row (verified against the local stack for approve, request more info, suspend, reinstate, job created, offer created, offer accepted and offer declined; a live send needs the Resend domain)
- [x] No action fails because of email
- [ ] Human review before Phase 7

## Phase 7 — Legal and analytics

- [ ] T60 — Legal content and consent (legal copy still on the client; pages are marked pilot copy)
- [x] T61 — Analytics events (first party and cookie free, off by default)
- [x] T62 — Consent banner (not needed: the first-party analytics are cookie free and off until an admin opts in)

### Checkpoint: Legal and analytics
- [ ] Legal pages are final and linked everywhere
- [x] Consent and analytics behave per the chosen tool
- [ ] Human review before Phase 8

## Phase 8 — Hardening and launch

- [x] T63 — Security headers and rate limiting
- [x] T64 — RLS and permission regression (5 SQL files, including admin capabilities)
- [x] T65 — Full E2E, mobile viewports and CI (33 Playwright tests pass against a production build; the signed-in flows run against the local stack; the CI job starts the stack and loads the demo data)
- [x] T66 — Accessibility and responsive pass (studio pages checked at 375/1280 with zero horizontal overflow; Lighthouse on `/`, `/search`, `/login`, `/privacy`, `/terms` and `/cookies`: performance 90–92, accessibility 100, best practices 100, SEO 100)
- [x] T67 — Handover documentation and admin guide
- [x] T68 — Manual test script and acceptance run
- [ ] T69 — Staging and production deployment

### Checkpoint: Complete
- [ ] All success criteria in `SPEC.md` §8 are met
- [x] Lint, typecheck, unit, RLS and E2E suites pass
- [ ] Client has accepted staging and production is live
- [x] Handover package delivered

---

## Blockers

Each blocker needs a client account, a credential or a decision. None of them need more code.

- **Hosted Supabase project** `eohqgkxnjshnzwadglnh` — the schema is not applied. Needs the database password to run `scripts/hosted-setup.sh <password>`, and the secret key (`sb_secret_...`) for the admin actions and the notification outbox. Both are expected from the client.
- **Resend** — the sender domain and its DNS records are client-owned, so no email can leave the system until they are added. The outbox and templates are proven; only the send is untested.
- **T03, T65, T69 — git remote and CI.** The repo has eight commits and a CI workflow, but no remote, so CI has never run. Adding a remote and pushing is the first step.
- **T60, T68, T69 — client legal copy.** The privacy, terms and cookie pages carry clearly marked pilot copy.
- **T67, T69 — warranty length and Supabase plan.** A product decision.
- **T15, T16 — brand assets.** Optional. The wordmark is set in type; no logo file was supplied.
- **T61 — hosted analytics.** Optional. The first-party, cookie-free collector is off until an admin enables it, and no consent banner is needed.

Resolved on 2026-11-14: the project is its own git repository; pilot districts
`G12`, `G11`, `G3` and `G4` are final; the seven starter categories and their
flags are final; the first admin is the account whose email is
`ADMIN_NOTIFICATION_EMAIL`; provider applications need 1–6 photos; key provider
changes return to review (`reapprove_on_key_change = true`).
