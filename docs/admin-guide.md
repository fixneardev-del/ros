# Admin guide

Everything the site owner needs to run the pilot. No database access required.

## Signing in

The first admin is the account whose email is set in `ADMIN_NOTIFICATION_EMAIL`.
That is the handover owner and the address that receives new-job and
application notifications. Promote it by running one SQL update in the Supabase
SQL editor. The profile trigger creates every other account as a customer.

```sql
update public.profiles
set role = 'admin'
where id = '<the-uuid-of-your-account>';
```

Find the uuid in **Authentication → Users** by searching for the
`ADMIN_NOTIFICATION_EMAIL` address, then sign in at `/login`. The
**Administration** link appears in the header once the role is set.

## The admin area

`/admin` is the overview. It has links to every tool below.

### Overview

Counts of providers waiting for review, approved providers, open and closed
jobs, offers and open reports. Every count is a link to the matching list.
Further down, the **Public copy and settings** panel edits the pilot notice,
the review turnaround text, the provider independence notice, the support
email and whether analytics are on.

### Providers

The provider queue. Filter by status and, at the same time, by service. New
applications appear here as **pending** immediately after submission. The
administrator also gets an in-app notification and an email alert, so a new
application does not depend on someone opening the queue.

Open a provider to see their application, photos, services, areas and review
history. From there you can:

- **Approve.** Makes them visible in search and on their public profile, and
  emails them. If any of their services is flagged as needing extra checks,
  you have to confirm you have seen the evidence first.
- **Ask for more information.** The provider stays pending and gets an email
  with your note.
- **Not approve.** Give a reason. It is emailed to the provider and shown on
  their dashboard so they can fix it and apply again.
- **Suspend.** Hides them from search and their public profile without
  deleting anything. Use this for a provider who needs to step away.
- **Remove.** Deletes the provider profile, their services and their photos.
  Their account still works, so they can apply again later. Use this for an
  application that should not be reviewed at all.

Every decision records who made it and when. The dates are shown on the
provider's page.

### Jobs

Every job request, newest first. Filter by status. **Remove** hides a job from
providers and the public, emails the customer with your reason, and records who
removed it.

### Offers

Every offer sent on the marketplace, with the provider, the job, the price and
the timeframe. **Withdraw** pulls an offer from the customer.

### Categories

Add, rename, deactivate and reorder the service list. The order here is the
order everywhere else on the site. Use **Move up** and **Move down** rather
than typing a sort number. **Requires extra checks** means an admin has to
confirm they have seen a provider's evidence before approving them.

Deactivating a category hides it from the search, job and application forms.
It does not delete any existing jobs or provider records.

### Pilot area

Turn postcode districts on and off. A disabled district cannot post jobs, does
not appear in search and cannot be selected by providers. Existing jobs are
left alone.

### Users

Every registered account with their role and status. Suspending an account
stops it posting jobs, sending offers and using the admin area. It does not
delete anything.

### Reports

Content flagged by customers and providers from a profile or a job page. Mark
a report reviewed or dismissed once it has been handled.

### Analytics

First party, cookie free events from the last 30 days: page views, searches,
jobs posted and provider applications. No IP address, no user id and no third
party script are stored. Analytics are off until you set the analytics
provider to `first-party` on the overview page.

### CSV export

Use the **Export providers**, **Export jobs** and **Export waitlist** buttons on
the overview, or the **Export CSV** buttons on the provider, job and offer lists.
The same files are available at `/api/admin/export/providers`,
`/api/admin/export/jobs`, `/api/admin/export/offers` and
`/api/admin/export/waitlist`. The waitlist file lists the email, postcode and
date of every interest signup.

## Making the site public

The pilot runs on a set of enabled postcode districts. Before opening up:

1. Confirm the pilot districts on **Pilot area**.
2. Confirm the service list on **Categories**.
3. Replace the pilot copy on `/privacy`, `/terms` and `/cookies` with the
   approved legal text.
4. Set the support email on the overview page.
5. Review every provider waiting for review.
6. Send a test job end to end with two accounts to check the email flow.

## Troubleshooting

**A provider says they cannot see their own profile.** Their account may be
suspended. Check **Users**.

**A job is not showing for a provider.** Check that the provider covers the
postcode district and offers that service, and that the provider is approved.

**An email did not arrive.** Look at the `notification_deliveries` table in
Supabase. A row with status `failed` and an error explains why. Rows can be
`queued`, `failed`, `sent` or `skipped`; `skipped` means the recipient's
preferences suppressed an optional email, while `failed` is retryable. The
daily cron retries up to 5 failed rows per run. You can also call
`/api/notifications/retry` from an admin session or with the header
`Authorization: Bearer $CRON_SECRET`. An attempt cap of five prevents a bad row
from retrying forever.

**Someone cannot reach `/admin`.** They are signed in but their account is not
an admin. Set `role = 'admin'` on their profile row.

**A signed-in non-admin sees a 403 page.** That is the intended answer. The
role is checked in `proxy.ts` before the page renders, so the status code is a
real 403 rather than a page that loads and then complains.
