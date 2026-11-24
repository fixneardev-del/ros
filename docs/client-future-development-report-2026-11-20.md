# Repairs and Other Services

## Future Development Report

**Prepared for:** Repairs and Other Services  
**Prepared by:** Product and Engineering Delivery  
**Date:** 22 November 2026  
**Version:** 1.0  
**Companion to:** Project Completion Report, version 1.1, dated 20 November 2026  
**Production environment:** https://ros-jet.vercel.app

---

## Purpose of this report

The pilot MVP is complete and live. This report sets out the work that sits beyond the pilot scope, so the client can decide what to fund next and in what order.

It is a planning document, not a commitment. Capabilities are described at the level needed to compare options. Effort is shown as a relative band, not a price or a delivery date. Each stage needs a short discovery and a fixed scope before it can be estimated precisely.

The report draws on the Project Completion Report, the technical handover, the recorded architecture decisions and the internal delivery notes. Nothing described here has been started or committed.

---

## Where the platform is now

The live platform covers the full marketplace journey: public discovery and search, customer accounts and job posting, provider applications and offers, administrator review and moderation, notifications, first-party analytics and operational reporting. It is deployed on Vercel with a hosted Supabase database, automated checks on every push and a documented handover.

The pilot is deliberately narrow in three ways:

- **Coverage is district-based, not geographic.** Search matches a service and an enabled postcode district. There is no map, distance calculation or GPS.
- **Customers and providers arrange payment themselves.** The platform carries no money, takes no commission and holds no funds.
- **Trust is administrative, not automated.** Administrators approve providers and moderate content. There is no identity verification, ratings or reputation system.

Those choices kept the pilot focused, secure and quick to operate. The capabilities in this report extend them without reworking the core journey.

---

## Launch readiness comes first

The following items are configuration in client-owned accounts, not application development. They need to be completed before a public launch and before new feature work is measured against real usage.

| Item | What is needed | Owner |
|---|---|---|
| Google OAuth | Add the Supabase callback URL as an authorised redirect URI and confirm the production site as an authorised JavaScript origin. Keep the client secret in Supabase. | Client, Google Cloud |
| Transactional email | Verify the sending domain in Resend, add SPF and DKIM, set the API key, sender and administrator inbox in Vercel, and configure Supabase custom SMTP. | Client, Resend |
| Production variables | Set the real environment values in Vercel, including `CRON_SECRET` for scheduled retries. These cannot be changed from the delivery workspace. | Client, Vercel |
| Legal content | Publish approved privacy, terms and cookies copy and replace the pilot contact address. | Client |
| Production domain | Attach the final client domain, then update the Supabase redirect URLs and Google origin to match. | Client |
| Live rehearsal | Run two real accounts through post a job, apply, offer, accept and contact release against hosted Supabase. | Client with delivery support |

Completing these items also closes the remaining verification gaps recorded at handover: a completed live Google sign-in, live email delivery and a hosted two-account marketplace run.

---

## Roadmap stages

Stages are indicative groupings, not a fixed sequence. Stage 1 should come first. After that, stages can be reordered by business value. Effort bands are defined in the next section.

| Stage | Theme | Capabilities | Indicative effort |
|---|---|---|---|
| 1 | Launch readiness and foundations | Live configuration above, shared rate limiting, reliable retries, list pagination, two-factor authentication | Small to medium |
| 2 | Discovery and matching | Maps, distance-based matching, GPS support | Medium |
| 3 | Payments and commercial operations | Payments, commission, escrow, finance-oriented administrator roles | Large to extra large |
| 4 | Communication and scheduling | Live chat, SMS, booking calendars | Medium to large |
| 5 | Trust, retention and platform growth | Identity verification, reviews and ratings, subscriptions, AI matching, native apps, more social providers, multi-level administrator roles | Large to extra large |

---

## Stage 1 — Launch readiness and foundations

This stage closes the known operational gaps and makes the platform ready to grow. It is mostly internal work, with one visible account feature.

