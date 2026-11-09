# Capability Map: Repairs and Other Services MVP

Pilot: Glasgow West End and selected university communities.

This map is the index of what gets built. Module ids are stable and must not be renamed mid-initiative. Module specs are written as `SPEC-<module-id>.md` from the source requirements in `.context/NN-*.md` before that module's plan begins.

## Modules

| Module id | Responsibility | Depends on | Source requirements |
|---|---|---|---|
| `foundation` | App shell, design tokens and fonts, Supabase clients, database schema and seed, auth, roles, middleware, RLS baseline, postcode and transition libraries, test harness | — | 02, 11 (security baseline) |
| `discovery` | Homepage, navigation, service categories, pilot coverage, service + postcode search, waitlist capture | `foundation` | 01, 03, 04 |
| `provider-onboarding` | Provider application wizard, photo upload, public profile, provider dashboard | `foundation`, `discovery` (categories, districts) | 05 |
| `marketplace` | Customer job requests, job photos, provider offers, accept/decline, contact release, reports | `foundation`, `discovery`, `provider-onboarding` | 06, 07 |
| `admin` | Admin overview, provider approval queue, job/offer moderation, categories, pilot area, users, reports, CSV exports | `foundation`, `discovery`, `provider-onboarding`, `marketplace` | 08 |
| `notifications` | Domain events, transactional email templates, notification outbox, retry route | `foundation`, `provider-onboarding`, `marketplace`, `admin` | 09 |
| `legal-and-analytics` | Privacy, terms, cookies, sign-up consent, analytics events | `foundation` | 10 |
| `hardening-and-launch` | Security headers, rate limiting, RLS tests, E2E suite, accessibility pass, deployment, handover | all modules | 11 |

## Dependency direction

```
foundation
  ├── discovery ──┐
  │               ├── provider-onboarding ──┐
  │               │                          ├── marketplace ──┐
  │               │                          │                 ├── admin
  │               │                          │                 │
  │               └──────────────────────────┴─────────────────┴── notifications
  ├── legal-and-analytics
  └── hardening-and-launch (depends on all)
```

No cycles. If two modules need each other, they merge. Contracts between modules live in the provider module's spec (for example, `provider-onboarding` owns the approved-provider contract that `discovery` and `marketplace` read).

## Build order

| Phase | Modules | Exit gate |
|---|---|---|
| 1 | `foundation` | Schema + seed applied, auth and roles work, tokens and fonts applied, `postcode.ts` and `transitions.ts` tested, lint/typecheck/unit green |
| 2 | `discovery`, `provider-onboarding` | Home → search → provider profile works; provider applies with photos and appears pending; admin-visible queue data exists |
| 3 | `marketplace`, `admin` | Job → offer → accept → contact release works; admin can approve, reject, suspend, remove; permissions verified |
| 4 | `notifications`, `legal-and-analytics`, `hardening-and-launch` | Every event sends exactly one email; legal pages live; RLS/E2E/a11y suites pass; deployed and handed over |

## Approval gate

Approved 2026-11-08. The project plan is in review at `tasks/plan.md`. Per-module specs are derived from `.context/` at the start of each module's phase; implementation starts only after the plan is approved.
