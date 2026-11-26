# Requirements audit — 26 November 2026

Audited against the live site `https://ros-jet.vercel.app/` and the repository
`github.com/fixneardev-del/ros`. This answers the landing-page review from
Fisayo, the “one login for both roles” question, and the project-access and
technical-handover checklist.

## Summary

| Area | Status |
|---|---|
| Landing review items 1–3 and 5 | Implemented and verified live |
| Landing review item 4 (domain, branded-domain email tests, support mailbox) | Blocked on client-supplied domain, DNS access and mailbox decision |
| One login for both roles | Yes; approved providers can switch without signing out |
| Ownership and admin access transfers | GitHub confirmed by client; Vercel, Supabase, Resend, domain/DNS and billing still need verified client-side admin access |
| Source code, setup, deployment, architecture, schema and maintenance notes | Complete in the repository |
| Secrets handover | Process documented; no secret values are in the repository |
| Backup/PITR and restore drill | Not verified/documented; must be confirmed with the client’s Supabase account |

## 1. Landing page feedback

### 1. Logo and brand colours — partial, awaiting official asset

Done:

- The shared `RosLogo` component is used in the desktop header, mobile menu,
  studio header fallback and footer.
- `app/icon.svg` and the browser-tab `app/favicon.ico` now both use the same
  interim ROS mark.
- Public pages use white backgrounds, dark text and ROS green `#2fae6b` for
  buttons/accents. Live check: header `rgba(255,255,255,0.92)`, primary button
  `rgb(47,174,107)`.
- Service tiles are white with a subtle `#e7e7e0` border and ROS green icons;
  the service/postcode search remains prominent in the hero.

Outstanding from the client:

- The official designed ROS logo file, preferably SVG.
- Confirmation of the exact brand green hex. The current value is `#2fae6b`.
  Replacing `public/ros-logo.svg`, `app/icon.svg` and `app/favicon.ico` is all
  that is needed once the asset arrives.

### 2. Homepage and provider wording — done

Live page contains, in this order:

1. “Find help with furniture assembly, clothing alterations, hair braiding,
   decluttering, gardening and more in Scotland”
2. “Repairs and Other Services”
3. “One place to find local help with repairs and everyday services.”
4. Buttons: **Find local help**, **Post a job**, **Offer your services**
5. Search label: “What do you need help with?”
6. Provider copy: “Have a skill to offer? You don’t need to run a business to
   get started. Apply as an individual or a business and choose the services
   you can confidently provide. Some services may require evidence of
   qualifications or insurance.”

Removed from the live page: “Keep good things working”, “What needs fixing?”,
“Built for neighbours, students and makers”, and “Approved providers only”.

### 3. Provider approval and verification — done

- “Approved providers only” was replaced with “Provider applications are
  reviewed before profiles go live.”
- “We aim to review completed applications within 24 hours.” appears in the
  provider section immediately after the application call to action.
- The “What we check” list is retained, including the disclaimer about
  qualifications, insurance and checks.
- Public provider profiles show a **Checks completed** panel based on the data
  held: application reviewed, photo of work added, services and pilot areas
  listed, plus an extra-evidence note where relevant.
- Admins review and manage applications at `/admin/providers`. The list has
  status filters (Waiting for review, Approved, Not approved, Suspended) and
  each application page offers Approve, Ask for more information, Reject,
  Suspend and Reinstate. New applications also create an in-app notification.

### 4. Domain and branded-domain email — blocked on client input

Current state:

- The site is still at the Vercel test address `https://ros-jet.vercel.app`.
  No branded ROS domain is attached.
- `hello@example.com` and the placeholder sender domain are no longer shown.
- The footer currently says “Contact the administrator through the site”
  because no agreed `SUPPORT_EMAIL` or `ADMIN_NOTIFICATION_EMAIL` value is
  configured. The app does not create or own a mailbox.

Needed from the client:

1. The branded domain name.
2. Admin access to the registrar/DNS host, or the DNS records supplied by
   Vercel and Resend to be applied by the client.
3. The agreed ROS support email address.
4. Confirmation of who creates and monitors that mailbox. **Recommendation:**
   the client creates the mailbox under the ROS domain and gives us the address
   to configure; we cannot create a mailbox without an account we control.
5. A Resend account/API key and verified sending domain, with SPF and DKIM at
   DNS, before email can be tested.

After those are supplied we can attach the domain, update
`NEXT_PUBLIC_SITE_URL`, Supabase redirect URLs and Google OAuth origins, then
test sign-in and password reset on the branded domain.

