# Repairs and Other Services

## Project Completion Report

**Prepared for:** Repairs and Other Services  
**Prepared by:** Product and Engineering Delivery  
**Date:** 20 November 2026  
**Version:** 1.1  
**Production environment:** https://ros-jet.vercel.app

---

## Executive summary

The Repairs and Other Services pilot MVP is complete and deployed.

The platform delivers the full local services marketplace journey: customers discover approved providers and post jobs, providers apply and send offers, and administrators manage approvals, moderation and pilot coverage from a dedicated back office. The application includes secure accounts, role-based dashboards, transactional notifications, responsive design and automated quality checks.

All scoped application features have been designed, built, tested and deployed. The production build, continuous integration checks and hosted database configuration have been verified, and the application is live on its production domain. No application development remains in the pilot scope. The remaining items are one-time, client-owned configuration in external accounts. The platform is ready for client acceptance and pilot launch.

---

## Delivery summary

| Workstream | Delivered |
|---|---|
| Public website and discovery | Complete |
| Customer accounts and authentication | Complete |
| Google sign-in and sign-up | Complete |
| Customer job marketplace | Complete |
| Provider onboarding and workspace | Complete |
| Administration and moderation | Complete |
| Notifications and transactional email | Complete |
| Design, accessibility and mobile experience | Complete |
| Security, privacy and access control | Complete |
| Analytics and operational reporting | Complete |
| Automated testing and CI/CD | Complete |
| Production deployment and documentation | Complete |

---

## Platform capabilities

### Public experience

The public website gives visitors a clear route into the marketplace.

- A dedicated landing page with real service and postcode search.
- Service tiles covering the pilot categories.
- A guided explanation of how the marketplace works.
- Provider recruitment content and a waitlist for outside pilot areas.
- Search by service and pilot district, with optional keyword search.
- Approved provider profiles with photos, services and coverage areas.
- Clear pilot-area messaging for customers.
- Privacy, terms and cookies pages linked from the footer.
- Purpose-built 404 and 403 pages.
- Content reporting for jobs and provider profiles.

### Accounts and authentication

The account system supports customers, providers and administrators.

- Customer registration with name, email, password and terms acceptance.
- Email and password sign-in and sign-out.
- Google sign-in and sign-up through the existing Google provider.
- Role-aware landing after authentication: administrator, provider or customer.
- Forgot-password flow with a secure reset link and six-digit code.
- Password reset using either the link or the code.
- Account page with profile details, password change and sign-out.
- Safe redirect handling for protected pages.
- Rate limiting on registration, sign-in and password-reset requests.
- Session refresh and secure cookie handling.

### Customer marketplace

Customers can complete the full job-posting and offer-selection journey.

- Post a job with category, description, postcode and timeframe.
- View and manage a personal list of jobs.
- Edit or close an open job.
- Receive offers from approved providers.
- Review offer messages, prices and timeframes.
- Accept one offer, with all other offers declined automatically.
- Release full contact details only after acceptance.
- See the accepted provider’s contact information.
- Report a job or provider profile for review.
- Track job status and offer activity from the customer dashboard.

### Provider workspace

Providers can apply, build a profile and win work.

- Four-step application covering personal details, services, areas, photos and review.
- Between one and six photos per application, with type and size validation.
- Provider dashboard showing application status, profile summary and photos.
- Profile editing with a controlled re-approval rule for key changes.
- Matching jobs based on services and pilot areas.
- Offer creation with message, price and timeframe.
- Offer editing and withdrawal while still submitted.
- Sent-offer tracking and status visibility.
- Contact details released after the customer accepts an offer.
- Clear status messaging for approval, rejection, information requests, suspension and reinstatement.

### Administration and moderation

Administrators can run the pilot entirely from the dashboard.

- Overview of pilot activity and key metrics.
- Provider review queue with full application detail.
- Approve, reject, request more information, suspend, reinstate and remove providers.
- Job moderation and offer moderation.
- Category management, including activation and ordering.
- Pilot-area management, including district creation, editing and enabling.
- User management, including suspension and reinstatement.
- Reports queue for reported jobs and profiles.
- Analytics for page views, searches, jobs posted and provider applications.
- CSV exports for providers, jobs, offers and waitlist signups.
- Notification delivery monitoring and retry.
- Audit records for moderation and administrative actions.
- Role-based access to every administrative route.

