# 06 – Customer Job Requests ("Post a job")

**Phase:** 3 | **Est.:** 8–10 hrs

## Purpose
Customers describe what they need so local providers can respond.

## Data model
`job_requests`: id, customer_id, category_id, title, description, postcode, postcode_district, preferred_timeframe, photos (storage paths), status (open / receiving_offers / closed / removed), created_at

## Functional requirements
1. Form fields: category, title, description, postcode, preferred date/timeframe, up to 4 photos.
2. Postcode validated against pilot coverage (same rules as search).
3. Login required; unauthenticated users are prompted to register then returned to the form.
4. Customer dashboard: list own jobs, view status, view offers, close a job.
5. Job details do not expose full address or phone number publicly; only postcode district is shown to providers until the customer chooses to share contact.
6. Admin can view and remove any job.

## Statuses
Open → Receiving offers → Closed (customer or admin). Removed = hidden by admin.

## Acceptance criteria
- [ ] Valid job appears in customer dashboard and admin dashboard
- [ ] Only the owner can edit or close their job
- [ ] Out-of-pilot postcode is blocked with a clear message
- [ ] Confirmation email sent on submission

## Exclusions
Booking calendar, scheduling, payments, deposits.