- **Shared rate limiting.** The current limiter is per process and resets on deploy. A shared store makes limits consistent across serverless instances before public traffic arrives.
- **Reliable retry processing.** The daily retry job claims up to five rows with no atomic claim or backoff. A durable claim and a backoff schedule make delivery dependable under a backlog.
- **List pagination with server-side filters.** Lists currently hold all rows in memory. Moving filtering and ordering into the database query keeps search responsive as data grows.
- **Two-factor authentication.** Adds a second step to sign-in for customers, providers and administrators, built on the existing Supabase Auth session flow.
- **First-time Google welcome.** The current new-user check uses a timestamp heuristic. A stored marker would make welcome email behaviour exact.

**Outcome:** a platform that behaves predictably under real traffic and a clear baseline for measuring the later stages.

---

## Stage 2 — Discovery and matching

The pilot matches a provider to a job when their services and enabled district agree. Adding location data makes that matching finer and gives customers a clearer view of who can reach them.

- **Maps and postcode geography.** Store coordinates for districts, jobs and provider coverage, then show coverage on a map.
- **Distance-based matching.** Rank providers by distance within a configurable radius, alongside service and availability.
- **GPS support.** Use the device location to prefill a search area, with explicit permission and a manual postcode fallback.

**Depends on:** the district and postcode data already in place, plus a chosen geocoding source.  
**Watch points:** location is personal data. It should be collected only with consent, stored at the precision the feature needs and covered by the privacy copy updated in Stage 1.

---

## Stage 3 — Payments and commercial operations

This is the largest commercial change. It moves the platform from introducing two parties to handling money between them.

- **Payments.** Customers pay through the platform instead of arranging payment directly. This needs a payment provider, a payment record per job or offer and a clear refund path.
- **Commission.** The platform can take a fee from each transaction. Rates, who bears them and how they are reported to providers are product decisions before code is written.
- **Escrow.** Funds are held until work is accepted or a dispute is resolved. This adds a payout schedule, an exception process and more administrative controls.
- **Finance-oriented administrator roles.** Staff who handle money need narrower permissions than full administrators. Multi-level administrator roles can be brought forward from Stage 5 to support this.

**Depends on:** completed provider and job records, accepted-offer state, legal terms covering money handling, and a payment provider account owned by the client. Identity verification is strongly recommended before payouts.  
**Watch points:** money amounts are already stored as integer pence, which is a good base. Tax, dispute handling and payout reconciliation are new obligations that need their own process, not just code.

---

## Stage 4 — Communication and scheduling

Once there is real usage, the next friction is coordination. These features reduce the need to exchange personal contact details outside the platform.

- **Live chat.** A threaded conversation attached to a job or offer, with unread counts and the existing notification centre. Messages need moderation and retention rules.
- **SMS.** Time-critical notifications, such as a new offer or an impending booking, delivered by text as well as email. Consent and opt-out must be explicit.
- **Booking calendars.** Providers publish availability, customers reserve a slot and both sides see one schedule. Calendar sync can follow later.

**Depends on:** accepted-offer state, notification preferences and a chosen messaging or SMS provider.  
**Watch points:** chat and SMS create new personal-data flows and moderation duties. Start with job-scoped messaging rather than open messaging between all users.

---

## Stage 5 — Trust, retention and platform growth

These capabilities build on the traffic and transaction history created by earlier stages. Several depend on having real completed jobs to learn from.

- **Identity verification.** An integration that checks provider identity and, where relevant, insurance or qualifications. The pilot makes no guarantee about these, so verified status must be displayed accurately.
- **Reviews and ratings.** Customers rate completed jobs and providers see their reputation. Moderation, dispute handling and anti-gaming rules matter more than the stars themselves.
- **Subscriptions.** A recurring plan for providers, such as featured placement or a higher application allowance, tied to the payments work in Stage 3.
- **AI matching.** Suggest the best providers for a job using history, service, location and past outcomes. It needs enough completed jobs to be useful and a human override at every step.
- **Native mobile applications.** iOS and Android apps built on the same authentication, data rules and business logic. A responsive web app already works on phones, so the case should rest on a clear user need rather than presence alone.
- **Social providers beyond Google.** Additional sign-in options through the same Supabase Auth pattern already used for Google, each with its own client-owned credentials.
- **Multi-level administrator roles.** Fine-grained roles for support, moderation and finance, with the existing role checks extended rather than replaced. Bring forward to Stage 3 if payments create a finance team.

**Depends on:** Stage 3 for subscriptions, Stage 2 for location-aware matching, and sufficient platform data for reviews and AI matching.  
**Watch points:** do not launch AI matching or reputation features on an empty dataset. Sequence them after a pilot period with real completed jobs.

