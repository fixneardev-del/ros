# 07 – Provider Offers

**Phase:** 3 | **Est.:** 7–9 hrs

## Purpose
Approved providers respond to open jobs with a short proposal and indicative price.

## Data model
`provider_offers`: id, job_id, provider_id, message, indicative_price (GBP, optional), estimated_timeframe, status (submitted / accepted / declined / withdrawn), created_at

## Functional requirements
1. Providers see open jobs matching their categories and service areas.
2. One offer per provider per job (can withdraw and edit before acceptance).
3. Offer form: message, indicative price or "quote on inspection", estimated timeframe.
4. Customer sees all offers on their job with provider summary and profile link.
5. Customer can accept or decline an offer; accepting marks the job closed and notifies the provider.
6. Contact details are released to both parties only after acceptance (the customer and provider arrange the work directly).
7. Admin can view all offers and remove inappropriate ones.

## Acceptance criteria
- [ ] Only approved providers can submit offers
- [ ] A job can receive multiple offers
- [ ] Accepting an offer updates statuses and triggers email notifications
- [ ] Providers cannot see other providers' offers

## Exclusions
In-platform chat, payment or escrow, commission, ratings.
