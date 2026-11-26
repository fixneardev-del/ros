# ROS MVP landing page review — implementation status

Review received from Fisayo on 26 November 2026 against
`https://ros-jet.vercel.app/`.

## Implemented in code

| Review item | Change |
|---|---|
| 1 — Logo and brand colours | Shared `RosLogo` component in the desktop header, mobile menu fallback, studio header fallback and footer. `app/icon.svg` added for the browser tab. Public surfaces now use white backgrounds, ROS green buttons/accents and dark text. Service tiles are white with green icons and subtle borders. The service and postcode search stays prominent in the hero. Dashboard list-search controls sit in the top-right utility area, matching the placement used by GitHub, GitLab and common dashboard systems, with a ROS green submit button. Dashboard primary and header action buttons are ROS green instead of charcoal. |
| 2 — Homepage and provider wording | Hero now opens with “Find help with furniture assembly, clothing alterations, hair braiding, decluttering, gardening and more in Scotland”, then “Repairs and Other Services” and “One place to find local help with repairs and everyday services.” All three buttons are present: Find local help · Post a job · Offer your services. The search ticket asks “What do you need help with?”. The provider band uses the supplied individual-or-business copy; the duplicate provider/payment strip was removed from the footer. |
| 3 — Provider approval wording | “Approved providers only” replaced with “Provider applications are reviewed before profiles go live.” The review explanation and “What we check” list are retained. “We aim to review completed applications within 24 hours” sits next to “Offer your services”. Public provider profiles show a Checks completed panel based on the data we actually hold. New applications appear as pending in `/admin/providers`; admins also receive an in-app notification and email alert. |
| 4 — Domain and email | `SUPPORT_EMAIL` added as the public footer contact address, with `ADMIN_NOTIFICATION_EMAIL` as fallback. No placeholder address is shown when neither is set. Handover documents the branded-domain steps and what the client must provide. |
| 5 — One login for both roles | Implemented. One account can keep posting customer jobs, apply to offer services, see the application status, and switch between “Find help” and “Provide services” from the account menu once approved. Customer jobs and provider offers stay in their own dashboards. Both dashboard “View site” links were removed. |

## Needed from the client

1. The official ROS logo file (preferably SVG, plus the exact brand green hex
   value). The current `public/ros-logo.svg` and `app/icon.svg` are a clear
   interim ROS monogram, not the designed logo. Replacing those two files is
   all that is needed once the real asset arrives.
2. The agreed ROS support email address, and confirmation of who will create
   and monitor that mailbox. Set it as `SUPPORT_EMAIL` in Vercel.
3. The branded domain name and access to its DNS host. Keep
   `https://ros-jet.vercel.app` for testing until the branded domain passes
   sign-in and password-reset checks.

## Item 5 — delivered behaviour

- `profiles.active_dashboard` stores `customer` or `provider`. New accounts
  default to `customer`; the migration backfills accounts that already had an
  approved provider profile.
- The switch is available only to a non-admin account with an approved provider
  profile. Pending, rejected and suspended applicants remain on the customer
  dashboard and see their application status on `/account`.
- Admins remain admin-only. The saved choice controls sign-in, the proxy and
  server-side permission checks, so a customer page cannot be used to reach a
  provider action without switching first.
- A provider application now redirects to `/account?applied=1`. Provider
  onboarding stays on the public `/provide/apply` page; an existing application
  sends the user to `/account` instead of showing the form again.
- The mobile dashboard account menu and the account page both offer
  “Switch to Provide services” / “Switch to Find help”. Switching saves the
  choice and opens the selected dashboard.
- The two “View site” links in `components/dash/dash-header.tsx` were removed.
- Role lookups read `role` without depending on `active_dashboard`, so an admin
  still lands on `/admin` and can open the portal while the hosted migration is
  pending. The saved-dashboard read falls back to `customer` when the column is
  absent.

Historical estimate for this item was **1–2 engineering days** for
implementation, tests and documentation; no currency figure was given because
no client rate basis was supplied.

## Deployment note

`supabase/migrations/0003_active_dashboard.sql` adds the saved-choice column and
backfill. It must be applied to the hosted Supabase project before live
dashboard switching works. Admin and customer access are unaffected until then:
the runtime reads `role` separately and treats an unreadable saved dashboard as
`customer`. `scripts/hosted-accounts.mjs` now creates the approved demo provider
profile and sets its saved dashboard, so re-running the demo seed does not
regress.

## Testing status

All checks pass in this workspace:

- `npm run lint`
- `npm run typecheck`
- `npm test` — 132 tests
- `npm run build`
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e` — 59 tests

The browser tests include the updated homepage headline, the service search
that still carries the postcode through to the results page, the
`/account?applied=1` redirect and a full approved-provider dashboard switch and
switch-back.
