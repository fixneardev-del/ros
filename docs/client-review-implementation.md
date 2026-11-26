# ROS MVP landing page review — implementation status

Review received from Fisayo on 26 November 2026 against
`https://ros-jet.vercel.app/`.

## Implemented in code

| Review item | Change |
|---|---|
| 1 — Logo and brand colours | Shared `RosLogo` component in the desktop header, mobile menu fallback, studio header fallback and footer. `app/icon.svg` added for the browser tab. Public surfaces now use white backgrounds, ROS green buttons/accents and dark text. Service tiles are white with green icons and subtle borders. The service and postcode search stays prominent in the hero. |
| 2 — Homepage and provider wording | Hero now opens with “Find help with furniture assembly, clothing alterations, hair braiding, decluttering, gardening and more in Scotland”, then “Repairs and Other Services” and “One place to find local help with repairs and everyday services.” All three buttons are present: Find local help · Post a job · Offer your services. The search ticket asks “What do you need help with?”. Provider band and footer use the supplied individual-or-business copy. |
| 3 — Provider approval wording | “Approved providers only” replaced with “Provider applications are reviewed before profiles go live.” The review explanation and “What we check” list are retained. “We aim to review completed applications within 24 hours” sits next to “Offer your services”. Public provider profiles show a Checks completed panel based on the data we actually hold. New applications appear as pending in `/admin/providers`; admins also receive an in-app notification and email alert. |
| 4 — Domain and email | `SUPPORT_EMAIL` added as the public footer contact address, with `ADMIN_NOTIFICATION_EMAIL` as fallback. No placeholder address is shown when neither is set. Handover documents the branded-domain steps and what the client must provide. |
| 5 — One login for both roles | **Not started.** This reverses the strict one-dashboard-per-account decision and needs the scope/cost confirmation requested in the review. See below. |

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
4. Confirmation to start item 5 after seeing the scope and estimate below.

## Item 5 — scope and estimate

The MVP currently has one account, but the dashboard is chosen from the
account's stored state. A customer who applies becomes provider-only, and the
profile switcher was removed when strict isolation was introduced. The
reviewed behaviour therefore needs new development:

- Add an “active dashboard” choice for accounts that have both a customer and
  provider identity, available from the account menu without signing out.
- Let a customer submit a provider application and see its status without
  losing their customer dashboard.
- Keep customer jobs and provider offers in their own dashboards.
- Update the proxy, permissions, headers and account page to read the active
  choice instead of inferring a single role.
- Update unit and browser tests, plus the handover and decision records.

Estimate: **1–2 engineering days** for implementation, tests and documentation.
I cannot give a currency figure without your hourly or fixed-rate basis. Per
the review's instruction, work has not started until that cost basis and
approval are confirmed.

## Testing status

All checks pass in this workspace:

- `npm run lint`
- `npm run typecheck`
- `npm test` — 119 tests
- `npm run build`
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e` — 58 tests

The browser tests include the updated homepage headline and the service search
that still carries the postcode through to the results page.
