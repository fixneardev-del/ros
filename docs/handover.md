# Handover notes

## Third party accounts

Every service below must sit in a **client-owned** account. Record the owner
and the billing contact before launch.

| Service | Used for | Account owner | Key or secret |
|---|---|---|---|
| Supabase | Database, auth, file storage | _not set up_ | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` |
| Resend | Transactional email | _not set up_ | `RESEND_API_KEY`, `EMAIL_FROM` |
| Vercel | Hosting | _not set up_ | project connection, no key in the repository |
| GitHub | Source code, CI | _not set up_ | deploy key or GitHub App |

`SUPABASE_SECRET_KEY` is server only. It must never be committed, never be
prefixed with `NEXT_PUBLIC_`, and never be sent to the browser. The older
`SUPABASE_SERVICE_ROLE_KEY` name is still accepted.

## Environment variables

Copy `.env.example` to `.env` for local work, and set the same variables in
Vercel for staging and production. `.env.local` is optional and overrides
`.env` for machine-specific values.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | The canonical URL. Used in email links and the auth redirect allowlist. |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Safe to expose to the browser. The older `NEXT_PUBLIC_SUPABASE_ANON_KEY` still works. |
| `SUPABASE_SECRET_KEY` | yes | Server only. The older `SUPABASE_SERVICE_ROLE_KEY` still works. |
| `RESEND_API_KEY` | yes | Must be a real Resend key. Placeholders disable email and keep outbox rows failed for retry. |
| `EMAIL_FROM` | yes | A verified sending address. `example.com` and localhost addresses disable email. |
| `EMAIL_REPLY_TO` | no | A monitored inbox for replies. Falls back to `EMAIL_FROM`. |
| `ADMIN_NOTIFICATION_EMAIL` | yes | Where admin notifications go. Used as the footer contact address when `SUPPORT_EMAIL` is empty. |
| `SUPPORT_EMAIL` | no | The agreed ROS support mailbox shown in the public footer. No placeholder is rendered until it or `ADMIN_NOTIFICATION_EMAIL` is set. |
| `RESET_SESSION_SECRET` | no | Signs the short-lived password-recovery cookie. Falls back to `SUPABASE_SECRET_KEY`. Set explicitly in production if you want it separate. |
| `CRON_SECRET` | yes for retries | Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` to `/api/notifications/retry`. |

## Supabase setup

1. Create the project and apply `supabase/migrations/0001_init.sql`, then
   `supabase/seed.sql`. Either use the Supabase CLI with
   `npx supabase db reset`, or paste both files into the SQL editor in order.
   The migration is idempotent: it creates what is missing, upgrades the old
   email outbox in place, and is safe to run again.
2. If the schema is already applied and only the demo sign-in accounts are
   missing, set `SUPABASE_SECRET_KEY` and run
   `ALLOW_DEMO_ACCOUNTS=1 npm run hosted:accounts -- --yes`.
   Do not run the demo-account command against production.
