# 3. Project access and technical handover

**Prepared:** 26 November 2026  
**Repository:** `https://github.com/fixneardev-del/ros`  
**Latest production application commit:** `d9f8bd2` (`fix(e2e): keep browser engines inside the sign-in rate limit`)  
**Live test deployment:** `https://ros-jet.vercel.app`  
**Status:** Code and documentation are ready. External account ownership, billing and DNS control still need client confirmation and transfer.

This document is a handover response based on the current repository, GitHub deployment status and repository documentation. Account ownership, billing and DNS control cannot be proven from source code, so those items are marked as requiring client verification rather than assumed.

## 3.1 Project access and ownership transfer

### Current control and transfer position

| Service | Current evidence | Owner / control confirmed? | Transfer or access needed |
|---|---|---|---|
| GitHub | Repository `fixneardev-del/ros`, public, default branch `main`, origin `https://github.com/fixneardev-del/ros.git` | **Not client-confirmed.** GitHub shows the owner as `fixneardev-del`. | Add the client account as Owner/Admin, then transfer the repository to the client-owned personal account or organisation. Confirm desired visibility after transfer. |
| Vercel | Project `ros` deploys from GitHub. Latest successful Vercel check for `d9f8bd2`: `https://vercel.com/fixneardev-del/ros/6rERoEXTYYPtd841NmCjLon1FzxU`. Site: `https://ros-jet.vercel.app`. | **Not client-confirmed.** The project URL indicates the `fixneardev-del` Vercel scope; billing role cannot be verified from the repository. | Invite the client Vercel account as Admin to the project/team, transfer the project and its environment variables, then attach the branded domain. |
| Supabase | Project ref `eohqgkxnjshnzwadglnh`; URL `https://eohqgkxnjshnzwadglnh.supabase.co`; publishable key is in `.env.example` and `vercel.json`. | **Not client-confirmed.** | Invite the client Supabase account as Owner/Admin to the organisation/project, transfer the project, rotate the service-role key after transfer, and confirm Auth, Storage and billing ownership. |
| Resend | Application uses the `resend` npm package and expects `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` and `ADMIN_NOTIFICATION_EMAIL`. No key or sending domain is configured in the repository. | **Not confirmed.** | Invite the client Resend account as Owner/Admin, verify the sending domain, add SPF/DKIM at DNS, and provide the API key through a secure channel. |
| Google OAuth | Google sign-in is configured in Supabase Auth. The Google client secret is intentionally not an application environment variable. | **Not confirmed.** Google Cloud project and OAuth client are not visible in the repository. | Confirm the client-owned Google Cloud project, OAuth client ID/secret, authorised JavaScript origins and redirect URI. The secret should remain in Supabase. |
| Domain and DNS | No branded ROS domain is attached. The live address is the Vercel-generated `ros-jet.vercel.app`. | **Not confirmed.** No registrar or DNS account is visible in the repository. | Provide the domain name and either registrar/DNS admin access or the DNS records Vercel and Resend require. |
| GitHub Actions CI | `.github/workflows/ci.yml` runs on pushes and pull requests to `main`/`master`. | Included in GitHub repository ownership. | Transfers with the repository; client should confirm workflow permissions after transfer. |
| Analytics | No third-party analytics provider found. Analytics are first-party, cookie-free events in the Supabase `analytics_events` table and are off by default. | N/A | Client should confirm that no external analytics account needs transferring. |
| Monitoring / logging | No Sentry, Datadog, Logtail or similar service found. Vercel runtime/build logs and application `console.error` output are the available logs. | Vercel scope as above. | Client should confirm whether an external monitoring account is required. |

### Information and invitations needed from the client

Please provide the following. **Do not send passwords or API keys in email, chat or a shared document.**

1. **GitHub**
   - Client GitHub username or organisation name.
   - Email address to receive the collaborator/Owner invitation.
   - Confirmation whether the repository should be personal or organisation-owned.
   - Confirmation whether the repository should remain public or become private.

