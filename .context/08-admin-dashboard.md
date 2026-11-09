# 08 – Admin Dashboard

**Phase:** 3 | **Est.:** 8–10 hrs

## Purpose
Give the business owner control of the pilot without database access.

## Screens
1. **Overview:** counts of providers (pending/approved), jobs (open/closed), offers.
2. **Providers:** list, filter by status/category, view application and photos, approve / reject (with reason) / suspend / remove.
3. **Jobs:** list and view all requests, remove inappropriate ones.
4. **Offers:** view offers per job.
5. **Categories:** add, edit, reorder, deactivate; set extra-checks flag.
6. **Pilot coverage:** enable/disable postcode districts.
7. **Users:** view registered users; suspend an account.
8. **Reports:** list of content flagged by users (simple "Report" link on profiles and jobs).

## Functional requirements
- Admin-only access enforced server-side and via RLS.
- Every approve/reject/remove action stores who did it and when (audit fields).
- Rejection reason emailed to the provider.
- CSV export of providers and jobs (basic).

## Acceptance criteria
- [ ] Non-admins get a 403 on all admin routes
- [ ] Approving a provider makes them publicly visible and sends an email
- [ ] Suspending a provider removes them from search and profile pages
- [ ] Removed jobs disappear from public/provider views

## Exclusions
Advanced analytics, role hierarchy (multiple admin levels), automated moderation.
