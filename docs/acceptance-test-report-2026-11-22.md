# Acceptance Test Report

**Project:** Repairs and Other Services  
**Document version:** 1.2  
**Date:** 22 November 2026  
**Post-deployment recheck:** 22 November 2026, after commit `22569cf`  
**Prepared for:** Project owner / client  
**Status:** Final (automation complete; production fix awaiting deployment)

## 1. Executive summary

All ten acceptance checks in the supplied matrix were executed during this session. To achieve complete coverage, the checks were run in two environments:

- the live production deployment at [https://ros-jet.vercel.app](https://ros-jet.vercel.app); and
- a local staging deployment with the project's pilot seed data, which allowed the authenticated customer, provider and administrator journeys to be driven end to end.

**Outcome:** 10 of 10 checks passed on staging. On production, 2 checks passed outright, 1 could not be verified because the hosted database contains no pilot data, 1 failed because new-account registration is rejected by the hosted backend, and 6 could not be attempted because they require an authenticated account.

The single production failure was traced to the hosted Supabase Auth email-send rate limit: `/auth/v1/signup` returned HTTP 429 with `over_email_send_rate_limit`, because email confirmation is enabled on the hosted project. The application masked that error behind a generic message. Staging used the same build and completed every workflow, confirming the product logic itself was sound.

A post-deployment recheck after commit `22569cf` reproduced the same production outcomes. That commit removed internal agent folders from the repository and did not change application behaviour.

All ten checks have since been automated as a serial Playwright journey in `tests/e2e/acceptance.spec.ts`. They pass locally, together with the full E2E suite (54 tests) and unit suite (116 tests). The registration action has also been changed to create confirmed users through the existing server-only Supabase admin client, avoiding the confirmation-email rate limit while still sending the app's welcome email. That code fix is local and uncommitted; production must redeploy before the live T03 result can change.

## 2. Scope and method

### 2.1 Checks executed

| ID | Scenario | Expected result |
|---|---|---|
| T01 | Customer searches for a service | Relevant approved providers are displayed |
| T02 | Customer enters a pilot postcode | Coverage rules are applied |
| T03 | Provider registers | Application is stored |
| T04 | Provider uploads photographs | Photographs appear on profile after approval |
| T05 | Administrator approves provider | Provider becomes publicly discoverable |
| T06 | Customer submits a job | Job appears in administrator dashboard |
| T07 | Provider submits an offer | Offer is associated with correct job |
| T08 | Customer views offers | Relevant responses are displayed |
| T09 | Administrator removes a listing | Listing is no longer publicly visible |
| T10 | Customer submits a form | Confirmation displayed or emailed |

### 2.2 Environments

| Environment | Details | Used for |
|---|---|---|
| Production | `https://ros-jet.vercel.app`, hosted Supabase project, live Vercel deployment (rechecked after commit `22569cf`) | T01, T02, T03, T10 |
| Staging | `http://localhost:3001`, local Supabase stack with `supabase/seed.sql` and `scripts/local-demo-data.sh` data | All ten checks, manual |
| Automated E2E | `http://127.0.0.1:3005`, production build against the local stack via `npm run test:e2e` | All ten checks, automated |

Testing was performed in a headless Chromium browser on 22 November 2026. Each role was exercised in a signed-in session using the project's documented demo accounts. Results were confirmed from visible page output and, where noted, from the Supabase data layer.

### 2.3 Result definitions

| Result | Meaning |
|---|---|
| Pass | Expected behaviour was observed and evidenced |
| Not verifiable | The check was attempted but the environment lacked the data needed to produce an outcome |
| Fail | The observed behaviour did not match the expectation |
| Not tested | A prerequisite prevented the check from being attempted |

## 3. Results at a glance

| ID | Production | Staging | Overall |
|---|---|---|---|
| T01 | Not verifiable | Pass | Verified on staging |
| T02 | Pass | Pass | Pass |
| T03 | Fail | Pass | Production action required |
| T04 | Not tested | Pass | Verified on staging |
| T05 | Not tested | Pass | Verified on staging |
| T06 | Not tested | Pass | Verified on staging |
| T07 | Not tested | Pass | Verified on staging |
| T08 | Not tested | Pass | Verified on staging |
| T09 | Not tested | Pass | Verified on staging |
| T10 | Pass | Pass | Pass |

Production blocker: new-account registration returns **“We couldn't create your account. Check your details and try again.”** Three separate valid registrations with different email addresses returned the same message. No browser console error accompanied the failure. As a result, `/provide/apply` and `/post-job` both redirect to `/login?next=…`, and checks T04–T09 could not be entered on production.

### 3.1 Post-deployment recheck

The ten checks were repeated on the live deployment after commit `22569cf`. Vercel reported the deployment as successful and the site returned HTTP 200. Every production outcome in the table above was unchanged. No console errors were observed on the pages exercised.

- T01 still showed `0 approved providers` for G12, G13 and G20.
- T02 still accepted G12, G13 and G20 and rejected `M1 1AE` with `We are not in M1 yet…`.
- T03 returned the same registration error for one additional fresh address.
- T10 displayed the same waitlist confirmation for `qa.live.recheck.20261122@example.com` in `M1 1AE`.
- `/provide/apply`, `/post-job`, `/admin/providers`, `/admin/jobs`, `/provide/jobs`, `/provide/offers` and `/jobs` all redirected to `/login?next=…` when signed out.
- After a clean sign-out, the documented demo accounts did not authenticate on production. A browser session left over from earlier testing briefly exposed provider-only views before sign-out; that session did not prove the presence of a usable production account. T04–T09 therefore remain blocked.

### 3.2 Automated end-to-end results

The acceptance matrix is now an executable regression suite. `tests/e2e/acceptance.spec.ts` runs T01–T10 as one serial journey: the provider created in T03 is approved in T05 and removed in T09, and the job posted in T06 carries the offer checked in T07 and T08. Each check asserts both the visible outcome and the underlying database row.

| ID | Automated result | Evidence asserted |
|---|---|---|
| T01 | Pass | Approved provider card visible in G12 search |
| T02 | Pass | Pilot postcode accepted; `M1 1AE` rejected with the pilot message |
| T03 | Pass | New account, pending `provider_profiles` row and one `provider_photos` row |
| T04 | Pass | Public object URL returns `image/png`; profile renders the photo |
| T05 | Pass | Admin approval makes the provider public in search |
| T06 | Pass | Customer job stored with district `G12` and visible to admin |
| T07 | Pass | Offer stored against the correct job with price and timeframe |
| T08 | Pass | Customer sees provider, price and message; contact details hidden |
| T09 | Pass | Provider row removed and public profile/search entry gone |
| T10 | Pass | Waitlist confirmation shown and `interest_signups` row stored |

Verification commands and results:

- `npm test` — 13 files, 116 tests passed.
- `npm run test:e2e` — 54 tests passed (10 acceptance checks, 3 auth setup, 41 existing smoke/marketplace checks).
- `npx tsc --noEmit` and `npm run lint` — clean, with no suppressions added.

Test-created users, providers, jobs, offers and waitlist rows are removed in `afterAll`, so repeated runs do not accumulate pilot data.

## 4. Detailed results

### T01 — Customer searches for a service

- **Production — Not verifiable.** A search for furniture repair in G12 returned the message `0 approved providers` and `No approved providers here yet`. The hosted database contains no approved providers, so there was no listing to display. The post-deployment recheck repeated the search for G12, G13 and G20 with the same result.
- **Staging — Pass.** The same search returned `Furniture repair and refurbishment in G12`, `1 approved provider` and the provider card `Petra Mends`. After a test provider was approved during T05, the count updated to `2 approved providers` and both names were shown.
- **Evidence:** search URLs `?service=furniture-repair&postcode=G12+8QQ` in both environments.

### T02 — Customer enters a pilot postcode

- **Production — Pass.** `G12`, `G13` and `G20` were accepted. `M1 1AE` was rejected with `We are not in M1 yet`, and the waitlist option was offered. The post-deployment recheck produced the same outcome.
- **Staging — Pass.** `G12` was accepted and `M1 1AE` produced `We are not in M1 yet. We are starting in Glasgow's West End and selected university communities.`
- **Note:** the live homepage lists seven pilot districts (`G11, G12, G13, G14, G20, G3, G4`), while the completion report records four (`G12, G11, G3, G4`). This is a documentation discrepancy, not a search-behaviour failure (see F-03).

### T03 — Provider registers

- **Production — Fail.** Registration was attempted three times with unique valid addresses. Each attempt returned `We couldn't create your account. Check your details and try again.` No account was created and no provider application was stored. The post-deployment recheck added a fourth failed attempt with another fresh address.
- **Staging — Pass.** A new account (`qa.provider.20261122@example.com`) was created through `/register`, the user signed in, and a four-step provider application was submitted with name, business type, description, price note, service category, districts G11/G12, a photograph and the terms confirmation. The dashboard showed `Waiting for review` and `Application sent`. The stored record was confirmed as `display_name: QA Menders`, `status: pending`, with one `provider_photos` row.
- **Evidence:** application id `c9d43881-19e1-4ec5-8335-d92a29c177e3` (test record subsequently removed).

### T04 — Provider uploads photographs

- **Production — Not tested.** Blocked by the registration failure in T03.
- **Staging — Pass.** The photograph uploaded during T03 was stored at a `provider-photos/...` object path. After approval in T05, the public profile page `providers/c9d43881-…` rendered an image element pointing to that object path, and the served image was a valid PNG (1 × 1 pixel test fixture).
- **Note:** Next.js 16 blocks private-IP image origins by default. A temporary `images.dangerouslyAllowLocalIP` setting was used for this local-only check and reverted afterwards. It does not affect the hosted deployment, which uses `*.supabase.co`.

### T05 — Administrator approves provider

- **Production — Not tested.** No provider application could be created.
- **Staging — Pass.** Signed in as `admin@example.com`, opened `/admin/providers`, found `QA Menders` under `Waiting for review`, and used **Approve provider**. The dashboard reported `Provider approved`. The public G12 furniture-repair search then listed `QA Menders` alongside `Petra Mends`, updating the count from one to two approved providers.

### T06 — Customer submits a job

- **Production — Not tested.** `/post-job` redirects to login when signed out, and no account could be created.
- **Staging — Pass.** Signed in as `customer@example.com`, submitted a furniture-repair job in `G12 8QQ` with title `QA test chair repair 22 Nov`. The job page opened with `Job request`, `Open`, `G12` and `0 offers`. Signing in as administrator and opening `/admin/jobs` showed `QA test chair repair 22 Nov` in the list.
- **Evidence:** job id `480a256e-f039-4e7a-8677-f4c8e47b598b` (test record subsequently removed).

### T07 — Provider submits an offer

- **Production — Not tested.** Blocked by the registration failure.
- **Staging — Pass.** Signed in as `provider@example.com`, found the job from T06 under `Matching jobs`, and sent an offer with a message, an indicative price of `£45` and the timeframe `This weekend`. The job page showed `1 offer` and `£45`. The stored offer record was `job_id: 480a256e-…`, `provider_id: da07da88-…`, `indicative_price_pence: 4500`, `status: submitted`.
- **Evidence:** offer id `f54584bc-2712-4e6c-ad9c-8383c4fdb5ce` (test record subsequently removed with the job).

### T08 — Customer views offers

- **Production — Not tested.** No job or offer could be created.
- **Staging — Pass.** Signed back in as `customer@example.com` and opened the T06 job. The offer was displayed with the provider name `Petra Mends`, the indicative price `£45`, the timeframe `This weekend` and the full message. Contact details remained private, as required.

### T09 — Administrator removes a listing

- **Production — Not tested.** No provider listing existed to remove.
- **Staging — Pass.** Signed in as administrator, opened the `QA Menders` provider record and used **Remove provider** with a reason. The dashboard reported `Provider removed`. The public G12 search then showed `1 approved provider` with no `QA Menders` entry, and the former profile URL returned `404 We couldn't find that page.`

### T10 — Customer submits a form

- **Production — Pass.** A waitlist submission from an unsupported postcode returned `Thanks. We will email you when we reach your area.` The address `qa.test.20261122@example.com` with postcode `M1 1AE` was recorded. During the post-deployment recheck a second row, `qa.live.recheck.20261122@example.com` with `M1 1AE`, returned the same confirmation.
- **Staging — Pass.** A separate waitlist submission from `M1 1AE` returned the same confirmation and was stored in `interest_signups`.
- **Note:** actual email delivery was not verifiable because mailbox access was not provided. Both confirmations were displayed on screen.

## 5. Findings

### F-01 — High — Production account registration was rejected (root cause found; fix implemented)

Three valid, unique registrations on the live deployment returned the same generic error, blocking six of the ten production checks. A direct probe of the hosted Auth endpoint returned HTTP 429 with `{"error_code":"over_email_send_rate_limit","msg":"email rate limit exceeded"}`. Signups were enabled and the project required email confirmation, so every attempt consumed a confirmation email against a strict hosted send limit. The registration action then replaced the raw error with a generic message, hiding the real cause.

The application fix is implemented locally: `registerUser` now uses the server-only Supabase admin client to create the user with `email_confirm: true` and the `authenticated` role, and queues the existing welcome email through the app's own outbox. This removes the dependency on Supabase's confirmation email and therefore on its send limit. A local regression test (T03) passes with the new path. The fix must be committed, pushed and redeployed before the production T03 result changes; that deployment was not performed as part of this report update.

### F-02 — Medium — Hosted database has no pilot data

The live database reports `0 approved providers` and no jobs. Even after registration is restored, T01 would still have nothing to display until at least one approved provider and one open job are loaded. Seeding the hosted database with the pilot data used locally would make the deployment demonstrable.

### F-03 — Low — Pilot-area documentation drift

The live homepage lists `G11, G12, G13, G14, G20, G3, G4`, while the completion report lists only `G12, G11, G3, G4`. The search itself applies coverage rules consistently in both environments, but the two client-facing descriptions disagree.

### F-04 — Informational — Email delivery not verified

Form confirmations were displayed as expected, but no mailbox was available to confirm that the corresponding messages were delivered. The notification outbox is written by the application; delivery depends on the production `RESEND_API_KEY` and domain configuration described in `docs/handover.md`.

## 6. Recommendations

1. Commit, push and redeploy the registration fix for F-01, then repeat T03 on production and, once it passes, T04–T09.
2. Load pilot providers and jobs into the hosted database (F-02) and re-run T01.
3. Confirm which district list is authoritative and align the homepage and completion report (F-03).
4. Verify one live email end to end with access to the receiving mailbox (F-04).
5. Re-run `npm test` and `npm run test:e2e` in CI on every change, and re-issue this report with the updated production results after deployment.

## 7. Test data and environment notes

- Staging demo accounts used: `admin@example.com`, `customer@example.com`, `provider@example.com` (password `password123`).
- Test records created for the checks — the QA provider account and application, the test job, its offer and the waitlist rows — were removed from the local database after testing.
- The local gateway now implements the small Storage API surface used by the app (`upload`, `remove` and public reads). Earlier manual testing used a temporary shim; the automated suite uses this permanent local-stack implementation. Next's local-IP image restriction is enabled only when `NEXT_ALLOW_LOCAL_IMAGES=1`, which the E2E server sets; the default and production configuration keep the SSRF guard on.
- The local stack now gives newly registered users the `authenticated` JWT role by default and backfills older rows, so public sign-up works outside the seeded demo accounts.
- No production provider, job, offer or administrator record was created. Two production waitlist rows were created by T10: `qa.test.20261122@example.com` and `qa.live.recheck.20261122@example.com`, both with `M1 1AE`.
- Application source files were modified after the live recheck to implement the F-01 fix and the local/E2E test infrastructure. Those changes are local and uncommitted. The working tree also contains the previously prepared client documents and the pre-existing `.context/progress.md` change.

## 8. Conclusion

The delivered application satisfies all ten acceptance criteria when run against a correctly configured environment with pilot data, now proven by an automated serial journey. The production registration failure has been root-caused to hosted Auth email rate limiting and fixed in local application code; the fix still needs to be deployed. Hosted data seeding (F-02) also remains the project owner's responsibility. Until both are complete, the live deployment cannot demonstrate provider, job, offer or administration workflows to a client.

---

**Prepared by:** Delivery team  
**Report version:** 1.2 — 22 November 2026 (automation and registration fix)