2. **Vercel**
   - Client Vercel account email or team ID.
   - Confirmation of the Vercel team/account that should own project `ros`.
   - Admin invitation acceptance.
   - Domain name and DNS access after the project is transferred.

3. **Supabase**
   - Client Supabase organisation/account email.
   - Invitation accepted as Owner or Admin.
   - Confirmation of plan and billing contact.
   - After transfer, a newly rotated `SUPABASE_SECRET_KEY` must be placed in Vercel by the client or through a secure secrets process.

4. **Resend**
   - Client Resend account email.
   - Invitation accepted as Owner/Admin.
   - Sending domain to verify.
   - API key delivered through a secure channel such as the client's password manager or directly entered into Vercel environment settings.
   - Confirmation who owns and monitors the support and admin notification inboxes.

5. **Google Cloud**
   - Confirmation that the client owns the Google Cloud project used for OAuth.
   - Client Gmail/Google Cloud admin email if a new OAuth client is needed.
   - Confirmation of the authorised JavaScript origin and redirect URI for the final domain.

6. **Domain / DNS**
   - Final domain name, for example `ros.co.uk` or the agreed ROS domain.
   - Registrar or DNS host where records can be changed.
   - Access method: registrar admin user, DNS delegated access, or the client applying records supplied by Vercel and Resend.

7. **Billing**
   - Billing admin access or latest invoices for Vercel, Supabase, Resend, GitHub, domain registrar and Google Cloud, so ongoing costs can be recorded.

The requested outcome is **direct client ownership or admin control on every platform**. Access should not depend on the delivery team's personal accounts after handover.

## 3.2 Source code and documentation

### Is the GitHub repository complete and current?

Yes, for application source code. The application source is pushed to `main` at commit `d9f8bd2`. GitHub reports all three CI checks and the Vercel deployment check for that commit as successful.

The repository contains:

- Next.js application source under `app/`, `components/` and `lib/`
- Server actions and authorisation rules
- Database migration, seed data and RLS tests under `supabase/` and `tests/rls/`
- Unit and end-to-end tests under `tests/`
- Deployment configuration in `vercel.json`
- CI workflow in `.github/workflows/ci.yml`
- Operational and client documentation under `docs/` and `.context/`

The repository does **not** contain runtime secrets, hosted database contents, email messages, DNS records, or external account settings. Those live in the relevant platforms and must be transferred or configured separately. A few hosted-data actions, such as creating demo accounts and repairing the hosted provider profile, were performed directly in Supabase; if a fully reproducible rebuild is required, those steps should be added to a seed or migration script.

### Setup and installation instructions

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs at `http://localhost:3001` when using the local Supabase stack described in `docs/local-development.md`.

To start the full local stack without Docker:

```bash
scripts/local-supabase.sh start
scripts/local-supabase.sh url
scripts/local-demo-data.sh
npm run dev
```

To stop it:

```bash
scripts/local-supabase.sh stop
```

Key documents:

- `README.md` — overview, stack, commands and architecture summary
- `docs/local-development.md` — local stack, ports, demo accounts and hosted setup
- `docs/handover.md` — environment variables, Supabase Auth, email, domain and deployment steps
- `docs/admin-guide.md` — operating the pilot from the admin area
- `docs/manual-test-script.md` — acceptance run
- `docs/client-login-details.md` — demo sign-in details
- `DECISIONS.md` — architectural decisions
- `.context/` — original requirements and design notes

### Deployment instructions

Deployment is Git-driven through Vercel:

1. Connect the GitHub repository to the Vercel project.
2. Set all environment variables listed in section 3.3 for Production and, if used, Preview/Staging.
3. Push to `main`. Vercel builds and deploys automatically.
4. Check the GitHub commit status for the Vercel result.
5. After attaching the branded domain, set `NEXT_PUBLIC_SITE_URL` to that domain. Note that `vercel.json` currently has a build-time `NEXT_PUBLIC_SITE_URL` of `https://ros-jet.vercel.app`; this must be updated for the branded launch.
6. Add the branded domain's `/auth/callback` and `/reset-password` URLs to Supabase Auth and the same origin to the Google OAuth client.
7. Run `docs/manual-test-script.md` against the new domain before public launch.

