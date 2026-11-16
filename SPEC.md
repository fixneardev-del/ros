# Spec: Repairs and Other Services MVP

Status: **approved 2026-11-08** — planning in progress
Date: 2026-11-08
Source of truth: `.context/00-README.md`, `.context/01`–`11`, `.context/design-system.md`, `.context/interface.md`, `.context/master-build-prompt.md`, `CAPABILITY-MAP.md`

---

## Assumptions I'm making

Correct any of these now; otherwise the spec and plan will proceed on them.

1. **Runtime:** Node.js LTS with npm. Next.js 16.4.5 App Router, React 19.3.0, TypeScript strict. `cacheComponents` and `partialPrefetching` in `next.config.ts` are intentional. Next 16 differs from older versions, so the relevant guide in `node_modules/next/dist/docs/` is read before writing any Next-specific code.
2. **Hosting:** Vercel for the app, Supabase (client-owned project) for Postgres, Auth and Storage. Local development uses the Supabase CLI.
3. **Email:** Resend with a client-owned account and sender domain. Supabase sends the account-confirmation and password-reset emails; Resend sends every marketplace notification.
4. **Pilot area:** districts `G12`, `G11`, `G3`, `G4` are placeholders until the client confirms the final list.
5. **Categories:** the seven starter categories in `.context/03` are placeholders until the client confirms names, order and which need extra checks.
6. **Brand:** no logo, colours or fonts supplied. The proposal in `.context/design-system.md` (denim, thread, chalk; Archivo + Atkinson Hyperlegible Next) ships behind CSS variables and is replaceable without touching components.
7. **Legal copy:** the client supplies approved UK GDPR text. The build ships clearly marked placeholder pages and a required terms checkbox.
8. **Analytics:** tool not chosen. The spec requires an event hook and page-view tracking; the provider (Plausible, Umami or GA4) is a client decision.
9. **Provider photos:** at least 1 and at most 6 photos are required before an application can be submitted (per `.context/master-build-prompt.md`). `.context/05` only states a maximum; the stricter rule wins unless corrected.
10. **Admin creation:** the first admin is promoted manually in the database. There is no public admin sign-up and no role hierarchy.
11. **Contact release:** full postcode, email and phone are released only after a customer accepts an offer. Public and provider-facing views show postcode district only.
12. **Out of scope stays out:** payments, commission, live chat, SMS, GPS/maps, booking calendars, identity-verification APIs, reviews/ratings, subscriptions, AI matching, native apps, social providers other than Google, 2FA, multi-admin hierarchy. Google sign-in was added at the client's request on 2026-11-16.

---

## 1. Objective

Build a production-quality MVP of **Repairs and Other Services**, a local community services marketplace. Customers find approved local providers by service and postcode, view profiles with photos, and post jobs. Individuals, sole traders and businesses apply to become providers, build a profile, and send offers on open jobs. An admin approves providers and moderates content without touching the database.

**Users**

| Role | Who | What they need |
|---|---|---|
| Customer | Glasgow residents and students, mostly on phones | Find a nearby provider or post a job in under a minute, see proof of work and a rough price |
| Provider | Individuals, sole traders, businesses; many first-time sellers | A trustworthy profile in under 5 minutes, clear approval status, matching local jobs |
| Admin | Business owner running the pilot | Fast approve/reject with reasons, moderation, control of categories and pilot postcodes |

**Success looks like**

- A first-time visitor can search a pilot postcode and reach an approved provider profile without help.
- A provider can apply, be approved, see a matching job and send an offer without contacting support.
- A customer can accept one offer, have the job close automatically, and see contact details released to both parties only.
- The admin can run the entire pilot (approvals, moderation, categories, coverage) from the dashboard.
- The app is accessible, responsive from 320px, and safe by default (RLS plus server-side authorisation).

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.4.5 (App Router), React 19.3.0 | Server Components for reads, Server Actions for writes |
| Language | TypeScript 5, strict | No `any` in application code |
| Styling | Tailwind CSS 4, shadcn/ui | Tokens as CSS variables per `design-system.md`; shadcn added in `foundation` |
| Database / Auth / Storage | Supabase (`@supabase/supabase-js` 2.119.0, `@supabase/ssr` 0.12.7) | Postgres, RLS, Storage buckets |
| Validation | Zod 4.6.7 | Schemas shared by client and server in `lib/schemas/` |
| Forms | React 19 `useActionState` | Server Action state, no client form library |
| Email | Resend 6.37.0 | Branded HTML plus text fallback |
| Icons | `lucide-react` | Status always has icon + text, never colour alone |
| Unit tests | Vitest 5.1.0, jsdom, Testing Library | Pure functions and schemas |
| E2E / a11y | Playwright 1.65.0, `@axe-core/playwright` | Chromium desktop + mobile viewport |
| Hosting / source | Vercel, GitHub | Client-owned accounts |