### Notifications and communications

The platform keeps customers, providers and administrators informed.

- Eighteen domain events across account activity, provider lifecycle, jobs, offers, waitlist signups and reports.
- Branded HTML and plain-text email templates.
- Welcome email after registration.
- New sign-in security notice.
- Password-reset email with link and one-time code.
- Provider application and moderation emails.
- Job and offer lifecycle emails.
- Administrator alerts for new providers, jobs, waitlist signups and reports.
- Database-backed outbox that records every email before sending.
- Background delivery with timeout and idempotency protection.
- Retry support for failed deliveries.
- In-app notification centre with unread counts.
- Notification preferences for optional job and offer updates.
- Security, account and moderation email delivered as transactional messages.
- Email configuration validated before sending, so placeholder credentials never produce a misleading delivery result.

### Design and accessibility

The product is designed for clarity, trust and mobile use.

- A dedicated public design system for the landing page, search, provider profiles, authentication and job pages.
- A separate dashboard design system for customer, provider and administrator areas.
- Responsive layouts validated at mobile, tablet and desktop widths.
- WCAG AA contrast across public and dashboard pages.
- Keyboard navigation and visible focus states.
- Skip links and labelled form fields.
- Screen-reader-friendly status messages.
- Status communicated with text and icons, not colour alone.
- Reduced-motion support for animations.
- Mobile Lighthouse scores of 100 for accessibility, best practices and SEO.
- Performance scores in the low 90s on public pages.

### Security and governance

Security is built into the application and the database.

- Row-level security on every database table.
- Policies covering customers, providers, administrators and anonymous visitors.
- Server-side authorisation in every write action.
- Zod validation on forms and server actions.
- Role escalation blocked at the database level.
- Contact details restricted until an offer is accepted.
- Suspended users and providers blocked from posting or sending offers.
- Security headers on every route, including Content Security Policy and HSTS.
- Service-role credentials kept server-side only.
- Secret scanning in the continuous integration pipeline.
- Audit logging for moderation and administrative changes.
- First-party, cookie-free analytics, disabled by default.
- Rate limiting on authentication and sensitive actions.
- Short-lived signed recovery session required before a password can be reset.
- Timing-safe authentication for the scheduled retry endpoint.

### Analytics and reporting

The platform gives the client operational visibility.

- First-party page-view analytics.
- Search tracking.
- Job-post tracking.
- Provider-application tracking.
- Administrator analytics dashboard.
- Event-mix visualisation.
- CSV exports for operational reporting.
- Audit history for administrative actions.

---

## Technical delivery

The platform is built on a modern, maintainable stack.

| Layer | Implementation |
|---|---|
| Application | Next.js App Router and React |
| Language | TypeScript with strict type checking |
| Styling | Tailwind CSS with design tokens |
| Database | Supabase Postgres |
| Authentication | Supabase Auth with email/password and Google |
| Storage | Supabase Storage for provider and job photos |
| Email | Resend with branded templates and an outbox |
| Hosting | Vercel |
| Source control | GitHub with automated CI |
| Unit testing | Vitest |
| Browser testing | Playwright across Chromium, Firefox and WebKit |
| Database testing | SQL suite covering row-level security |

The codebase follows a consistent server-first architecture. Reads are handled in Server Components, writes are handled in Server Actions, and every action authenticates, authorises, validates, executes, emits events and returns a typed result.

The database migration is idempotent and includes tables, indexes, helper functions, triggers, row-level security, RPCs, storage buckets and policies. Seed data provides the starter categories, pilot districts and site settings.

---

## Quality assurance

The platform has been verified across application logic, database rules, browser behaviour and deployment.

