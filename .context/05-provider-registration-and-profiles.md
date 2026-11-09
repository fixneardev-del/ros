# 05 – Provider Registration, Profiles and Portfolio

**Phase:** 2 | **Est.:** 10–12 hrs

## Purpose
Let eligible individuals, sole traders and businesses apply, build a public profile and show previous work.

## Data model
`profiles` (shared), `provider_services` (provider ↔ category), `provider_photos`, plus provider fields: display_name, provider_type (individual / sole trader / business), bio, service_areas, contact preference, status (pending / approved / rejected / suspended)

## Functional requirements
1. Application form: provider type, name, bio, categories, service areas (postcode districts), optional business name.
2. Photo upload (Supabase Storage): max 6 images, JPG/PNG/WebP, size limit (e.g. 5 MB), server-side type validation.
3. Declaration checkbox: provider confirms information is accurate and accepts terms.
4. Status = pending until admin approves; provider sees status on their dashboard.
5. Approved profiles are public; pending/rejected are not.
6. Providers can edit bio, services, areas and photos; edits to key fields may return profile to review (admin setting).
7. Public profile page: name, bio, categories, photos, areas, "Post a job" prompt.
8. Notice on profile: platform does not guarantee qualifications, insurance or verification.

## Acceptance criteria
- [ ] Application is saved and appears in admin queue
- [ ] Photos upload, display and can be deleted by the owner only
- [ ] Profile is public only after approval
- [ ] Oversized or non-image files are rejected

## Exclusions
Automated identity/insurance checks, reviews and ratings, provider subscriptions.
