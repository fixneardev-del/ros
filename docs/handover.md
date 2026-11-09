# Handover notes

## Third party accounts

Every service below must sit in a **client-owned** account. Record the owner
and the billing contact before launch.

| Service | Used for | Account owner | Key or secret |
|---|---|---|---|
| Supabase | Database, auth, file storage | _not set up_ | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Resend | Transactional email | _not set up_ | `RESEND_API_KEY`, `EMAIL_FROM` |
| Vercel | Hosting | _not set up_ | project connection, no key in the repository |
| GitHub | Source code, CI | _not set up_ | deploy key or GitHub App |

`SUPABASE_SERVICE_ROLE_KEY` is server only. It must never be committed, never
be prefixed with `NEXT_PUBLIC_`, and never be sent to the browser.

## Environment variables

Copy `.env.example` to `.env.local` for local work, and set the same variables
in Vercel for staging and production.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | The canonical URL. Used in email links and the auth redirect allowlist. |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Safe to expose to the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server only. |
| `RESEND_API_KEY` | yes | Email is skipped silently when it is missing. |
| `EMAIL_FROM` | yes | The sender address. Needs SPF and DKIM set up on the sending domain. |
| `ADMIN_NOTIFICATION_EMAIL` | yes | Where admin notifications go. Also the contact address in the footer. |
| `CRON_SECRET` | no | Lets a scheduler call `/api/notifications/retry` without an admin session. |

## Supabase setup

1. Create the project and run `supabase/migrations/0001_init.sql`, then
   `supabase/seed.sql`. Either use the Supabase CLI with
   `npx supabase db reset`, or paste both files into the SQL editor in order.
2. In **Authentication → URL Configuration**, set the site URL and add these
   redirect URLs for every environment:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`
   - `https://<your-staging-domain>/auth/callback`
   - `https://<your-staging-domain>/reset-password`
3. Turn on email confirmations or leave them off for the pilot. Either way,
   sign-up requires the terms tick on our own form.
4. Promote the first admin with the SQL in `docs/admin-guide.md`. The owner is
   the account whose email is `ADMIN_NOTIFICATION_EMAIL`; that address also
   receives new-job and provider-application notifications.
5. Replace the default Auth email templates so confirmations and resets look
   like the rest of the site.

## Domain and email

- Point a domain at Vercel and let Vercel issue the certificate.
- Verify the sending domain in Resend and add the SPF and DKIM records it
  gives you at the DNS host.
- Add `EMAIL_FROM` using the verified domain, not a free Resend address.

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
  social login and two factor auth are all out of scope for the pilot.
- The legal pages hold pilot copy. Replace them with the approved text.
- The project is not yet in its own Git repository. It currently sits inside a
  larger repository on the build machine.

## Files worth knowing

| Path | What it is |
|---|---|
| `supabase/migrations/0001_init.sql` | The whole database: tables, RLS, triggers, RPCs, storage. |
| `supabase/seed.sql` | Starter categories, pilot districts and site settings. |
| `tests/rls/` | The access rules, written as SQL. |
| `docs/admin-guide.md` | How to run the pilot. |
| `docs/manual-test-script.md` | The acceptance run. |
| `.context/progress.md` | Current state, decisions and open questions. |
| `DECISIONS.md` | Why the build looks the way it does. |