New dependencies require a recorded reason in `DECISIONS.md`.

---

## 3. Commands

Current scripts are `dev`, `build`, `start`, `lint`. The `foundation` module must add `typecheck`, `test`, `test:e2e`, and the Supabase/Vitest config so these commands work exactly as written.

```bash
# Development
npm install
npm run dev                  # Next dev server (Turbopack)

# Quality
npm run lint                 # ESLint flat config
npm run typecheck            # tsc --noEmit (to be added)
npm run test                 # vitest run (to be added)
npm run test -- --coverage   # unit coverage (to be added)
npm run test:e2e             # playwright test (to be added)

# Build and serve
npm run build
npm run start

# Database (local Supabase, once supabase/ exists)
npx supabase start
npx supabase db reset        # apply migrations + seed
npx supabase stop
```

CI runs lint, typecheck, unit tests and Playwright on push and pull request.

---

## 4. Project structure

```
app/
  layout.tsx          root layout, fonts, skip link
  error.tsx           route level error boundary
  global-error.tsx    root layout error boundary
  forbidden.tsx       403 page for signed in non admins
  not-found.tsx       404 page
  admin-denied/       target of the admin rewrite in proxy.ts
  (site)/
    layout.tsx        public shell: header, main, footer
    loading.tsx       shell loading state
    (public)/         page.tsx, search/, providers/[id]/, privacy/, terms/, cookies/
    (auth)/           login/, register/, forgot-password/, reset-password/, auth/callback/
    (customer)/       post-job/, jobs/, jobs/[id]/, account/
    (provider)/       provide/, provide/apply/, provide/jobs/, provide/offers/
    (admin)/          admin/, admin/providers/, admin/providers/[id]/, admin/jobs/,
                      admin/offers/, admin/categories/, admin/pilot-area/,
                      admin/users/, admin/reports/, admin/analytics/
  api/               admin/export/[type]/route.ts, notifications/retry/route.ts,
                     analytics/route.ts
components/
  ui/                Button, Field primitives
  mend/              ProviderCard, JobCard, OfferCard, StatusBadge, Stepper,
                     PhotoInput, PilotNotice, StitchLine, EmptyState, LegalPage,
                     AnalyticsPageViews, SearchForm, SiteHeader, SiteFooter
  forms/             auth, account, job, offer, provider, action, waitlist, report
lib/
  actions/           auth.ts, account.ts, search.ts, provider.ts, jobs.ts, offers.ts, admin.ts, result.ts
  data/              read helpers per area
  schemas/           Zod schemas per entity
  supabase/          server.ts, admin.ts, session.ts
  emails/            HTML and text email templates
  analytics.ts       event vocabulary
  analytics-server.ts  enable check
  next-path.ts       safe redirect targets
  postcode.ts        normalisePostcode, postcodeDistrict
  transitions.ts     assertJobTransition, assertOfferTransition
  events.ts          emit(event, payload) → notification rows + Resend
  permissions.ts     role and ownership guards
  format.ts          GBP formatting
supabase/            migrations/, seed.sql, config.toml
tests/
  unit/              pure functions and schemas
  rls/               policy tests against a database
  e2e/               Playwright flows
docs/                admin guide, manual test script, handover notes
DECISIONS.md         assumptions and deviations
README.md            setup, migrations, seeding, first admin, env vars, deploy
.env.example         every variable, no secrets
```

There is no `public/` folder. Provider and job photos are served from Supabase
Storage, not from static files.

