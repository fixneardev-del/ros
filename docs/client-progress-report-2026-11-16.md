# Repairs and Other Services — Client Progress Report

**Prepared:** 16 November 2026  
**Project:** Repairs and Other Services pilot MVP  
**Production URL:** https://ros-jet.vercel.app  
**Status:** Deployed and operational; a small number of client-side configuration items remain before launch.

---

## 1. Executive summary

The pilot MVP has been built, tested and deployed. It covers the full marketplace loop:

- Customers can search for approved local providers, view profiles, post jobs, receive offers and accept one.
- Providers can apply, upload photos, be reviewed by an admin, see matching jobs, send offers and receive contact details after acceptance.
- Admins can approve or reject providers, moderate jobs and offers, manage categories and pilot postcodes, suspend users, review reports and export data.
- Accounts support email/password registration, sign-in, password reset and Google sign-in.
- In-app notifications and transactional email templates are built for every marketplace event.

The application is live on Vercel and connected to the hosted Supabase project. The codebase is in GitHub with an automated CI pipeline covering database rules, security scanning, linting, type checking, unit tests, production build and browser tests.

Two items are currently outside the codebase and need client action:

1. **Google sign-in is blocked by the Google Cloud OAuth configuration.** Google rejects the callback because the authorised redirect URI has not been added to the OAuth client.
2. **Live email delivery is not yet switched on.** The email layer is complete, but Resend credentials, a verified sending domain and Supabase SMTP settings are still required.

Neither item requires application code changes. Both are configuration tasks in client-owned accounts.

---

## 2. Status at a glance

| Area | Status | Notes |
|---|---|---|
| Public website and search | Delivered | Landing page, search, provider profiles, legal pages, waitlist |
| Customer accounts | Delivered | Register, login, logout, password reset, account settings |
| Google sign-in | Built, blocked | Google Cloud redirect URI needs updating |
| Customer job flow | Delivered | Post, edit, close, receive and accept offers, contact release |
| Provider onboarding | Delivered | Four-step application, photos, dashboard, profile editing |
| Provider marketplace | Delivered | Matching jobs, send/edit/withdraw offers, accepted contact details |
| Admin back office | Delivered | Approvals, moderation, users, categories, areas, reports, analytics, exports |
| In-app notifications | Delivered | Notification centre, unread count, preferences |
| Transactional email | Built, not live | Templates and outbox complete; Resend setup pending |
| Security and access control | Delivered | Row-level security, server authorisation, rate limits, security headers, audit log |
| Accessibility and responsive design | Delivered | WCAG AA contrast, mobile layouts, keyboard and screen-reader support |
| Automated testing | Delivered | Unit, database, end-to-end and cross-browser CI |
| Production deployment | Live | https://ros-jet.vercel.app |
| Legal copy | Placeholder | Pilot copy in place; approved client text still needed |
| Custom domain | Pending | Currently on the Vercel preview domain |

---

## 3. What has been delivered

### 3.1 Public website and discovery

- A dedicated landing page with the real service-and-postcode search form, service tiles, a “how it works” section, a provider recruitment band, a privacy section and a waitlist form.
- Search by service and pilot district, with an optional provider-name or keyword search.
- Provider profile pages showing photos, services, coverage areas and an option to report a profile.
- Pilot-area checks so customers know whether their postcode is covered.
- Privacy, terms and cookies pages linked from the footer.
- Custom 404 and 403 pages with appropriate navigation.
- The waitlist captures interest from postcodes outside the current pilot area.

### 3.2 Accounts and authentication

- Customer registration with name, email, password and a required terms checkbox.
- Email/password sign-in and sign-out.
- Forgot-password flow with a branded email containing a one-click reset link and a six-digit code.
- Password reset using either the link or the code.
- Account page with profile details, password change and sign-out.
- Role-aware landing after sign-in: admins go to the admin dashboard, providers to the provider dashboard and customers to their account.
- Safe handling of `next` redirect paths, including rejection of malformed or cross-origin paths.
- Rate limiting on registration, sign-in and password-reset attempts.
- Google sign-in and sign-up added at the client’s request on 16 November 2026.

### 3.3 Customer journey

- Post a job with category, description, postcode and timeframe.
- View and manage a list of the customer’s own jobs.
- Edit or close an open job.
- Receive offers from approved providers.
- Read offer messages, prices and timeframes.
- Accept one offer, which automatically declines the others in a single database transaction.
- Contact details — full postcode, email and phone — are released only after an offer is accepted, and only to the customer and the accepted provider.
- Report a job or provider profile for admin review.
- See job status and offer activity in the customer dashboard.

### 3.4 Provider journey

- Four-step application wizard: about you, services and areas, photos, review.
- Between one and six photos per application, with image type and size validation.
- Provider dashboard showing application status, profile summary and photos.
- Profile editing with a re-approval rule when key details change.
- Matching jobs based on the provider’s services and pilot areas.
- Send an offer with a message, price and timeframe.
- Edit or withdraw an offer while it is still submitted.
- View sent offers and their status.
- After acceptance, see the customer’s full postcode and contact details.
- Receive clear status messages for approval, rejection, requests for more information, suspension and reinstatement.