---

## Capability reference

The table below is a compact index of every capability previously listed as outside the pilot scope. Effort bands are relative planning sizes, not quotations.

| Capability | Stage | Effort | Main dependency | Primary risk |
|---|---|---|---|---|
| Payments, commission and escrow | 3 | XL | Payment provider, legal terms, finance roles | Regulatory and reconciliation obligations |
| Live chat and SMS | 4 | M to L | Messaging and SMS providers, moderation rules | Personal data and moderation load |
| GPS, maps and distance matching | 2 | M | Geocoding source, location consent | Data accuracy and privacy expectations |
| Booking calendars | 4 | M | Provider availability, accepted offers | Double booking and timezone handling |
| Identity verification | 5 | L | Verification provider, updated legal copy | Overstating what a check guarantees |
| Reviews and ratings | 5 | M to L | Completed jobs, moderation process | Gaming and defamation disputes |
| Subscriptions | 5 | M | Payments from Stage 3 | Billing support and churn handling |
| AI matching | 5 | L | Volume of completed jobs, location data | Poor suggestions on sparse data |
| Native mobile applications | 5 | XL | Stable public API, app store accounts | Maintenance cost of two codebases |
| Social providers beyond Google | 5 | S to M | Client-owned OAuth credentials | Account linking and duplicate identities |
| Two-factor authentication | 1 | S | Existing Supabase Auth flow | Recovery and support procedures |
| Multi-level administrator roles | 5, or 3 if needed | M | Existing role checks and RLS policies | Accidental privilege escalation |

---

## How effort is sized

| Band | Meaning |
|---|---|
| Small (S) | Days of work, confined to one area, no new external provider. |
| Medium (M) | Around one to three weeks, with schema, interface and test changes. |
| Large (L) | Several weeks to a couple of months, spanning multiple user roles or one external integration. |
| Extra large (XL) | A multi-sprint programme, often with new infrastructure, compliance work or a second platform. |

These bands assume the existing architecture is kept: server components for reads, server actions for writes, authorisation enforced in both the action and the database, row-level security as the second line of defence, and an outbox for email. Replacing that foundation would add cost to every stage.

---

## Decisions the client needs to make

| Decision | Why it matters | Needed before |
|---|---|---|
| Will the platform hold money, and who takes commission? | Sets the entire shape of Stage 3. | Stage 3 discovery |
| Is escrow required at launch, or after an initial payments release? | Escrow roughly doubles the operational surface. | Stage 3 discovery |
| Which identity and qualification claims will be verified and displayed? | Determines both the integration and the legal wording. | Stage 5 discovery, or Stage 3 if payouts require it |
| Is location consent and precision acceptable to the client? | Drives the design of maps and distance matching. | Stage 2 discovery |
| Will reviews be public before a moderation process exists? | Reputation data is hard to withdraw once published. | Stage 5 discovery |
| Is there a specific user need for native apps beyond the responsive site? | Avoids two app codebases without a clear reason. | Stage 5 discovery |
| Which additional sign-in providers are actually used by the audience? | Each provider adds credentials, support and account-linking rules. | Stage 5 discovery |

---

## Recommended sequence

1. **Complete the launch-readiness items.** They are configuration and verification, not development, and they unlock meaningful usage data.
2. **Run a hosted two-account rehearsal.** Confirm the marketplace journey with real accounts before changing it.
3. **Fund Stage 1.** It removes the known operational limits and makes every later stage cheaper to deliver.
4. **Choose the next stage by business value.** If revenue is the priority, move to Stage 3. If usage and discovery are the priority, move to Stage 2.
5. **Run a short discovery before each stage.** Fix the scope, confirm the decisions in the table above, then replace the effort bands with a delivery estimate.

---

## Document references

| Item | Location |
|---|---|
| Project Completion Report | `docs/client-project-completion-report-2026-11-16.md` and `.pdf` |
| Technical handover | `docs/handover.md` |
| Administrative guide | `docs/admin-guide.md` |
| Manual acceptance script | `docs/manual-test-script.md` |
| Architecture decisions | `DECISIONS.md` |
| Product specification | `SPEC.md` |
| Production application | https://ros-jet.vercel.app |
