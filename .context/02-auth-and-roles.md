# 02 – Authentication and Roles

**Phase:** 1 | **Est.:** 5–6 hrs

## Purpose
Let customers, providers and admins sign in and see only what they are allowed to.

## Roles
| Role | Can do |
|------|--------|
| Customer | Post and manage own jobs, view offers on own jobs |
| Provider | Manage own profile, view open jobs in own categories/areas, submit offers (once approved) |
| Admin | Everything in the admin dashboard |

## Functional requirements
1. Email + password sign-up and login via Supabase Auth, with email confirmation.
2. Google sign-in and sign-up through Supabase's Google provider (added at the client's request on 2026-11-16).
3. Password reset by email.
4. Role stored on the `profiles` table; default role = customer.
5. A user can choose "Offer your services" to start a provider application (role becomes provider-pending, then provider on approval).
6. Admin role assigned manually in the database (no public admin sign-up).
7. Row Level Security policies enforce ownership (users can only read/write their own records).

## Acceptance criteria
- [ ] New user can register, confirm email and log in
- [ ] Customer cannot open provider or admin pages
- [ ] Provider cannot edit another provider's profile or any job
- [ ] Unauthenticated users cannot submit jobs or offers

## Exclusions
Social providers other than Google, two-factor authentication, SSO.
