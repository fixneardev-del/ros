# Draft email reply — 3. Project access and technical handover

Subject: Re: Project access and technical handover — ROS MVP

Hi [Name],

Thank you for the handover questions. Please find the position below, based on
the current repository, the live deployment at `https://ros-jet.vercel.app`,
and the project documentation in `docs/`.

## 3.1 Project access and ownership transfer

### Current ownership / control

| Service | Current position |
|---|---|
| GitHub | Repository `fixneardev-del/ros`, public, default branch `main`. You confirmed full ownership/access through the `fixneardev@gmail.com` account. The password shared in chat has not been stored or reused and should be rotated. |
| Vercel | Project `ros` deploys from GitHub. Live site is `https://ros-jet.vercel.app`. The project URL indicates the `fixneardev-del` scope. You report SSO access and that all environment variables are held in Vercel; billing ownership cannot be verified from source code. |
| Supabase | Project ref `eohqgkxnjshnzwadglnh`, URL `https://eohqgkxnjshnzwadglnh.supabase.co`. You report SSO access. Owner/plan/billing cannot be verified from the repository. |
| Resend | Used by the app for transaction email. No key or sending domain is in the repository. You report SSO access; the account is not configured in code. |
| Domain / DNS | No branded ROS domain is attached. The site is still on the Vercel test URL. No registrar or DNS account is visible in the repository. |
| Analytics | No external analytics provider. Analytics are first-party, cookie-free events in Supabase `analytics_events`, off until enabled in site settings. |
| Monitoring / logging | Vercel build/runtime logs and application console output. No Sentry, Datadog, Logtail or equivalent is configured. |
| Authentication provider | Supabase Auth (email/password and Google OAuth). Google Cloud project/OAuth client is not visible in the repository. |
| Other dependencies | GitHub Actions CI; Supabase Storage buckets `provider-photos` and `job-photos`. |

### Information / invitations needed from you

To place access directly under your accounts and avoid handling your password,
please:

1. Confirm that `fixneardev-del` is the final client-controlled GitHub
   organisation and whether the repository should remain public or become
   private.
2. Invite the GitHub account `ejemi1989` as **Admin** to the Vercel project
   `ros`.
3. Invite `ejemi1989` as **Owner/Admin** to the Supabase project
   `eohqgkxnjshnzwadglnh`.
4. Invite `ejemi1989` as **Owner/Admin** to Resend.
5. Confirm that you own the Google Cloud project/OAuth client used for Google
   sign-in.
6. Provide the branded domain name and registrar/DNS admin access, or apply the
   DNS records we supply.
7. Confirm the ROS support mailbox address and who creates/monitors it.
8. Provide billing access or latest invoices for Vercel, Supabase, Resend,
   GitHub, domain and Google Cloud so ongoing costs can be recorded.

Please rotate the password that was shared in chat. Do not send passwords or
API keys by email, chat or shared document; enter them directly in the relevant
platform or through your password manager.

## 3.2 Source code and documentation

Yes — the GitHub repository contains the complete and current application
source, including all production changes. Everything is on `main`, CI is green,
and the latest code was verified on the live deployment.

Included in the repository:

- Application code: `app/`, `components/`, `lib/`
- Server actions and authorization rules
- Migrations, seed data and RLS tests: `supabase/`, `tests/rls/`
- Unit and browser tests: `tests/`
- Deployment config: `vercel.json`
- CI workflow: `.github/workflows/ci.yml`
- Documentation: `README.md`, `docs/`, `.context/`, `DECISIONS.md`

### Setup and installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

For the full local stack without Docker:

```bash
scripts/local-supabase.sh start
scripts/local-supabase.sh url
scripts/local-demo-data.sh
npm run dev
```

Stop with `scripts/local-supabase.sh stop`. See `README.md` and
`docs/local-development.md`.

### Deployment

Deployment is Git-driven through Vercel:

1. Connect the repository to the Vercel project.
2. Set the environment variables in section 3.3 for each environment.
3. Push to `main`; Vercel builds and deploys automatically.
4. Check the GitHub commit status and Vercel result.
5. After the branded domain is attached, update `NEXT_PUBLIC_SITE_URL`,
   Supabase redirect URLs and Google OAuth origins.
6. Run `docs/manual-test-script.md` against the new domain before launch.

Local production check:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

### Architecture overview