For a manual local production build:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Browser tests on this machine used:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e
```

### Architecture overview

- **Framework:** Next.js 16.4.5 App Router, React 19.3.0, TypeScript strict, Tailwind CSS 4.
- **Rendering and writes:** Reads are performed in Server Components. Writes happen only in Server Actions.
- **Authorisation:** Enforced in the action and again in Postgres RLS. Admin, provider and customer dashboards are separated; `/provide/apply` remains public onboarding in the site shell. An approved provider has a saved active dashboard and can switch between customer and provider views without signing out.
- **Role routing:** Password sign-in and the OAuth callback resolve the landing dashboard from the user's fresh Supabase access token, using row-level security. The saved `profiles.active_dashboard` choice decides where an approved provider lands; admins remain admin-only. The elevated server client remains available as a fallback.
- **Database:** Supabase Postgres. Schema, triggers, functions, RLS policies and storage buckets are in `supabase/migrations/0001_init.sql`; follow-up migrations adjust Google profile-name handling and add the saved dashboard choice.
- **Authentication:** Supabase Auth with email/password and Google OAuth. Password reset emails are generated by the application; Supabase confirmation emails can optionally be routed through Resend SMTP.
- **Storage:** Supabase Storage buckets `provider-photos` (public) and `job-photos` (private), each limited to 5 MB and JPEG/PNG/WebP.
- **Notifications:** In-app `notifications` table plus a non-blocking `notification_deliveries` outbox. Failed email delivery never fails the user action that triggered it.
- **Analytics:** First-party, cookie-free event collector at `/api/analytics`, writing to `analytics_events`. Analytics are off until an admin enables the `analytics_provider` site setting.
- **Money:** Stored as integer pence; `null` means “Quote on inspection”.
- **Marketplace rules:** Pilot coverage is by enabled postcode district. Contact details are released only after an offer is accepted, through a Postgres RPC.
- **Tests:** Vitest unit tests, Playwright end-to-end tests, Postgres RLS suite and GitHub Actions CI.

### Database schema documentation

Primary schema file: `supabase/migrations/0001_init.sql`  
Follow-up migrations: `supabase/migrations/0002_google_profile_name.sql`,
`supabase/migrations/0003_active_dashboard.sql`  
Starter data: `supabase/seed.sql`  
Access-rule tests: `tests/rls/`

Main tables:

| Table | Purpose |
|---|---|
| `profiles` | User profile and role (`admin`, `user`) |
| `service_categories` | Public service taxonomy |
| `locations` | Enabled pilot postcode districts |
| `provider_profiles` | Provider application/profile, status and review state |
| `provider_services` | Categories offered by a provider |
| `provider_photos` | Provider photo records |
| `job_requests` | Customer service/job requests |
| `job_photos` | Job photo records |
| `provider_offers` | Provider offers against jobs |
| `reports` | User-submitted reports |
| `interest_signups` | Public waitlist signups |
| `notifications` | In-app notification centre |
| `notification_preferences` | Per-user email preferences |
| `notification_deliveries` | Email outbox and retry state |
| `audit_log` | Administrative audit records |
| `site_settings` | Admin-editable public copy and settings |
| `analytics_events` | Cookie-free first-party events |

Important rules:

- Row-level security is the second enforcement layer behind server actions.
- A user's own profile is readable by that user and admins.
- Provider profiles are visible when approved, or to the owner/admin.
- Contact release is not a client-side decision; it is enforced in the database.
- Closed/removed jobs and accepted/declined/withdrawn offers are terminal transitions enforced in SQL.
- Storage policies restrict provider and job photo access by ownership and admin role.

### Development and maintenance notes

Useful commands:

| Command | Use |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests |
| `npm run test:rls` | Database access-rule suite |
| `npm run test:e2e` | Browser tests |
| `npm run hosted:accounts` | Opt-in hosted demo account creation |

Operational notes:

- Demo accounts use the shared password `password123` and must be removed or have their passwords changed before public launch.
- `provider@example.com` has an approved hosted provider profile. The local and hosted seed scripts now create and backfill that profile, so resetting demo data preserves the intended role.
- The first real admin is promoted by SQL as described in `docs/admin-guide.md`.
- `docs/client-login-details.md` lists the review accounts and their intended roles.
- Provider onboarding is public at `/provide/apply`, outside the authenticated dashboard.
- An approved provider can switch between “Find help” and “Provide services” from the dashboard account menu without signing out. The saved choice is held in `profiles.active_dashboard`; admins remain admin-only, and pending/rejected/suspended applicants stay customer-only until approval.

### Scheduled jobs, cron, edge functions, webhooks and background services

| Item | Status | Detail |
|---|---|---|
| Vercel Cron | Configured | `vercel.json` calls `/api/notifications/retry` once daily at `06:00 UTC`. Requires `CRON_SECRET`. |
| Email retry job | Configured | Retries queued/failed `notification_deliveries`, up to 5 rows per run and 5 attempts per message. |
| Next.js background work | Configured | `lib/events.ts` uses `after()` to queue email without blocking the user action. |
| GitHub Actions CI | Configured | Secret scan, lint, types, unit coverage, build, RLS suite and Playwright suite on push/PR. |
| Supabase Edge Functions | None found | No `supabase/functions` directory or deployed function is part of this repository. |
| Webhooks | None found | The app uses Supabase auth callbacks and a first-party analytics endpoint; no inbound Resend/Stripe/other webhook handler is present. |
| Persistent queue worker | None | The Supabase `notification_deliveries` table is the outbox; Vercel Cron is the only scheduled processor found. |
| External monitoring/alerting | None found | No Sentry/Datadog/Logtail integration is configured in the repository. |

## 3.3 Environment variables and secrets

Copy `.env.example` to `.env.local` for local work and set the same names in Vercel for each deployed environment. Never commit real secret values.

| Variable | Purpose | Platform / location | Development | Staging | Production |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used in email links and auth redirects. | App env; Vercel | Yes | Yes | Yes; must be the branded domain at launch |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. | App env; Vercel | Yes | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public Supabase key, safe for browser use. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted as a legacy alias. | App env; Vercel | Yes | Yes | Yes |
| `SUPABASE_SECRET_KEY` | Server-only key for admin operations, notification outbox and retries. `SUPABASE_SERVICE_ROLE_KEY` is accepted as a legacy alias. | Server only; Vercel | Yes for full admin/email tests | Yes | Yes; rotate after transfer |
| `RESEND_API_KEY` | Sends transactional email. Placeholder values deliberately disable sending. | Server only; Vercel; Resend | Optional locally | Yes for live email | Yes |
| `EMAIL_FROM` | Verified sender address shown on outbound email. Placeholder domains disable sending. | Server only; Vercel; Resend/DNS | Optional locally | Yes | Yes |
| `EMAIL_REPLY_TO` | Monitored reply-to inbox. Falls back to `EMAIL_FROM`. | Server only; Vercel | No | Recommended | Recommended |
| `ADMIN_NOTIFICATION_EMAIL` | Receives admin notifications and acts as footer contact fallback when `SUPPORT_EMAIL` is empty. | Server only; Vercel | Yes for demo admin | Yes | Yes |
| `SUPPORT_EMAIL` | Agreed ROS support mailbox shown in the public footer. The app does not create the mailbox. | Server only; Vercel | No | Recommended | Yes before public launch |
| `RESET_SESSION_SECRET` | Signs the short-lived password-recovery cookie. Defaults to `SUPABASE_SECRET_KEY` when omitted. | Server only; Vercel | No | Recommended | Recommended; set separately from Supabase key |
| `CRON_SECRET` | Authorises Vercel Cron calls to `/api/notifications/retry` as `Authorization: Bearer <CRON_SECRET>`. | Vercel Cron + app env | Optional for local cron testing | Yes | Yes |
| `SUPABASE_DB_URL` or `SUPABASE_DB_HOST` / `SUPABASE_DB_PORT` / `SUPABASE_DB_NAME` / `SUPABASE_DB_PASSWORD` | Database connection for the RLS test suite only; not needed by the running app. | Local/CI test env | Yes for `npm run test:rls` | CI | Not required for app runtime |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Optional local override when Playwright cannot install its own browser. | Local test env | Optional | No | No |
| `ALLOW_DEMO_ACCOUNTS` | Required opt-in flag for `npm run hosted:accounts`; script also requires `--yes`. | Script flag only | Optional | Non-production only | Do not use in production |

Google OAuth client ID and secret are **not** application variables. They are configured in Supabase Auth, and the secret should remain there.

### Secure handover method for secrets

- Transfer platform ownership first, then rotate secrets from the client-owned account.
- Enter production secrets directly in Vercel's environment settings or through the client's password manager, not in chat, email or the repository.
- Use separate secrets per environment where possible.
- Rotate `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `CRON_SECRET` and `RESET_SESSION_SECRET` after transfer.
- Keep the service-role key server-only. The CI secret scan rejects credential-shaped values in tracked files.
- The public GitHub repository is public; no secret value should ever be committed to it.

