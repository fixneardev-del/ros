# 09 – Email Notifications

**Phase:** 4 | **Est.:** 4–5 hrs

## Purpose
Keep users informed at key moments using basic transactional emails.

## Emails included
| Trigger | Recipient |
|---------|-----------|
| Account confirmation / password reset | User |
| Provider application received | Provider + admin |
| Provider approved / rejected | Provider |
| Job request submitted | Customer + admin |
| New offer on a job | Customer |
| Offer accepted / declined | Provider |

## Functional requirements
1. Transactional email service (e.g. Resend or similar, client-owned account, free tier where possible).
2. Plain, branded HTML templates with text fallback.
3. Sent from a client-owned domain address (SPF/DKIM configured when domain is available).
4. Failures logged; do not block the user action.

## Acceptance criteria
- [ ] Each trigger above sends exactly one email to the correct recipient
- [ ] Emails contain no sensitive personal data beyond what is necessary
- [ ] Links in emails resolve to the correct pages

## Exclusions
SMS, push notifications, marketing campaigns, user-configurable preferences, newsletter tooling.