- Next.js 16.4.5 App Router, React 19.3.0, TypeScript strict, Tailwind CSS 4.
- Reads use Server Components; writes use Server Actions.
- Authorization is enforced in actions and again in Postgres RLS.
- Admin, customer and provider dashboards are separated. An approved provider
  has a saved active dashboard and can switch between customer and provider
  views without signing out.
- Supabase provides Postgres, Auth, Storage and RLS.
- Resend sends transactional email through a non-blocking outbox.
- Analytics are first-party and cookie-free.
- Money is stored as integer pence; `null` means “quote on inspection”.
- Pilot coverage is by enabled postcode district.
- Contact details are released only after an offer is accepted, through a
  Postgres RPC.

### Database schema

Primary schema: `supabase/migrations/0001_init.sql`. Follow-ups:
`0002_google_profile_name.sql` and `0003_active_dashboard.sql`. Starter data:
`supabase/seed.sql`. Access-rule tests: `tests/rls/`.

Main tables: `profiles`, `service_categories`, `locations`,
`provider_profiles`, `provider_services`, `provider_photos`, `job_requests`,
`job_photos`, `provider_offers`, `reports`, `interest_signups`, `notifications`,
`notification_preferences`, `notification_deliveries`, `audit_log`,
`site_settings` and `analytics_events`.

Important rules: RLS is the second enforcement layer; provider profiles are
public only when approved; contact release is enforced in SQL; offer/job state
transitions are terminal where appropriate; Storage access is ownership/admin
scoped.

### Development and maintenance notes

Commands: `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`,
`npm test`, `npm run test:rls`, `npm run test:e2e`, `npm run hosted:accounts`.

- Demo accounts use a published test password and must be removed or changed
  before launch.
- `provider@example.com` is the approved demo provider.
- The first real admin is promoted by SQL in `docs/admin-guide.md`.
- Provider onboarding is public at `/provide/apply`.
- Approved providers can switch dashboards from `/account` or the dashboard
  menu.
- `docs/admin-guide.md`, `docs/manual-test-script.md` and
  `docs/client-login-details.md` cover operations and testing.

### Scheduled jobs, cron, edge functions, webhooks and background services

| Item | Status |
|---|---|
| Vercel Cron | `/api/notifications/retry` daily at 06:00 UTC; requires `CRON_SECRET` |
| Email retry | Retries failed outbox rows, up to 5 rows per run and 5 attempts per message |
| Background work | `lib/events.ts` uses `after()` to queue email without blocking user actions |
| GitHub Actions CI | Secret scan, lint, types, unit tests, build, RLS suite and Playwright suite |
| Supabase Edge Functions | None found |
| Inbound webhooks | None found |
| Persistent queue worker | None; the outbox table plus Vercel Cron is the processor |
| External monitoring | None configured |

## 3.3 Environment variables and secrets