### 5. One login for both roles — done

One account can post customer jobs, apply to offer services, see application
status, and after approval switch between **Find help** and **Provide
services** without signing out. Customer jobs and provider offers remain in
separate dashboards.

## 2. How to test one login for both roles

Demo accounts (test only; must be removed before public launch):

| Email | Password | Role |
|---|---|---|
| `admin@example.com` | `password123` | Admin |
| `customer@example.com` | `password123` | Customer |
| `provider@example.com` | `password123` | Approved provider |
| `pending@example.com` | `password123` | Pending applicant |

Steps:

1. Sign in at `/login` as `customer@example.com`. You land on `/jobs`.
2. Post a job from **Post a job**. It appears in the customer dashboard.
3. Apply to offer services from `/provide/apply`. The application status is
   visible at `/account`.
4. Sign in as `admin@example.com`, open `/admin/providers`, find the
   application and approve it.
5. Sign back in as the same `customer@example.com` account. After approval it
   lands on `/provide` as an approved provider.
6. On `/account` (or the dashboard account menu) click **Switch to Find help**.
   You go to `/jobs` without signing out. Sign out and back in: it still opens
   `/jobs`.
7. Click **Switch to Provide services** on `/account`. You return to `/provide`.
8. Sign in as `provider@example.com` to see the pre-approved version of the
   same flow. A plain customer without an approved provider profile does not
   see the switch control.

Verified live on 26 November 2026: provider sign-in → `/provide`, provider
switch to customer → `/jobs`, re-sign-in → `/jobs`, switch back → `/provide`;
customer sign-in → `/jobs` with no switch control; admin sign-in → `/admin`.

## 3. Project access and technical handover

### 3.1 Current ownership / control

| Service | What can be confirmed from the repository | Transfer needed |
|---|---|---|
| GitHub | Repo `fixneardev-del/ros`, public, `main` branch. Client confirmed full ownership via `fixneardev@gmail.com`; the shared password must be rotated and is not recorded. | No transfer needed if `fixneardev-del` is the client-controlled org; confirm final visibility. |
| Vercel | Project `ros` under the `fixneardev-del` scope; site `ros-jet.vercel.app`. Client reports SSO access and all env vars in Vercel. | Grant admin access to the configuring account, then attach the domain. |
| Supabase | Project ref `eohqgkxnjshnzwadglnh`; client reports SSO access. | Grant Owner/Admin access, rotate secret key, verify billing. |
| Resend | Not configured in the repository; client reports SSO access. | Grant admin access, verify domain, enter API key securely in Vercel. |
| Google OAuth | Configured in Supabase Auth; Google Cloud project not visible | Confirm client-owned Google Cloud project and OAuth client |
| Domain / DNS | None attached | Provide domain and DNS admin access |
| GitHub Actions CI | In the repository | Transfers with the repo |
| Analytics | First-party Supabase table only; no external provider | Client to confirm no external analytics account is needed |
| Monitoring | Vercel logs only; no external tool | Client to confirm whether external monitoring is required |

I cannot transfer these accounts from the repository. Ownership must be
accepted through invitations to accounts the client controls. Please provide:

- GitHub: client username/org and invitation email; personal vs org and public
  vs private preference.
- Vercel: client account email or team ID; confirmation that project `ros`
  should move to it.
- Supabase: client organisation/account email; Owner/Admin invitation; plan and
  billing confirmation.
- Resend: client account email; sending domain; API key entered directly in
  Vercel or through the client’s password manager.
- Google Cloud: confirmation the client owns the OAuth project; final domain
  origins and redirect URI.
- Domain/DNS: final domain, registrar/DNS host and access method.
- Billing: latest invoices or billing-admin access for Vercel, Supabase,
  Resend, GitHub, domain registrar and Google Cloud.

**Do not send passwords or API keys in email, chat or a shared document.**

### 3.2 Source code and documentation

Complete and current source is on `main`; CI is green and the latest code was
verified on the live deployment. Included:

- Next.js app source: `app/`, `components/`, `lib/`
- Server actions and authorization rules
- Migrations, seed data and RLS tests: `supabase/`, `tests/rls/`
- Unit and browser tests: `tests/`
- Deployment config: `vercel.json`
- CI: `.github/workflows/ci.yml`
- Docs: `README.md`, `docs/`, `.context/`, `DECISIONS.md`

Key documents:

- Setup: `README.md`, `docs/local-development.md`
- Deployment: `docs/handover.md`, section 3.2 of
  `docs/project-access-and-technical-handover.md`
