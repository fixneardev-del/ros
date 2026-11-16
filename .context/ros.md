# REPAIRS & OTHER SERVICES (ROS)
# MASTER MVP SPECIFICATION & AI DEVELOPMENT GUIDE

**Document:** `ROS_MVP_MASTER_SPEC.md`  
**Version:** 1.0  
**Status:** Core MVP  
**Product:** Local Services Marketplace  
**Initial Market:** Glasgow, Scotland  
**Primary Stack:** Next.js, React, TypeScript, Supabase  
**Purpose:** Single source of truth for product requirements, architecture, implementation and AI coding agents.

---

# PART 1 — PRODUCT DEFINITION

## 1.1 Product Overview

Repairs & Other Services (ROS) is a local services marketplace that connects customers requiring practical assistance with individuals and businesses offering skills, services, repairs and expertise.

The platform enables customers to discover service providers, publish job requests and receive offers from interested providers.

Providers can create profiles, showcase their skills, discover relevant jobs and submit offers.

Administrators oversee the marketplace, approve providers and manage platform activity.

### Customer value proposition

Find reliable people in your local community who can help with repairs, services and everyday tasks.

### Provider value proposition

Turn your skills, hobbies, experience and expertise into income by connecting with people in your local community.

## 1.2 Product Vision

Build a trusted, accessible and easy-to-use local marketplace where skills meet demand.

The platform should make it straightforward for:

- Customers to find help.
- Providers to find work.
- Administrators to manage marketplace quality.

## 1.3 Initial Market

The first release should focus on selected Glasgow postcode areas and communities.

The system must support geographical expansion through configurable service areas rather than hardcoded geographical restrictions.

## 1.4 Core Marketplace Model

The fundamental marketplace relationship is:

**Customer → Job Request → Provider Discovery → Offer → Customer Acceptance**

This is the central workflow that defines the MVP.

---

# PART 2 — USER ROLES AND PERMISSIONS

## 2.1 Customer

Customers can:

- Register and log in.
- Verify their email.
- Manage their profiles.
- Browse service categories.
- Search providers.
- View approved provider profiles.
- Post job requests.
- Upload job photographs.
- View their job history.
- Receive provider offers.
- Compare offers.
- Accept an offer.
- Cancel eligible jobs.
- View job and offer statuses.

Customers must only manage their own private records.

## 2.2 Service Provider

Providers can:

- Register and log in.
- Create provider profiles.
- Describe their services and experience.
- Select service categories.
- Define service areas.
- Upload portfolio photographs.
- Submit profiles for approval.
- Browse relevant open jobs after approval.
- Submit offers.
- Edit eligible offers.
- Withdraw eligible offers.
- View their accepted jobs.
- Manage their profiles.

Only approved and active providers can participate in the public marketplace and submit offers.

## 2.3 Administrator

Administrators can:

- Access a protected administration dashboard.
- View customers.
- View providers.
- Review provider applications.
- Approve or reject applications.
- Suspend or reactivate accounts.
- Manage service categories.
- View jobs.
- Manage inappropriate or problematic listings.
- Monitor offers.
- View marketplace statistics.
- Review administrative audit logs.

Administrative permissions must be enforced server-side and through database security policies.

## 2.4 Permission Matrix

| Action | Customer | Provider | Admin |
|---|---|---|---|
| Register | Yes | Yes | Controlled |
| Manage own profile | Yes | Yes | Yes |
| Browse providers | Yes | Yes | Yes |
| Create jobs | Yes | No | Yes |
| Browse eligible jobs | No | Yes | Yes |
| Submit offers | No | Yes | Yes |
| View offers on own jobs | Yes | No | Yes |
| Accept offers | Yes | No | Yes, if authorised |
| Approve providers | No | No | Yes |
| Manage categories | No | No | Yes |
| Manage all accounts | No | No | Yes |

---

# PART 3 — CORE MVP FUNCTIONAL REQUIREMENTS

## 3.1 Authentication

Use Supabase Auth.

Required functionality:

- Customer registration.
- Provider registration.
- Email and password login.
- Email verification.
- Password reset.
- Logout.
- Protected routes.
- Session management.
- Role-aware navigation.

Rules:

- Every authenticated user must have a profile.
- User roles must not be self-assigned through untrusted frontend input.
- Administrator access must be granted through a trusted administrative process.
- Protected data must not rely solely on hidden frontend routes.