## 3.4 Third-party services and subscriptions

| Service | Purpose | Current owner / control | Ongoing cost | Action |
|---|---|---|---|---|
| GitHub | Source code, issues and CI | Repository owner shown as `fixneardev-del`; client control not yet confirmed | Not verifiable from repo; likely no charge for a public repo, but billing status must be confirmed | Transfer to client-owned account/org |
| Vercel | Hosting, builds, cron, runtime logs | Project `ros` under `fixneardev-del` scope; billing not verifiable | Unknown; confirm via Vercel billing | Invite client Admin, transfer project, attach domain |
| Supabase | Postgres, Auth, Storage, RLS, Google provider config | Project ref `eohqgkxnjshnzwadglnh`; owner/billing not verifiable | Unknown; confirm via Supabase billing | Invite client Owner/Admin, transfer project |
| Resend | Transactional email and sending domain | Not configured in repo; owner unknown | Unknown; confirm via Resend billing | Invite client Owner/Admin, verify domain, provide key securely |
| Google Cloud / Google OAuth | Social sign-in credentials | Not visible in repo | Usually no direct charge at typical low volume, but must be confirmed | Confirm client-owned project and OAuth client |
| Domain registrar / DNS | Branded domain and email DNS records | No domain attached; registrar unknown | Unknown; client to confirm | Provide domain and DNS admin access |
| Email mailboxes | Support mailbox and admin notification inbox | Not configured by the application | Unknown; depends on client's mailbox provider | Client creates/controls and monitors inboxes |
| GitHub Actions | Continuous integration | Part of GitHub repository | Included with GitHub plan; confirm via billing | Transfers with repo |
| Payment providers | None used | N/A | None found | N/A |
| AI services | None used | N/A | None found | N/A |
| Analytics tools | None external; first-party Supabase table only | N/A | Included with Supabase | Confirm no external analytics account needed |
| Monitoring / logging | Vercel build/runtime logs; no external tool | Vercel scope as above | Included/unknown | Confirm whether client wants external monitoring |
| Storage provider | Supabase Storage buckets | Supabase project as above | Included in Supabase plan; confirm | Transfers with Supabase project |

