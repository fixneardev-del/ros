# Task List: Repairs and Other Services MVP

Status: **in progress — code complete for phases 1–6; acceptance verification pending**
Plan: `tasks/plan.md`
Spec: `SPEC.md`
Capability map: `CAPABILITY-MAP.md`

Checkboxes are acceptance gates. They stay open until the task's verification is complete. The code-complete inventory and current blockers are in `.context/progress.md`.

## Current gate

Foundation checkpoint. Lint, typecheck, unit tests and the production build pass. RLS tests, E2E tests and live Supabase/Resend flows have not run because credentials are absent.

| Phase | Code | Acceptance |
|---|---|---|
| 0. Guardrails | Done | Unit harness verified; own repo and CI baseline in place |
| 1. Foundation | Done | RLS and auth E2E pending |
| 2. Discovery | Done | E2E and accessibility pending |
| 3. Provider onboarding | Done | E2E pending |
| 4. Marketplace | Done | Two-account E2E pending |
| 5. Admin | Done | E2E pending |
| 6. Notifications | Done | Live send and retry pending |
| 7. Legal and analytics | Partial | Client copy and tool choice pending |
| 8. Hardening and launch | Partial | Regression, CI and deployment pending |

Tick a task only when its acceptance criteria and verification are complete.

---

## Phase 0 — Guardrails

- [x] T01 — Test and script harness (`package.json`, `vitest.config.mts`, `tests/setup.ts`)
- [x] T02 — Environment contract (`.env.example`, `lib/env.ts`, `tests/unit/env.test.ts`)
- [x] T03 — Project-owned repository and CI baseline (own repo initialised; `.github/workflows/ci.yml` present)

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
- [ ] T12 — Supabase clients and session middleware
- [ ] T13 — Format and permission helpers
- [ ] T14 — Result type, auth schemas and auth actions
- [ ] T15 — Design tokens, fonts and root layout
- [ ] T16 — shadcn setup and core primitives (ASK FIRST for new deps)
> The public, auth and job pages now use the landing design system through a `.studio` wrapper; the signed-in dashboards keep the original tokens. Route groups `(public)`, `(auth)` and `(studio)` render `StudioShell`; `(customer)`, `(provider)` and `(admin)` render `AppShell`. See `DECISIONS.md`.
- [ ] T17 — Feedback and overlay primitives
- [ ] T18 — Mend base components
- [ ] T19 — Login and register pages
- [ ] T20 — Password reset and auth callback
- [ ] T21 — Account page and update action
- [ ] T22 — Error, loading and not-found boundaries
- [ ] T23 — README and DECISIONS baseline

### Checkpoint: Foundation
- [x] `npm run lint`, `npm run typecheck`, `npm run test` pass
- [x] `npm run test:rls` passes against a real Postgres with the Supabase schemas stubbed
- [ ] Register, confirm, log in, reset password and edit account work (needs live Supabase Auth)
- [x] Tokens and fonts match the design system at 375/768/1280
- [ ] Lighthouse accessibility score 90 or more (not measured yet)
- [ ] Human review before Phase 2

## Phase 2 — Discovery

- [ ] T24 — Legal page shells
- [ ] T25 — Public shell (header, footer, mobile nav)
- [ ] T26 — Categories read layer and homepage
- [ ] T27 — Search schemas and actions
- [ ] T28 — Search results, provider cards and waitlist
- [ ] T29 — Public provider profile
- [ ] T30 — Discovery E2E and accessibility