### 3.5 Admin back office

- Admin overview with key pilot metrics.
- Provider review queue with full application detail.
- Approve, reject, request more information, suspend, reinstate and remove providers.
- Job moderation and offer moderation.
- Category management, including activation and ordering.
- Pilot-area management, including creating, editing and enabling districts.
- User management, including suspension and reinstatement.
- Reports queue for reported jobs and profiles.
- Analytics page with page views, searches, jobs posted and provider applications.
- CSV exports for providers, jobs, offers and waitlist signups.
- Notification delivery retry screen/endpoint.
- Every approval, rejection, suspension, removal and other moderation action records the actor and timestamp.
- Signed-in non-admins receive a 403; anonymous visitors are redirected to sign in.
- Admin access is checked before rendering and again inside every admin action and database policy.

### 3.6 Notifications and email

- Eighteen domain events covering account activity, provider lifecycle, jobs, offers, waitlist signups and reports.
- Branded HTML and plain-text email templates for:
  - Welcome after registration
  - New sign-in security notice
  - Password reset
  - Provider application received
  - Provider approved, rejected, suspended, reinstated or removed
  - More information requested
  - Job posted, cancelled, completed or removed
  - Offer received, accepted or declined
  - Admin alerts for new providers, jobs, waitlist signups and reports
- A database-backed outbox that records every email before sending, so a failed email never fails the user action that triggered it.
- Background sending with a ten-second timeout and idempotency keys to prevent duplicate emails.
- A retry endpoint for failed deliveries, callable by an admin or a scheduler using a secret.
- In-app notification centre with unread counts and links to the relevant job or account page.
- Notification preferences for optional job and offer updates. Security, account and moderation email is always sent.

### 3.7 Design, accessibility and mobile experience

- A distinct public-facing design system for the landing page, search, provider profiles, auth pages and job pages.
- A separate dashboard design system for customer, provider and admin areas.
- Responsive layouts tested at mobile, tablet and desktop widths, including 320px and 375px.
- WCAG AA contrast checks across public and dashboard pages.
- Keyboard navigation, skip links, visible focus states, labelled form fields and status messages that work with screen readers.
- Status is always communicated with text and an icon, not colour alone.
- Reduced-motion support for animations.
- Public pages score 100 for accessibility, best practices and SEO in mobile Lighthouse, with performance in the low 90s.

### 3.8 Security and data protection

- Row-level security on every database table, with policies covering customers, providers, admins and anonymous visitors.
- Server-side authorisation in every write action, in addition to database policies.
- Zod validation on every form and server action.
- Contact details restricted until an offer is accepted.
- Role escalation blocked at the database level.
- Suspended users and providers blocked from posting or sending offers.
- Security headers on every route, including Content Security Policy, HSTS, frame protection, referrer policy and permissions policy.
- Service-role key kept server-side only.
- Secret scanning in CI.
- Audit log for moderation and administrative changes.
- First-party, cookie-free analytics, off by default, so no consent banner is required for the pilot.
- Rate limiting on authentication and other sensitive actions.

### 3.9 Quality assurance

- Unit tests for postcode handling, status transitions, formatting, validation schemas, environment handling and redirect safety.
- Database tests that apply the full schema and prove the row-level security rules, including role escalation, job visibility, offer permissions, contact release and admin-only capabilities.
- End-to-end browser tests covering public pages, search, registration, the terms gate, protected routes, security headers, signed-in customer/provider/admin flows and Google sign-in UI.
- Cross-browser CI coverage across Chromium, Firefox and WebKit.
- Lint, type-check, unit tests, production build, database tests and browser tests all pass in CI.
- Latest GitHub Actions run: **passed all jobs** — RLS, secret scan, lint, types, unit tests, build and end-to-end tests.
- Visual checks at mobile and desktop sizes, including signed-in dashboards against a live database.

### 3.10 Deployment and operations

- Production deployment on Vercel at https://ros-jet.vercel.app.
- Hosted Supabase project configured for database, authentication and storage.
- Environment-specific configuration for local development, CI and production.
- Admin guide, manual acceptance test script and handover notes written.
- Local Supabase stack that runs without Docker, so development and testing do not depend on Docker Desktop.
- Documentation for environment variables, first-admin promotion, redirect URLs, Resend setup, deployment and launch checks.

---

## 4. Recent delivery — Google sign-in and sign-up

Added on 16 November 2026:

- “Continue with Google” on both the login and registration forms.
- Registration through Google still requires the terms checkbox; login uses clickwrap text under the button.
- Supabase PKCE OAuth flow using the existing Google provider.
- Callback exchanges the Google session and lands the user by role:
  - Admin → `/admin`
  - Provider → `/provide`
  - Customer → `/account`