No repository evidence of Stripe, PayPal, SMS, maps, live chat, booking calendars, identity-verification APIs or native app store accounts was found.

## 3.5 Database and infrastructure

### Administrative access

Full client administrative access is **not yet confirmed**. It should be granted through client-owned accounts:

- Supabase: Owner/Admin on the project and organisation.
- Vercel: Admin on the `ros` project and relevant team.
- GitHub: Owner/Admin on the repository.
- Resend: Owner/Admin on the account.
- Google Cloud: Owner/Admin on the OAuth project.
- Registrar/DNS: admin access to the domain and DNS records.

After transfer, the client should verify:

- Postgres tables, RLS policies, roles and grants.
- Storage buckets `provider-photos` and `job-photos`.
- Supabase Auth providers, site URL, redirect URLs, email confirmation and SMTP settings.
- Vercel environment variables, cron configuration and custom domain.
- Resend API key, verified domain, SPF and DKIM.
- Billing and plan limits for Supabase, Vercel, Resend and the domain.

### Backup and recovery procedures currently in place

| Asset | Current recovery source | Gap |
|---|---|---|
| Source code | Git history in GitHub repository | Access transfer pending |
| Database schema | `supabase/migrations/*.sql` | Hosted-data changes are not all captured as migrations |
| Reference data | `supabase/seed.sql` | Demo/production data separation should be tightened |
| Hosted database contents | Supabase platform backups/PITR depending on plan | Not verified in this handover; no app-level backup script found |
| Storage objects | Supabase Storage | No separate export job found |
| Environment variables | `.env.example` names plus Vercel/Supabase/Resend dashboards | No secure export found; secrets must be transferred/rotated |