**Current state:** `app/` contains the default `page.tsx` and `layout.tsx`; `lib/` contains empty placeholder files for actions and Supabase clients; `components/` and `emails/` are empty; `supabase/` and `lib/schemas/` do not exist; `tests/example.spec.ts` is the Playwright starter test. No product code exists yet.

---

## 5. Code style

Reads happen in Server Components. Writes happen only in Server Actions. Every action authenticates, authorises, validates with Zod, executes, emits events, revalidates, and returns a typed result.

```ts
// lib/actions/result.ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };
```

```ts
// lib/actions/jobs.ts
"use server";

import { requireUser } from "@/lib/permissions";
import { createJobSchema } from "@/lib/schemas/job";
import { postcodeDistrict } from "@/lib/postcode";
import { emit } from "@/lib/events";

export async function createJob(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = createJobSchema.safeParse(input);
  if (!parsed.success) return fieldErrors(parsed.error);

  const district = postcodeDistrict(parsed.data.postcode);
  const inPilot = await isEnabledDistrict(district);
  if (!inPilot) return fail("POSTCODE_OUTSIDE_PILOT", "We're not in that area yet.");

  // ... insert, emit("job.created", ...), revalidatePath("/jobs")
  return { ok: true, data: { id } };
}
```

**Conventions**

- Files kebab-case; React components PascalCase; hooks `use*`.
- Server actions are verb-first (`createJob`, `acceptOffer`, `approveProvider`).
- Zod schemas are `<entity>Schema`; inferred types are PascalCase.
- Database tables and columns are snake_case; TypeScript mirrors them only at the boundary.
- Tailwind utilities plus semantic tokens (`--denim-700`, `--ink`, `--thread-400`). No arbitrary hex values in components.
- Copy is sentence case and plain: "Job", "Offer", "Provider", "postcode". Errors say what went wrong and how to fix it, never apologise.
- Never use `dangerouslySetInnerHTML` with user content.
- Every user-visible status has text and an icon, not colour alone.

---

## 6. Testing strategy

| Level | Tool | Location | Scope | Bar |
|---|---|---|---|---|
| Unit | Vitest + jsdom | `tests/unit/` | `postcode.ts`, `transitions.ts`, `format.ts`, all Zod schemas, permission helpers | 100% branch coverage on these modules |
| RLS / integration | Vitest against local Supabase | `tests/rls/` | One test per policy group per table: anonymous, customer, provider, other provider, admin | Every policy in the master prompt exercised |
| E2E | Playwright | `tests/e2e/` | The six flows below, desktop + mobile viewport | All pass in CI |
| Accessibility | `@axe-core/playwright` | `tests/e2e/` | Home, search, post-job, provider profile, admin queue | Zero serious or critical violations |

**E2E flows**

1. Home search: pilot postcode returns approved providers; non-pilot shows the pilot message and waitlist form.
2. Register, post a job with a photo, see it in My jobs.
3. Apply as provider, admin approves, provider sees the matching job and sends an offer.
4. Customer accepts an offer: job closes, other offers decline, contact details appear for both parties only.
5. Admin removes a job and suspends a provider; both disappear from public views.
6. Keyboard-only run through post-a-job.

No global percentage threshold. Critical pure logic and every RLS policy group must be covered; UI breadth is covered by E2E rather than shallow unit tests.

---

## 7. Boundaries

### Always do

- Run `lint`, `typecheck` and unit tests before every commit.
- Authenticate, authorise and validate with Zod in every Server Action, then enforce the same rule in RLS.
- Recompute postcode district, ownership and status transitions on the server.
- Keep the service-role key in `lib/supabase/admin.ts` only; never import it into client code.
- Use the design tokens and the copy voice from `design-system.md`.
- Record assumptions and deviations in `DECISIONS.md`.
- Read the relevant Next 16 guide before using an unfamiliar API.
- Update this spec before implementing a scope or data-model change.

### Ask first

- Adding any dependency not already in `package.json`.
- Changing the database schema, a migration already applied, or seed data shape.
- Changing roles, auth flow, RLS policy intent, or the contact-release rule.
- Changing design tokens, fonts, or the visual direction.
- Adding anything outside the stated MVP scope.
- Changing CI/CD, deployment targets, or client-owned account configuration.
- Running destructive commands against a non-local Supabase project.