- Architecture: `README.md`, section 3.2 of the handover document
- Schema: `supabase/migrations/0001_init.sql` and follow-ups
  `0002_google_profile_name.sql`, `0003_active_dashboard.sql`; starter data
  `supabase/seed.sql`; access tests `tests/rls/`
- Maintenance: `docs/admin-guide.md`, `docs/manual-test-script.md`,
  `docs/client-login-details.md`
- Scheduled/background work: Vercel Cron calls `/api/notifications/retry`
  daily at 06:00 UTC; `lib/events.ts` queues email with `after()`; GitHub
  Actions runs CI. No Supabase Edge Functions, inbound webhooks or persistent
  queue workers were found.

### 3.3 Environment variables and secrets

The complete list, purpose, platform and development/staging/production
requirements are in section 3.3 of
`docs/project-access-and-technical-handover.md` and `.env.example`. Groups:

- Public app config: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Server-only Supabase: `SUPABASE_SECRET_KEY`
- Email: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`,
  `ADMIN_NOTIFICATION_EMAIL`, `SUPPORT_EMAIL`
- Recovery/cron: `RESET_SESSION_SECRET`, `CRON_SECRET`
- Test-only: `SUPABASE_DB_URL` or the separate DB parts,
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, `ALLOW_DEMO_ACCOUNTS`

No real secret value is in the repository. Secure handover: transfer accounts
first, rotate secrets from the client-owned accounts, enter them directly in
Vercel/Supabase/Resend or in the client’s password manager, and never send them
through chat, email or a shared document. Google OAuth client secret stays in
Supabase Auth, not in app environment variables.

### 3.4 Third-party services and subscriptions

| Service | Purpose | Owner evidence | Cost |
|---|---|---|---|
| GitHub | Source, issues, CI | `fixneardev-del` | likely free for public repo; confirm billing |
| Vercel | Hosting, builds, cron, logs | `fixneardev-del` scope | confirm via Vercel billing |
| Supabase | Postgres, Auth, Storage, RLS | project ref above | confirm via Supabase billing |
| Resend | Transactional email | not configured | confirm via Resend billing |
| Google Cloud / OAuth | Google sign-in | not visible in repo | usually free at low volume; confirm |
| Domain registrar / DNS | Branded domain and email DNS | none attached | client to confirm |
| Mailboxes | Support and admin notification | not created by app | client’s provider |
| GitHub Actions | CI | part of repo | included with GitHub plan |
| Payments | none used | N/A | none |
| AI services | none used | N/A | none |
| External analytics | none; Supabase table only | N/A | included with Supabase |
| External monitoring | none; Vercel logs only | N/A | confirm if wanted |
| Storage | Supabase Storage buckets | transfers with Supabase | included in plan |

### 3.5 Database and infrastructure

Full client admin access is **not yet confirmed** and should be granted
directly to client accounts on Supabase, Vercel, GitHub, Resend, Google Cloud
and the DNS host. After transfer, verify tables/RLS, Storage buckets
`provider-photos` and `job-photos`, Auth providers and redirect URLs, Vercel
env vars/cron/domain, Resend domain and SPF/DKIM, and billing.

Backup and recovery today:

| Asset | Current recovery source | Gap |
|---|---|---|
| Source code | Git history | access transfer pending |
| Schema | `supabase/migrations/*.sql` | some hosted-data fixes are not yet migrations |
| Reference data | `supabase/seed.sql` | demo/production separation to tighten |
| Hosted DB contents | Supabase platform backup/PITR, depending on plan | not verified here; no app-level export job |
| Storage objects | Supabase Storage | no separate export job |
| Secrets | platform dashboards | no secure export; transfer and rotate |

Before public launch I recommend: confirm Supabase PITR/retention, take a
logical export, move hosted demo-data fixes into a repeatable script, document
a restore drill, and keep production secrets in a client-controlled vault.

## Outstanding blockers before public launch

1. Official ROS logo and exact brand green.
2. Branded domain, DNS access and Vercel/Resend/Supabase/Google URL updates.
3. ROS support mailbox decision and address; Resend key/domain/SPF/DKIM.
4. Verified client-side admin access on Vercel, Supabase and Resend; rotate the password shared in chat and all platform secrets. GitHub ownership is already confirmed by the client.
5. Apply `supabase/migrations/0003_active_dashboard.sql` to hosted Supabase so
   dashboard switching persists on the profile. Until then it persists in a
   user-scoped cookie and approved providers default to `/provide`.
6. Remove or change the published demo passwords.
7. Replace pilot legal copy with approved text.