### Checkpoint: Discovery
- [ ] Home → search → profile works with seeded data
- [ ] Pilot, non-pilot, invalid and empty states render
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` pass
- [ ] Human review before Phase 3

## Phase 3 — Provider onboarding

- [ ] T31 — Provider schemas and application action
- [ ] T32 — Application wizard shell and step 1
- [ ] T33 — Wizard step 2: services and areas
- [ ] T34 — Wizard step 3: photos and photo actions
- [ ] T35 — Wizard step 4: review and submit
- [ ] T36 — Provider dashboard
- [ ] T37 — Provider profile edit and reapproval rule
- [ ] T38 — Provider onboarding E2E

### Checkpoint: Provider onboarding
- [ ] Application with photos reaches pending and is invisible publicly
- [ ] Dashboard and edit flows work for every status
- [ ] Unit, RLS and E2E suites pass
- [ ] Human review before Phase 4

## Phase 4 — Marketplace

- [ ] T39 — Job schemas and actions
- [ ] T40 — Post-job page and draft restore
- [ ] T41 — Customer jobs list and detail
- [ ] T42 — Provider matching jobs and detail
- [ ] T43 — Offer schemas and actions
- [ ] T44 — Offer UI, accept/decline and contact release
- [ ] T45 — Report content
- [ ] T46 — Marketplace E2E

### Checkpoint: Marketplace
- [ ] Job → offer → accept → contact release works with two accounts
- [ ] Job and offer transitions are enforced in actions and RLS
- [ ] Human review before Phase 5

## Phase 5 — Admin

- [x] T47 — Admin guard, layout and overview
- [x] T48 — Provider queue, review and decisions
- [x] T49 — Suspension controls
- [x] T50 — Job and offer moderation
- [x] T51 — Categories and pilot area management
- [x] T52 — Reports and site settings
- [x] T53 — CSV exports
- [ ] T54 — Admin E2E and accessibility (E2E covers the anonymous admin redirect only; signed-in admin flows need credentials)

### Checkpoint: Admin
- [x] Admin can approve, reject, request info, suspend, reinstate, moderate, manage reference data and export
- [x] Approval makes a provider public; suspension removes them
- [ ] Human review before Phase 6

## Phase 6 — Notifications

- [x] T55 — Event layer and notification outbox
- [x] T56 — Provider lifecycle email templates
- [x] T57 — Job and offer email templates
- [x] T58 — Admin, report and waitlist templates
- [x] T59 — Wire events, retry route and tests

### Checkpoint: Notifications
- [ ] Each trigger sends exactly one email (needs live Resend)
- [x] No action fails because of email
- [ ] Human review before Phase 7

## Phase 7 — Legal and analytics

- [ ] T60 — Legal content and consent (legal copy still on the client; pages are marked pilot copy)
- [x] T61 — Analytics events (first party and cookie free, off by default)
- [ ] T62 — Consent banner (only needed if the chosen tool sets cookies)

### Checkpoint: Legal and analytics
- [ ] Legal pages are final and linked everywhere
- [x] Consent and analytics behave per the chosen tool
- [ ] Human review before Phase 8

## Phase 8 — Hardening and launch

- [x] T63 — Security headers and rate limiting
- [x] T64 — RLS and permission regression (5 SQL files, including admin capabilities)
- [x] T65 — Full E2E, mobile viewports and CI (19 Playwright tests pass; signed-in flows wait on credentials)
- [x] T66 — Accessibility and responsive pass (studio pages checked at 375/1280 with zero horizontal overflow; Lighthouse on `/`, `/search`, `/login`, `/privacy`, `/terms` and `/cookies`: performance 90–92, accessibility 100, best practices 100, SEO 100)
- [x] T67 — Handover documentation and admin guide
- [x] T68 — Manual test script and acceptance run
- [ ] T69 — Staging and production deployment

### Checkpoint: Complete
- [ ] All success criteria in `SPEC.md` §8 are met
- [ ] Lint, typecheck, unit, RLS and E2E suites pass
- [ ] Client has accepted staging and production is live
- [x] Handover package delivered

---

## Blockers

Resolved on 2026-11-09: the project is its own git repository; pilot districts
`G12`, `G11`, `G3` and `G4` are final; the seven starter categories and their
flags are final; the first admin is the account whose email is
`ADMIN_NOTIFICATION_EMAIL`.

- All live verification — Supabase URL, anon key and service-role key are absent; RLS, auth, storage and email flows cannot run.
- T15, T16 — brand assets or approval of the design-system proposal
- T31, T34 — confirm 1-photo minimum
- T37, T52 — confirm `reapprove_on_key_change`
- T60, T68, T69 — client legal copy
- T61 — a hosted analytics tool, if the client prefers one to the first party collector
- T56–T59 — sender domain and DNS
- T67, T69 — warranty length and Supabase plan