Recommended additions:

1. Confirm the Supabase plan's backup/PITR capability and retention.
2. Take a logical export of production data before domain/email changes.
3. Move hosted demo-data fixes into a repeatable seed or migration script.
4. Document a restore drill for a new developer.
5. Keep production secrets in a client-controlled vault with access logging.

## 3.6 Outstanding work and issues

### Known bugs and operational issues

1. **Hosted database still needs the saved-dashboard migration.** `supabase/migrations/0003_active_dashboard.sql` has not yet been applied to hosted Supabase, so the choice is not stored on the profile there. A live switch still works via the `ros-dashboard` cookie, and approved providers land on the provider dashboard by default because role lookup no longer depends on the new column and an unreadable saved dashboard falls back to `provider`. Admin and customer access are unaffected. The local stack applies all migrations and seeds the approved provider correctly.
2. **Google OAuth hosted configuration still needs final domain alignment.** The previously observed localhost error was caused by Supabase/Google redirect and origin configuration, not application code. The production and branded-domain Site URL, redirect URLs and Google authorised origins must match.
3. **Resend is not configured.** Email delivery is disabled until a real API key, verified sending domain and sender address are set. The outbox still records failed rows for later retry.
4. **`NEXT_PUBLIC_SITE_URL` is still tied to the Vercel test domain.** `vercel.json` hardcodes `https://ros-jet.vercel.app` in build env; update this before branded launch.
5. **The hosted provider demo profile has no photos.** The public application wizard requires 1–6 provider photos, while the direct hosted repair created the provider profile without photos. It is sufficient for dashboard-route testing but not a complete public profile demonstration.
6. **Demo accounts with a published password remain in hosted Supabase.** Remove or change them before public launch.

### Technical debt

- Hosted Supabase must apply `0003_active_dashboard.sql` before the reversible customer/provider switcher is stored on the profile. Until then the choice is held in a user-scoped cookie; admin access works and approved providers default to the provider dashboard because role lookup falls back cleanly. The code, migration and local test stack are already updated.
- Interim ROS monogram logo/favicon assets are in `public/ros-logo.svg` and `app/icon.svg`; the official logo and exact brand green are still needed.
- Legal pages contain pilot copy and need approved final text.
- Hosted data repair steps are not fully scripted.
- Legacy environment variable aliases are retained for compatibility; they can be removed after all environments are standardised.
- No automated external monitoring/alerting is configured.
- No documented database restore drill exists.

### Incomplete features and pending production changes

- Direct client ownership/admin access on GitHub, Vercel, Supabase, Resend and Google Cloud.
- Branded domain attached to Vercel, with DNS verified.
- `NEXT_PUBLIC_SITE_URL`, Supabase Auth URLs and Google origins updated for the branded domain.
- Resend sending domain, SPF, DKIM, API key and sender configured.
- `SUPPORT_EMAIL` set to the agreed ROS support mailbox.
- First real admin promoted using the client's chosen email.
- Demo accounts removed or secured.
- Official logo and exact green applied.
- Approved legal copy installed.
- Apply `supabase/migrations/0003_active_dashboard.sql` to the hosted Supabase project so saved dashboard switching works live. The code and local test stack are already updated.