| Variable | Purpose | Platform | Dev | Staging | Prod |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for email links and auth redirects | App env / Vercel | Yes | Yes | Yes; branded domain at launch |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | App env / Vercel | Yes | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key; legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` accepted | App env / Vercel | Yes | Yes | Yes |
| `SUPABASE_SECRET_KEY` | Server-only key for admin actions, outbox and retries; legacy `SUPABASE_SERVICE_ROLE_KEY` accepted | Server only / Vercel | Yes for full tests | Yes | Yes; rotate after transfer |
| `RESEND_API_KEY` | Sends transactional email; placeholders disable sending | Server only / Vercel / Resend | Optional | Yes | Yes |
| `EMAIL_FROM` | Verified sender address | Server only / Vercel / Resend / DNS | Optional | Yes | Yes |
| `EMAIL_REPLY_TO` | Monitored reply-to address; falls back to `EMAIL_FROM` | Server only / Vercel | No | Recommended | Recommended |
| `ADMIN_NOTIFICATION_EMAIL` | Admin notifications and footer fallback | Server only / Vercel | Yes for demo | Yes | Yes |
| `SUPPORT_EMAIL` | ROS support mailbox shown in footer | Server only / Vercel | No | Recommended | Yes before launch |
| `RESET_SESSION_SECRET` | Signs password-recovery cookie; defaults to Supabase secret when omitted | Server only / Vercel | No | Recommended | Recommended |
| `CRON_SECRET` | Authorises Vercel Cron as `Authorization: Bearer <CRON_SECRET>` | Vercel Cron + app env | Optional | Yes | Yes |
| `SUPABASE_DB_URL` or separate `SUPABASE_DB_HOST` / `PORT` / `NAME` / `PASSWORD` | RLS test suite only | Local / CI | Yes for `npm run test:rls` | CI | Not needed by app |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Local browser override | Local test env | Optional | No | No |
| `ALLOW_DEMO_ACCOUNTS` | Opt-in flag for hosted demo script; also requires `--yes` | Script flag | Optional | Non-production only | Do not use |

Google OAuth client ID/secret are **not** application environment variables;
they remain in Supabase Auth / Google Cloud.

Secure handover method: transfer platform ownership first, rotate secrets from
your accounts, enter values directly in Vercel/Supabase/Resend or a
client-controlled password manager, use separate secrets per environment, keep
the service-role key server-only, and never commit or send secrets in chat or
email. The CI secret scan rejects credential-shaped values in tracked files and
the repository is public.

## 3.4 Third-party services and subscriptions

| Service | Purpose | Owner evidence | Ongoing cost |
|---|---|---|---|
| GitHub | Source, issues, CI | `fixneardev-del`; you confirmed access via `fixneardev@gmail.com` | Likely free for public repo; confirm billing |
| Vercel | Hosting, builds, cron, logs | `fixneardev-del` scope | Confirm via Vercel billing |
| Supabase | Postgres, Auth, Storage, RLS, Google config | Project ref above | Confirm via Supabase billing |
| Resend | Transactional email | Not configured in repo | Confirm via Resend billing |
| Google Cloud / OAuth | Google sign-in | Not visible in repo | Usually free at low volume; confirm |
| Domain registrar / DNS | Branded domain and email DNS | None attached | Client to confirm |
| Email mailboxes | Support and admin notification inboxes | Not created by app | Client’s provider |
| GitHub Actions | CI | Part of the repository | Included with GitHub plan |
| Payment providers | None used | N/A | None found |
| Email services | Resend | See above | See above |
| Authentication providers | Supabase Auth + Google OAuth | See above | See above |
| AI services | None used | N/A | None |
| Analytics tools | First-party Supabase table only | N/A | Included with Supabase |
| Monitoring / logging | Vercel logs only | Vercel scope | Confirm if external monitoring wanted |
| Storage providers | Supabase Storage buckets | Supabase project | Included in plan |

## 3.5 Database and infrastructure

Full administrative access is not yet confirmed from the repository side. It
should be granted directly to your accounts as Owner/Admin on Supabase, Vercel,
GitHub, Resend, Google Cloud and the DNS host. After transfer, please verify:

- Postgres tables, RLS policies, roles and grants.
- Storage buckets `provider-photos` and `job-photos`.
- Supabase Auth providers, site URL, redirect URLs, email confirmation and SMTP.
- Vercel environment variables, cron configuration and custom domain.
- Resend API key, verified domain, SPF and DKIM.
- Billing and plan limits for Supabase, Vercel, Resend and the domain.

Backup and recovery currently:

| Asset | Recovery source | Gap |
|---|---|---|
| Source code | Git history | Access transfer to final client org to confirm |
| Database schema | `supabase/migrations/*.sql` | Some hosted-data fixes are not yet migrations |
| Reference data | `supabase/seed.sql` | Demo/production separation to tighten |
| Hosted database contents | Supabase platform backup/PITR, depending on plan | Not verified here; no app-level export job |
| Storage objects | Supabase Storage | No separate export job |
| Secrets | Platform dashboards | No secure export; transfer and rotate |

Before launch I recommend confirming Supabase PITR/retention, taking a logical
export, moving hosted demo-data fixes into a repeatable script, documenting a
restore drill, and keeping production secrets in a client-controlled vault.

## 3.6 Outstanding work and issues

### Known bugs / operational issues

1. Hosted Supabase still needs `supabase/migrations/0003_active_dashboard.sql`.
   Switching currently persists in a user-scoped cookie; approved providers
   default to `/provide`.
2. Google OAuth final-domain redirect/origin alignment is pending.
3. Resend is not configured, so email delivery is disabled and outbox rows stay
   failed for retry.
4. `NEXT_PUBLIC_SITE_URL` is still tied to the Vercel test domain.
5. The hosted demo provider profile has no photos.
6. Demo accounts with a published password remain in hosted Supabase.

### Technical debt

- Hosted dashboard choice is not yet stored on the profile.
- Interim ROS monogram logo/favicon assets remain.
- Legal pages contain pilot copy.
- Hosted-data repair steps are not fully scripted.
- Legacy environment variable aliases remain for compatibility.
- No automated external monitoring/alerting.
- No documented database restore drill.

### Incomplete features / pending production changes

- Verified admin access on Vercel, Supabase, Resend, Google Cloud and DNS.
- Branded domain attached and DNS verified.
- `NEXT_PUBLIC_SITE_URL`, Supabase redirect URLs and Google origins updated.
- Resend domain, SPF/DKIM, API key and sender configured.
- `SUPPORT_EMAIL` set to the agreed mailbox.
- First real client admin promoted.
- Demo accounts removed or secured.
- Official logo and approved legal copy installed.
- Hosted migration applied.

### Security concerns

- Service-role key must remain server-only and be rotated after transfer.
- No secret values should be committed to the public repository.
- Google OAuth redirect/origin mismatch can break sign-in.
- Published demo passwords must not remain available in production.
- The first admin should use a strong password; 2FA is not part of the build.
- RLS is the second enforcement layer and should not be bypassed.
- Payment details are not handled by the app; customers and providers arrange
  payment directly.

### Recommended next steps for a new developer

1. Confirm access: GitHub is confirmed; obtain Vercel, Supabase and Resend
   invites to `ejemi1989` or another client-approved account.
2. Rotate the chat-shared password and all platform secrets; load secrets into
   Vercel/Supabase/Resend from client-owned accounts.
3. Attach the branded domain and update `NEXT_PUBLIC_SITE_URL`, Supabase redirect
   URLs and Google origins.
4. Configure Resend, SPF/DKIM, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SUPPORT_EMAIL`
   and `ADMIN_NOTIFICATION_EMAIL`.
5. Promote the client’s admin account and remove or secure demo accounts.
6. Replace the interim logo/favicon and legal pilot copy.
7. Re-run lint, typecheck, unit tests, RLS tests, build and browser tests.
8. Apply migration `0003_active_dashboard.sql`, then verify customer → `/jobs`,
   approved provider → `/provide` (or `/jobs` after an explicit switch), and
   admin → `/admin`.
9. Seed or clean hosted data deliberately and re-run the hosted demo script
   only if needed.
10. Establish backup/PITR verification and monitoring expectations.
11. Confirm an approved provider can switch dashboards without signing out.
12. Hold a short handover meeting and close the checklist below.

## 3.7 Intellectual property

I cannot provide a legal confirmation of ownership; that depends on the signed
engagement/contract between ROS and the delivery party. From the repository
perspective:

- The application source, documentation, database structure, test suites and
  project-specific content were produced for ROS during this engagement.
- No third-party application code was copied into the repository outside
  declared npm dependencies, which remain subject to their own licences.
- No repository restriction prevents another developer from taking over
  maintenance and continuing development of ROS.
- The interim `ROS` monogram assets are placeholders, not your official logo;
  they should be replaced with your approved brand assets.
- Account credentials, customer data, Google/Resend/Vercel/Supabase terms and
  any contractual IP assignment are outside the source code and must be
  confirmed by you.

Please confirm the IP assignment clause in the engagement terms if a formal
ownership statement is required.

## 3.8 Final handover checklist

| Item | Status | Notes |
|---|---|---|
| Ownership and access transferred | **Partial** | GitHub ownership confirmed by you. Vercel, Supabase, Resend, Google Cloud and DNS access still need to be placed under your accounts via invites/access. |
| Source code transferred | **Complete** | Complete current source is on `main`; CI is green and the live deployment was verified. |
| Documentation provided | **Complete** | `README.md`, `docs/`, `.context/` and `DECISIONS.md` cover setup, deployment, architecture, schema, tests and operations. |
| Secrets handed over securely | **In progress** | Process documented and no secret values in the repo. Secrets are in Vercel; the chat-shared password must be rotated and platform secrets entered securely from your accounts. |
| Database access confirmed | **Not complete** | Supabase Owner/Admin access needed; hosted dashboard migration still pending. |
| Domain and DNS access confirmed | **Not complete** | Domain to be purchased by you; provide the name and DNS access so I can configure it. |
| Third-party services reviewed | **Complete** | Inventory and cost/owner gaps are documented above and in `docs/project-access-and-technical-handover.md`; billing confirmation needed from you. |
| Handover meeting completed | **Not yet** | Recommend a short handover call after access, domain and email configuration are in place. |

Please send the invites and domain/DNS details listed above, and I will complete
the remaining configuration and close out the checklist.

Best regards,  
Oladimeji