| Check | Result |
|---|---|
| Lint | Pass |
| Type checking | Pass |
| Unit tests | 116 pass |
| End-to-end tests | 44 pass in Chromium locally; Chromium, Firefox and WebKit in CI |
| Database row-level security tests | Pass in CI |
| Hosted Supabase | Schema, reference data and Google provider verified |
| Production build | Pass |
| GitHub Actions | All jobs pass (run 44644130295) |
| Secret scan | Pass |
| Mobile Lighthouse | Accessibility 100, best practices 100, SEO 100, performance 90–92 |
| Responsive visual checks | Pass at mobile, tablet and desktop |
| Accessibility contrast audit | Pass |
| Production deployment | Live — production routes return 200 |

The automated suite covers public pages, search, registration, the terms gate, protected routes, security headers, signed-in customer, provider and administrator flows, and Google sign-in.

The database suite proves the access rules, including profile creation, role escalation prevention, suspended-user restrictions, provider application and approval, job visibility, offer permissions, contact release and administrator-only capabilities.

---

## Deployment and operations

The application is deployed and operational.

- Production environment: https://ros-jet.vercel.app
- Hosting: Vercel
- Database, authentication and storage: Supabase
- Hosted schema, reference data and authentication settings verified
- Google sign-in enabled in hosted authentication
- Source control and CI: GitHub
- Automated checks on every push
- GitHub Actions run 44644130295 passed all jobs
- Environment-specific configuration for development, CI and production
- Local Supabase stack that runs without Docker
- Administrative guide for day-to-day operation
- Manual acceptance test script
- Technical handover notes
- Environment variable reference
- First-administrator promotion procedure
- Deployment and redirect URL documentation

---

## Client handover

The application is complete and deployed at https://ros-jet.vercel.app. The hosted database is configured and Google sign-in is enabled in hosted authentication. The settings below are one-time launch configurations in client-owned accounts; they do not require further application development.

### Google authentication

The Google sign-in and sign-up integration is built, deployed and enabled in the hosted Supabase project. Activation uses the client’s Google Cloud OAuth client:

- Add the Supabase callback URL as an authorised redirect URI.
- Confirm the production site as an authorised JavaScript origin.
- Retain the Google client secret inside Supabase.

### Transactional email

The email platform is built and deployed. Activation uses the client’s Resend account and sending domain:

- Verify the sending domain in Resend.
- Add the SPF and DKIM records supplied by Resend.
- Add the Resend API key and sender address to the production environment.
- Configure Supabase SMTP with the Resend credentials so confirmation emails use the branded sender.
- Confirm the administrator notification inbox.

### Legal content

The privacy, terms and cookies page framework is complete. The client’s approved legal copy can be published into the existing pages.

### Production domain

The application is live on its Vercel production domain at https://ros-jet.vercel.app. The final client domain can be attached when DNS access is available, followed by the corresponding Supabase redirect URLs and Google origin.

---

## Pilot scope

The pilot is intentionally focused on the core marketplace journey. The following capabilities sit outside the pilot scope and form the natural next phase:

- Payments, commission and escrow
- Live chat and SMS
- GPS, maps and distance-based matching
- Booking calendars
- Identity-verification integrations
- Reviews and ratings
- Subscriptions
- AI matching
- Native mobile applications
- Social providers beyond Google
- Two-factor authentication
- Multi-level administrator roles

This scope keeps the pilot focused, secure and quick to operate while preserving a clear path for future expansion.

---

## Acceptance

The Repairs and Other Services pilot MVP is presented as complete.

The application delivers the agreed marketplace journey, administrative controls, notifications, security model, responsive design and operational tooling. It is deployed, tested and supported by documented handover material.

| Role | Name | Signature | Date |
|---|---|---|---|
| Client representative |  |  |  |
| Delivery lead |  |  |  |

---

## Project references

| Item | Location |
|---|---|
| Production application | https://ros-jet.vercel.app |
| Source repository | GitHub |
| Administrative guide | docs/admin-guide.md |
| Manual acceptance script | docs/manual-test-script.md |
| Technical handover | docs/handover.md |
| Architecture decisions | DECISIONS.md |
| Build and test commands | README.md |