- Safe handling of the `next` path, including rejection of control characters and cross-origin redirect attempts.
- Cache headers on the callback so authentication responses are never cached.
- Unit and browser test coverage for the Google entry points and terms gate.
- The production build is deployed with the Google button visible.

**Current blocker:** Google returns `redirect_uri_mismatch` because the Google Cloud OAuth client does not allow:

`https://eohqgkxnjshnzwadglnh.supabase.co/auth/v1/callback`

The project owner must add that URI to the OAuth client and confirm the authorised JavaScript origin:

`https://ros-jet.vercel.app`

No redeploy is required after the Google Cloud change.

---

## 5. Verification summary

| Check | Result |
|---|---|
| Lint | Pass |
| Type check | Pass |
| Unit tests | 104 pass |
| End-to-end tests | 44 pass in Chromium locally |
| Database RLS tests | Pass |
| Production build | Pass |
| GitHub Actions | All jobs pass |
| Security scan | Pass |
| Mobile Lighthouse (public pages) | Accessibility 100, best practices 100, SEO 100, performance 90–92 |
| Responsive visual checks | Pass at mobile, tablet and desktop |
| Accessibility contrast audit | Pass |
| Production deployment | Live |

Live email delivery has not yet been verified because Resend is not configured.

---

## 6. Items awaiting client action

### 6.1 Google Cloud — required for Google sign-in

On OAuth client:

`1078539888737-2c2s246rst3ouu5moqrd2su84lc59kuu.apps.googleusercontent.com`

Add:

- **Authorised redirect URI:** `https://eohqgkxnjshnzwadglnh.supabase.co/auth/v1/callback`
- **Authorised JavaScript origin:** `https://ros-jet.vercel.app`

This must be done by someone with access to the Google Cloud project that owns the client.

### 6.2 Resend — required for live transactional email

1. Create or confirm the client-owned Resend account.
2. Verify the sending domain and add the SPF and DKIM DNS records.
3. Set these Vercel environment variables:
   - `RESEND_API_KEY`
   - `EMAIL_FROM` using the verified domain, not a free Resend address
   - `EMAIL_REPLY_TO` to a monitored inbox, if replies should be received
4. Set Supabase’s custom SMTP to Resend so confirmation emails are branded and not rate-limited:
   - Host: `smtp.resend.com`
   - Port: `465`
   - User: `resend`
   - Password: the Resend API key
   - Sender: `EMAIL_FROM`
5. Confirm `ADMIN_NOTIFICATION_EMAIL` is the inbox that should receive admin alerts.

### 6.3 Legal copy — launch blocker

The privacy, terms and cookies pages currently contain clearly marked pilot copy. The client’s approved UK GDPR text is still required before public launch.

### 6.4 Domain and brand

- Point the final domain at Vercel and update `NEXT_PUBLIC_SITE_URL`.
- Add the production domain to Supabase redirect URLs and Google authorised origins.
- Supply a logo file if the client wants one; the current wordmark is text-based.

### 6.5 Commercial decisions

- Confirm the Supabase plan.
- Confirm the support/warranty period.
- Confirm the sender name and reply-to inbox.

---

## 7. Known limitations and deliberate exclusions

The pilot deliberately does not include:

- Payments, commission or escrow
- Live chat or SMS
- GPS, maps or distance-based matching
- Booking calendars
- Identity-verification integrations
- Reviews and ratings
- Subscriptions
- AI matching
- Native mobile apps
- Social providers other than Google
- Two-factor authentication
- Multiple admin roles or a full role hierarchy

Additional current limitations:

- Search results and dashboard lists do not paginate yet; they are designed for pilot volumes.
- Legal pages are placeholder copy.
- Google sign-up does not currently send a welcome email; only email/password registration does.
- Failed email retries require a manual admin action or a scheduler call; no Vercel cron is configured yet.
- A custom domain has not yet been attached.

---

## 8. Recommended next steps

1. **Unblock Google sign-in** by updating the Google Cloud OAuth client.
2. **Switch on email** by configuring Resend, the sending domain and Supabase SMTP.
3. **Approve legal copy** and replace the pilot pages.
4. **Attach the production domain** and update the environment and redirect URLs.
5. **Run the manual acceptance script** against production with the client.
6. **Schedule the notification retry endpoint** if automatic retry is required.
7. **Add a welcome email for Google sign-ups** if the client wants identical onboarding across both registration paths.

Once items 1–4 are complete, the pilot is ready for a controlled public launch.

---

## 9. Access and handover

- Production: https://ros-jet.vercel.app
- Source control: GitHub, with CI on every push
- Hosting: Vercel
- Database, auth and storage: Supabase project `eohqgkxnjshnzwadglnh`
- Operational documentation: `docs/admin-guide.md`, `docs/manual-test-script.md`, `docs/handover.md`
- Technical decisions: `DECISIONS.md`
- Build and test commands: `README.md`