Acceptance criteria:

- Registration works for customers and providers.
- Email verification works.
- Login and logout work.
- Password reset works.
- Users cannot access unauthorised dashboards.
- Users cannot change their own privileges.

## 3.2 Customer Profiles

Required fields:

- Full name.
- Email address.
- Phone number (optional).
- Profile photograph (optional).
- Postcode.
- Created date.
- Updated date.

Customers must be able to view and update their information.

Private contact information must not be exposed publicly by default.

## 3.3 Provider Profiles

Required fields:

- Provider name or business name.
- Profile photograph.
- Short introduction.
- Detailed description.
- Skills.
- Experience.
- Service categories.
- Service areas.
- Portfolio photographs.
- Application status.
- Created date.
- Updated date.

Provider application statuses:

- Draft.
- Submitted.
- Under review.
- Approved.
- Rejected.
- Suspended.

Only approved providers should appear in public search.

## 3.4 Service Categories

The system must support configurable service categories.

Initial examples:

- Home repairs.
- Plumbing.
- Electrical services.
- Gardening.
- Cleaning.
- Painting and decorating.
- Furniture assembly.
- Moving assistance.
- Technology support.
- General maintenance.
- Other services.

Administrators must be able to:

- Create categories.
- Edit categories.
- Activate categories.
- Deactivate categories.

Categories must be database-driven.

## 3.5 Provider Directory

Customers must be able to browse and search providers.

Search filters:

- Service category.
- Provider name.
- Postcode or supported postcode area.
- Provider service area.

Search results should display:

- Profile photograph.
- Provider name.
- Main service category.
- Short description.
- Service area.
- Link to full profile.

Search results must exclude:

- Unapproved providers.
- Suspended providers.
- Inactive providers.

## 3.6 Job Posting

Customers must be able to publish requests for services.

Required job fields:

- Job title.
- Service category.
- Description.
- Postcode.
- Optional address details.
- Preferred date (optional).
- Budget indication (optional).
- Photographs (optional).
- Creation date.
- Job status.

Job statuses:

- Draft.
- Open.
- Offer received.
- Offer accepted.
- In progress.
- Completed.
- Cancelled.

Customer capabilities:

- Create a job.
- Edit an eligible job.
- Upload photographs.
- View jobs.
- View offers.
- Cancel eligible jobs.

## 3.7 Provider Job Discovery

Approved providers should see relevant open jobs.

Matching criteria:

- Provider service categories.
- Provider service areas.
- Job location.
- Job status.

Job cards should display:

- Job title.
- Category.
- Description preview.
- Postcode area.
- Publication date.
- Optional budget.
- Offer count, where appropriate.

Do not expose private customer information unnecessarily.

## 3.8 Provider Offers

Providers can submit offers against eligible jobs.

Offer fields:

- Job ID.
- Provider ID.
- Proposed price.
- Proposal message.
- Estimated completion time (optional).
- Submission date.
- Offer status.

Offer statuses:

- Submitted.
- Updated.
- Accepted.
- Rejected.
- Withdrawn.

Rules:

- Only approved providers may submit offers.
- Only open jobs accept new offers.
- Prevent duplicate active offers from the same provider for the same job.
- Providers can manage their own offers.
- Customers can view offers associated with their jobs.

## 3.9 Offer Comparison and Acceptance

Customers must be able to compare offers.

Display:

- Provider name.
- Provider profile photograph.
- Provider profile.
- Proposed price.
- Proposal message.
- Estimated completion time.
- Offer submission date.

When accepting an offer:

1. Verify customer ownership of the job.
2. Verify that the job is eligible for acceptance.
3. Verify that the selected offer belongs to the job.
4. Verify that the provider is still approved and active.
5. Accept the selected offer.
6. Close competing offers.
7. Update the job status.
8. Record the acceptance event.

The acceptance operation must be atomic to prevent multiple providers from being accepted for the same job.

## 3.10 Customer Dashboard

Display:

- Profile overview.
- Active jobs.
- Jobs awaiting offers.
- Offers received.
- Accepted offers.
- Completed jobs.
- Recent activity.

## 3.11 Provider Dashboard

Display:

- Profile completion.
- Approval status.
- Relevant open jobs.
- Submitted offers.
- Accepted offers.
- Active jobs.
- Completed jobs.
- Recent activity.

## 3.12 Administration Dashboard

Display:

- Total customers.
- Total providers.
- Approved providers.
- Pending applications.
- Total jobs.
- Open jobs.
- Jobs with offers.
- Accepted offers.

Required management sections:

- Customer management.
- Provider management.
- Provider approval.
- Category management.
- Job management.
- Offer overview.
- Account management.

Administrative actions must be recorded.

---

# PART 4 — USER JOURNEYS

## 4.1 Customer Journey

1. Visit the website.
2. Register as a customer.
3. Verify email.
4. Log in.
5. Browse service categories or providers.
6. Create a job request.
7. Add job details and photographs.
8. Publish the job.
9. Receive offers.
10. Compare providers.
11. Accept an offer.
12. View the accepted job.

## 4.2 Provider Journey

1. Visit the website.
2. Register as a provider.
3. Verify email.
4. Create a provider profile.
5. Select services.
6. Define service areas.
7. Upload portfolio photographs.
8. Submit application.
9. Wait for administrator approval.
10. Access the provider dashboard after approval.
11. Discover relevant jobs.
12. Submit offers.
13. Manage accepted jobs.

## 4.3 Administrator Journey

1. Log in through authorised administrator access.
2. View marketplace dashboard.
3. Review pending provider applications.
4. Inspect submitted profiles.
5. Approve or reject providers.
6. Manage categories.
7. Monitor jobs and offers.
8. Suspend problematic accounts where necessary.
9. Review administrative activity.

---

# PART 5 — TECHNICAL ARCHITECTURE

## 5.1 Technology Stack

### Frontend

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- Responsive UI components.

### Backend

- Next.js server-side functionality.
- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Supabase Row Level Security.

### Development and deployment

- GitHub.
- Vercel.
- Supabase.

Do not introduce additional frameworks without a clear architectural reason.

## 5.2 Architecture Principles

1. Feature-based organisation.
2. Reusable UI components.
3. Separation of UI and business logic.
4. Server-side validation.
5. Database-enforced relationships.
6. Role-based authorisation.
7. Secure file storage.
8. Type-safe application code.
9. Reusable shared utilities.
10. Maintainable and testable modules.

## 5.3 Recommended Application Structure

```text
ros/
├── AGENTS.md
├── README.md
├── package.json
├── .env.example
│
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── (customer)/
│   │   ├── (provider)/
│   │   ├── admin/
│   │   └── api/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── navigation/
│   │   └── shared/
│   │
│   ├── features/
│   │   ├── authentication/
│   │   ├── customers/
│   │   ├── providers/
│   │   ├── services/
│   │   ├── jobs/
│   │   ├── offers/
│   │   └── admin/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── auth/
│   │   ├── security/
│   │   ├── validation/
│   │   └── utils/
│   │
│   ├── hooks/
│   ├── types/
│   └── providers/
│
├── supabase/
│   ├── migrations/
│   ├── seed/
│   └── tests/
│
├── docs/
│   └── ROS_MVP_MASTER_SPEC.md
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

Adapt this structure to the existing repository. Do not move or delete working files merely to match the example.

---

# PART 6 — DATABASE ARCHITECTURE

## 6.1 Database Principles

Supabase PostgreSQL is the authoritative data store.

Requirements:

- UUID primary keys.
- Foreign key constraints.
- Appropriate indexes.
- Timestamps.
- Database constraints.
- Explicit status values.
- Migration-based schema management.
- RLS policies.
- Transactional handling of critical operations.

## 6.2 Core Tables

### `profiles`

Purpose: Shared user information.

Suggested columns:

- `id` UUID, primary key and reference to `auth.users`.
- `role` user role.
- `full_name`.
- `email`.
- `phone`.
- `avatar_url`.
- `postcode`.
- `created_at`.
- `updated_at`.

Roles: customer, provider, admin.

Role assignment must be controlled through trusted server-side processes.

### `provider_profiles`

Suggested columns:

- `id` UUID.
- `user_id` UUID, unique foreign key.
- `business_name`.
- `headline`.
- `description`.
- `experience_years`.
- `approval_status`.
- `is_active`.
- `created_at`.
- `updated_at`.

### `service_categories`

Suggested columns:

- `id` UUID.
- `name`.
- `slug`.
- `description`.
- `is_active`.
- `created_at`.
- `updated_at`.

### `provider_categories`

Suggested columns:

- `id` UUID.
- `provider_id`.
- `category_id`.
- `created_at`.

Add