3. In **Authentication → URL Configuration**, set **Site URL** to the real
   deployment (`https://ros-jet.vercel.app`, or that address with `/login` if
   you want Supabase's OAuth error fragment to land on the sign-in page). A
   localhost site URL sends failed Google sign-ins back to
   `http://localhost:3000/login#error=...`. Then add these
   redirect URLs for every environment:
   - `http://localhost:3001/auth/callback`
   - `http://localhost:3001/reset-password`
   - `https://ros-jet.vercel.app/auth/callback`
   - `https://ros-jet.vercel.app/reset-password`
   - `https://<your-staging-domain>/auth/callback`
   - `https://<your-staging-domain>/reset-password`
4. Turn on email confirmations or leave them off for the pilot. Either way,
   sign-up requires the terms tick on our own form.
5. Promote the first admin with the SQL in `docs/admin-guide.md`. The owner is
   the account whose email is `ADMIN_NOTIFICATION_EMAIL`; that address also
   receives new-job and provider-application notifications.
6. Reset emails are generated and sent by the app with Resend, so they do not
   use Supabase's reset template. Confirmation emails still come from Supabase;
   see **Domain and email** to send those through Resend too.
7. Google sign-in uses the Google provider on the hosted Supabase project.
   The Google web client's authorized JavaScript origin is
   `https://ros-jet.vercel.app`, its authorized redirect URI is
   `https://eohqgkxnjshnzwadglnh.supabase.co/auth/v1/callback`, and the app
   callback is `https://ros-jet.vercel.app/auth/callback`. Keep the Google
   client secret in Supabase; it is never an application environment variable.
   If GoTrue reports `Unable to exchange external code`, the client ID and
   secret in Supabase do not match the Google web client that holds those two
   authorised values, or the redirect URI is still wrong. Fix that before
   changing application code.
8. Google sign-in emits a sign-in notice on every login and a welcome email on
   the first login. Password sign-up still records terms acceptance; Google
   consent is shown as clickwrap and is not recorded as `accepted_terms_at`.

## Scheduled retries

`vercel.json` schedules `/api/notifications/retry` once a day at 06:00 UTC.
Vercel Hobby plans allow only one cron run per day and may fire anywhere in
that hour; the route processes up to 5 deliveries per run so it stays inside
the function time limit. Set `CRON_SECRET` in Vercel so the scheduled request is
authorised. An administrator can also trigger the endpoint from the dashboard.

## Domain and email

- The client needs to choose the branded ROS domain and give access to its DNS
  host. Add it in **Vercel → Project → Domains** and use the A/CNAME record
  Vercel supplies; Vercel issues the certificate. Keep `ros-jet.vercel.app`
  live for testing until the branded domain has been checked.
- After the domain is attached, set `NEXT_PUBLIC_SITE_URL` to the branded URL,
  add its `/auth/callback` and `/reset-password` URLs to Supabase, and add it
  to the Google client's authorised JavaScript origins. Test sign-in and
  password reset on the branded domain before public launch.
- Agree the ROS support mailbox and decide who creates it. Set `SUPPORT_EMAIL`
  to that address and verify that messages sent to it are received. The app
  does not create the mailbox.
- Verify the sending domain in Resend and add the SPF and DKIM records it
  gives you at the DNS host.
- Add `EMAIL_FROM` using the verified domain, not a free Resend address.
- Set `EMAIL_REPLY_TO` to an inbox someone watches. Transactional email should
  not come from `noreply@`.
- Welcome, sign-in notice and password reset emails are sent by the app. The
  reset email contains a one-click link and, when Supabase supplies one, a
  6-digit code; both expire after one hour. Completing either path sets a
  short-lived signed cookie; a normal signed-in session alone cannot open the
  password form.
- If Resend is not configured, password resets fall back to Supabase's own
  reset email. A Resend timeout does not trigger a second token.
- To send Supabase's own confirmation emails through Resend as well, set a
  custom SMTP server in **Authentication → SMTP Settings**: host
  `smtp.resend.com`, port `465`, user `resend`, password = the Resend API key,
  sender = `EMAIL_FROM`. Then update the confirmation template to match the
  site.

## Deployment

1. Create a Vercel project and connect the GitHub repository.
2. Set every environment variable for the environment being deployed.
3. Deploy to staging. Use the staging domain to add the Supabase redirect
   URLs from above.
4. Run `docs/manual-test-script.md` against staging.
5. Point the production domain at Vercel when the client accepts staging.

## What is not in the build

- Payments, commission, live chat, SMS, maps, booking calendars, identity
  verification, reviews and ratings, subscriptions, AI matching, native apps,
  social providers other than Google and two factor auth are all out of scope
  for the pilot.
- The legal pages hold pilot copy. Replace them with the approved text.
- The source is hosted at `github.com/fixneardev-del/ros` and deployed through
  Vercel. The local machine must be linked to the correct Vercel scope to change
  production environment variables.

## Files worth knowing

| Path | What it is |
|---|---|
| `supabase/migrations/0001_init.sql` | The whole database: tables, RLS, triggers, RPCs, storage. |
| `supabase/demo-accounts.sql` | The three demo sign-in accounts, safe to re-run in the SQL editor. |
| `supabase/seed.sql` | Starter categories, pilot districts and site settings. |
| `tests/rls/` | The access rules, written as SQL. |
| `docs/admin-guide.md` | How to run the pilot. |
| `docs/manual-test-script.md` | The acceptance run. |
| `docs/client-login-details.md` | Demo sign-in details for client review. |
| `.context/progress.md` | Current state, decisions and open questions. |
| `DECISIONS.md` | Why the build looks the way it does. |