### Never do

- Commit secrets, service-role keys, or real personal data.
- Trust the client for role, provider status, ownership, postcode district or price.
- Expose full postcode, email or phone before an offer is accepted.
- Use `dangerouslySetInnerHTML` with user content, or log PII.
- Delete or skip failing tests to get green; fix the cause or ask.
- Build out-of-scope features (payments, chat, maps, ratings, subscriptions, native apps, social providers other than Google, 2FA).
- Claim providers are verified, qualified or insured.

---

## 8. Success criteria

**Product**

- [ ] Every route in `.context/master-build-prompt.md` exists and works with real data, including empty, loading and error states.
- [ ] Home renders correctly at 375px, 768px and 1280px; layout holds from 320px.
- [ ] Hero search passes service and postcode to results; pilot and out-of-pilot paths both work.
- [ ] An optional keyword narrows search results by provider name, bio or price note, and every dashboard list can be searched by its own fields.
- [ ] Only approved, active providers in an enabled district appear in search and have public profiles.
- [ ] A provider can apply with 1–6 validated photos, sees pending status, and becomes public only after approval.
- [ ] A customer can post a job, receive multiple offers, accept one, and have the job close with other offers declined.
- [ ] Contact details are released to both parties only after acceptance.
- [ ] Admin can approve, reject with reason, request more info, suspend, remove jobs, manage categories/districts, resolve reports, and export CSV.
- [ ] Each notification trigger sends exactly one email to the correct recipient; a failed email never fails the user action.
- [ ] All three legal pages are reachable from every footer; sign-up requires terms acceptance.

**Engineering**

- [ ] All Server Actions listed in the master prompt exist, validate, authorise, emit events and return `ActionResult`.
- [ ] RLS is enabled on every table and the RLS test suite passes.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e` all pass.
- [ ] Lighthouse accessibility ≥ 90 on home and search; axe reports zero serious violations on the four audited pages.
- [ ] Design tokens match `design-system.md`; no card shadows; stitch line only for unfinished state.
- [ ] `README.md` documents local setup, migrations, seeding, first admin, env vars and deployment.
- [ ] `DECISIONS.md` lists every assumption and deviation with a reason.
- [ ] No out-of-scope feature is present, including hidden UI.

**Launch**

- [ ] Staging preview accepted by the client.
- [ ] Production deployed to client-owned Vercel and Supabase accounts with SSL.
- [ ] Source, schema, seed data, admin guide and third-party account list handed over.
- [ ] Manual test script covers every acceptance criterion in features 01–10.

---

## 9. Open questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| 1 | Confirm final pilot postcode districts and area names (placeholders: G12, G11, G3, G4). | Client | `discovery`, `foundation` seed |
| 2 | Confirm final service category list, order, and which need extra checks. | Client | `foundation` seed, `provider-onboarding` |
| 3 | Supply logo, brand colours, fonts and imagery, or approve the design-system proposal as-is. | Client | `foundation` visual layer |
| 4 | Supply approved privacy, terms and cookie text. | Client | `legal-and-analytics` |
| 5 | Choose analytics tool (Plausible, Umami or GA4) and confirm whether a cookie banner is required. | Client | `legal-and-analytics` |
| 6 | Confirm sender domain and DNS access for SPF/DKIM. | Client | `notifications` |
| 7 | Who owns the first admin account, and how is it handed over securely? | Client + dev | `foundation` |
| 8 | Confirm 1-photo minimum for provider applications (master prompt) versus maximum-only in feature 05. | Client | `provider-onboarding` |
| 9 | Confirm `reapprove_on_key_change = true` (display name or provider type returns profile to pending). | Client | `provider-onboarding` |
| 10 | Confirm warranty length: 60 or 90 days (agreement placeholder). | Client | Launch terms |
| 11 | Confirm Supabase plan and backup frequency. | Client | Launch |
| 12 | Confirm Next 16 `cacheComponents` / `partialPrefetching` are acceptable for this app. | Dev | `foundation` |

---

## 10. Approval

Approved 2026-11-08. The **Plan** phase is now in review at `tasks/plan.md`, with the task list at `tasks/todo.md`. Implementation starts only after the plan is approved, beginning with task T01.