### Security concerns

- Service-role key must remain server-only and be rotated after transfer.
- No secret values should be committed to the public repository.
- Google OAuth redirect/origin mismatch can break sign-in and should be verified on the final domain.
- Published demo passwords must not remain available in production.
- The first admin account should be client-owned and protected by a strong password; two-factor authentication is not currently part of the build.
- RLS is the second enforcement layer; do not bypass it for convenience in new code.
- Payment details are not handled by the application; customers and providers arrange payment directly.

### Recommended next steps for a new developer

1. Obtain the invitations/access listed in section 3.1 and confirm client ownership.
2. Rotate secrets and load them into Vercel/Supabase/Resend from the client-controlled accounts.
3. Attach the branded domain and update `NEXT_PUBLIC_SITE_URL`, Supabase redirect URLs and Google origins.
4. Configure Resend, DNS SPF/DKIM, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SUPPORT_EMAIL` and `ADMIN_NOTIFICATION_EMAIL`.
5. Promote the client's admin account; remove or secure demo accounts.
6. Replace the interim logo/favicon and legal pilot copy.
7. Re-run lint, typecheck, unit tests, RLS tests, build and browser tests.
8. Apply migration `0003_active_dashboard.sql`, then verify all three roles live: customer → `/account`, approved provider → saved dashboard (`/account` or `/provide`), admin → `/admin`.
9. Seed or clean hosted data deliberately; ensure provider profiles, jobs and offers are what the client wants shown. Re-run `npm run hosted:accounts -- --yes` with `ALLOW_DEMO_ACCOUNTS=1` if the approved demo provider must be restored.
10. Establish backup/PITR verification and monitoring expectations.
11. Confirm an approved provider can switch to “Find help” and back to “Provide services” from the dashboard account menu without signing out.
12. Hold a short handover meeting and close the checklist in section 3.8.

## 3.7 Intellectual property

I cannot provide a legal confirmation of ownership; that depends on the signed engagement/contract between the client and the delivery party. From the repository perspective:

- The application source, documentation, database structure, test suites and project-specific content were produced for ROS during this engagement.
- No third-party application code was copied into the repository outside declared npm dependencies, which remain subject to their own licences.
- No repository restriction prevents another developer from taking over maintenance and continuing development.
- The interim `ROS` monogram assets are placeholders, not the client's official logo; replace them with approved brand assets.
- Account credentials, customer data, Google/Resend/Vercel/Supabase terms and any contractual IP assignment are outside the source code and must be confirmed by the client.

Please confirm the IP assignment clause in the engagement terms if a formal ownership statement is required.

## 3.8 Final handover checklist

| Item | Status | Notes |
|---|---|---|
| Ownership and access transferred | **Not complete** | Repository, Vercel, Supabase, Resend, Google and domain/DNS must be placed under client-controlled accounts. Invitations requested in section 3.1. |
| Source code transferred | **Partial** | Complete current application source is in `github.com/fixneardev-del/ros` at commit `d9f8bd2`. Client access/ownership transfer is pending. |
| Documentation provided | **Complete** | README, handover, local development, admin guide, test script, login details, decisions and this document are in the repository. |
| Secrets handed over securely | **Not complete** | Secret names documented; actual values must be transferred through platform access or a secure vault and rotated after transfer. |
| Database access confirmed | **Not complete** | Hosted Supabase project is live, but client Owner/Admin access and billing control must be confirmed. |
| Domain and DNS access confirmed | **Not complete** | No branded domain attached; domain name and DNS access are required. |
| Third-party services reviewed | **Partial** | Services and costs are listed in section 3.4; ownership and billing amounts remain to be confirmed by the client. |
| Handover meeting completed | **Not scheduled** | Recommend a short walkthrough after access transfer and before final acceptance. |
