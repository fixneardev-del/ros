# 11 – Security, Testing, Deployment and Handover

**Phase:** 4 | **Est.:** 8–10 hrs

## Security
- Row Level Security on all tables; role checks server-side.
- Input validation and sanitisation on all forms.
- File upload validation (type, size) and private/public bucket rules.
- Rate limiting on sign-up, login and form submissions where supported.
- Secrets stored in environment variables, never in the repository.
- Database backups using the client's Supabase plan (frequency depends on plan).

## Testing
- Manual test script covering every acceptance criterion in features 01–10.
- Responsive and cross-browser check (Chrome, Safari, Firefox, mobile).
- Permission tests (customer / provider / admin).

## Deployment
- Vercel project and Supabase project **in client-owned accounts**.
- Environment configuration, domain connection, SSL.
- Staging preview for client acceptance, then production release.

## Handover package
- Source code in a GitHub repository transferred to the client
- Setup and environment documentation
- Database schema and seed data
- Admin guide (short)
- List of third-party accounts and who owns them

## Acceptance and warranty
- Defects against the agreed acceptance criteria are fixed during the warranty period (propose 60 days; the agreement has an unresolved 60/90-day placeholder).
- New features are quoted separately.

## Exclusions
Penetration testing, load testing, ongoing maintenance and hosting costs.
