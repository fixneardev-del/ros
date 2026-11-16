# Manual test script

A walkthrough of every acceptance criterion in `.context/01`–`.context/10`. Run it
against a staging build with the pilot seed data loaded.

**Before you start**

- [ ] Open a private browser window for each role you need: customer, provider, second provider, admin.
- [ ] Record the browser, date and tester in the results column.
- [ ] Use two real postcode districts from the pilot (for example `G12 8QQ` and `G11 1AA`).
- [ ] Have an admin account ready. Promotion is a server-side SQL update, not a UI action.

---

## 01 Homepage and navigation

| # | Step | Expected | Result |
|---|---|---|---|
| 1.1 | Open `/` at 375px, 768px and 1280px | No sideways scroll. The brand, nav and hero read cleanly at each width. | |
| 1.2 | On mobile, open the menu | Find help, Post a job, Offer your services, Log in all present. | |
| 1.3 | Click **Find local help** | The results page opens with the service and postcode carried across. | |
| 1.4 | Click **Post a job** | The login page opens when signed out, the job form when signed in. | |
| 1.5 | Click **Offer your services** | The provider application starts. | |
| 1.6 | Check the footer on every page | Privacy, Terms, Cookies and Contact are present. | |

## 02 Auth and roles

| # | Step | Expected | Result |
|---|---|---|---|
| 2.1 | Register with a name, email, password and the terms tick | The account is created. The terms tick is required. | |
| 2.2 | Try to register without the terms tick | The form refuses to submit and says why. | |
| 2.3 | Register without ticking terms using the browser console | The server refuses. The rule is on the server, not only in the browser. | |
| 2.4 | Log out, then log in with the same details | You land on your account page. | |
| 2.5 | Use **Forgot password** | A reset email arrives with a link and a 6-digit code. Either the link or the code opens the reset form. | |
| 2.6 | Reset to a short password | The form refuses it. Passwords need at least 10 characters. | |
| 2.7 | Sign in, then open `/account` and change your name | The new name shows in the header and on your profile. | |
| 2.8 | Sign in, then open `/admin` as a customer | A **403** page. Not a redirect, not a blank screen. Check the status code in the browser network panel. | |
| 2.9 | Sign in as an admin, then open `/admin` | The admin overview loads. | |

## 03 Service categories

| # | Step | Expected | Result |
|---|---|---|---|
| 3.1 | Open `/search` | Every seeded category appears in the service dropdown. | |
| 3.2 | As admin, add a category | It appears on the homepage, search and post-a-job form. | |
| 3.3 | Rename a category | The new name shows everywhere at once. | |
| 3.4 | Deactivate a category | It disappears from the public dropdown but its history stays intact. | |
| 3.5 | Use **Move up** and **Move down** | The order changes and stays changed after a reload. | |
| 3.6 | Turn on extra checks for a category | Approving a provider in that category asks you to confirm you saw the evidence. | |

## 04 Service and postcode search

| # | Step | Expected | Result |
|---|---|---|---|
| 4.1 | Search with a non-Glasgow postcode | The waitlist screen explains we are not there yet. | |
| 4.2 | Search with a malformed postcode | The form says the postcode does not look right. | |
| 4.3 | Search with a pilot postcode | Approved providers matching the service appear. | |
| 4.4 | Search for a service outside the provider's list | That provider does not appear. | |
| 4.5 | Search from a district the provider does not cover | That provider does not appear. | |
| 4.6 | Search with no results | A clear empty state, not a blank page. | |

## 05 Provider registration and profiles

| # | Step | Expected | Result |
|---|---|---|---|
| 5.1 | Apply as a provider with no photos | The application is refused and asks for a photo. | |
| 5.2 | Apply with one photo | The application is submitted and the status is **Waiting for review**. | |
| 5.3 | Search for your own new profile | It is not visible. Pending providers are private. | |
| 5.4 | Apply again with the same account | The site says you already have a provider profile. | |
| 5.5 | Edit your display name and save | The status returns to pending and the admin sees it again. | |

## 06 Customer job requests

| # | Step | Expected | Result |
|---|---|---|---|
| 6.1 | Post a job with a title, description and postcode | The job is created and opens on its own page. | |
| 6.2 | Try a title under 5 characters or a description under 20 | Both are refused with a message. | |
| 6.3 | Post a job outside a pilot district | The site asks you to join the waitlist instead. | |
| 6.4 | Open **My jobs** | Your jobs are listed with their status. | |
| 6.5 | Edit an open job | The edit saves and the change shows on the job page. | |

## 07 Provider offers

| # | Step | Expected | Result |
|---|---|---|---|
| 7.1 | As an approved provider, open **Matching jobs** | Only jobs matching your services and areas appear. | |
| 7.2 | Send an offer with a message under 20 characters | It is refused. | |
| 7.3 | Send an offer with a price | The price shows in pounds on the customer's job page. | |
| 7.4 | Send an offer with no price | It shows as **Quote on inspection**. | |
| 7.5 | As the customer, open your job | You see the offer, the price and the timeframe. | |
| 7.6 | As another customer, open that job | You cannot see it. | |
| 7.7 | Accept an offer | The job closes, the other offers are declined and contact details appear. | |
| 7.8 | Accept an offer twice | The second attempt is refused. | |
| 7.9 | As a provider who did not win, check contact details | No contact details are shown. | |

## 08 Admin dashboard

| # | Step | Expected | Result |
|---|---|---|---|
| 8.1 | Open `/admin` as a customer | A **403** page. Check the status code, not just what is on screen. | |
| 8.2 | Open `/admin` as an admin | Counts for pending and approved providers, open and closed jobs, offers and open reports. | |
| 8.3 | Filter providers by status and by service | The list matches both filters at once. | |
| 8.4 | Open a provider application | You see the application, the photos and the review history. | |
| 8.5 | Approve a provider | They appear in search and on their public profile. They get an email. | |
| 8.6 | Approve a provider in an extra-checks category without ticking the box | It is refused until you confirm. | |
| 8.7 | Reject a provider with a reason | The reason is emailed to them and shown on their dashboard. | |
| 8.8 | Suspend a provider | They disappear from search and their public profile returns 404. | |
| 8.9 | Reinstate a provider | They come back. | |
| 8.10 | Remove a provider with a reason | The profile, services and photos are gone. The account still works. | |
| 8.11 | Remove a job with a reason | It disappears from provider views. The customer is emailed. | |
| 8.12 | Remove an offer | It is withdrawn from the customer's job. | |
| 8.13 | Check the review dates on a provider | The page shows who last reviewed it and when it was suspended. | |
| 8.14 | Enable and disable a pilot district | Jobs cannot be posted there while disabled, and existing jobs are untouched. | |
| 8.15 | Suspend a user account | They cannot post jobs or send offers. | |
| 8.16 | Export providers and jobs as CSV | Both files download with the expected columns. | |
| 8.17 | Open `/admin/analytics` | Event counts and recent events, or a clear note that analytics are off. | |

## 09 Email notifications

| # | Step | Expected | Result |
|---|---|---|---|
| 9.1 | Register | A welcome email arrives. If Supabase confirmations are on, a confirmation email follows. | |
| 9.2 | Request a password reset | The reset email arrives with a working link and a 6-digit code. | |
| 9.3 | Apply as a provider | The provider and the admin both get an email. | |
| 9.4 | Approve the provider | They get one approval email. | |
| 9.5 | Reject the provider | They get one rejection email with the reason. | |
| 9.6 | Post a job | The customer and the admin both get an email. | |
| 9.7 | Send an offer | The customer gets one email. | |
| 9.8 | Accept the offer | The provider gets one acceptance email. | |
| 9.9 | Decline an offer | The provider gets one decline email. | |
| 9.10 | Look at the notification outbox in Supabase | One row per outbox email: provider, job, offer, welcome and sign-in notices. Reset emails are sent directly and are not stored. | |
| 9.11 | Sign in with an existing account | A new sign-in notice arrives at the account email. | |

## 10 Legal pages and analytics

| # | Step | Expected | Result |
|---|---|---|---|
| 10.1 | Open `/privacy`, `/terms` and `/cookies` | All three load and are linked from the footer of every page. | |
| 10.2 | Read the top of each legal page | It is clearly marked as pilot copy, not final legal text. | |
| 10.3 | As admin, set analytics to `first-party` | The analytics page starts showing events. | |
| 10.4 | Visit a page, run a search, post a job, apply as a provider | Page view, search, job posted and provider applied all appear. | |
| 10.5 | Check the browser cookies after browsing | No analytics cookies are set. | |

## 11 Security, responsive and handover

| # | Step | Expected | Result |
|---|---|---|---|
| 11.1 | View the response headers on any page | Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy and Permissions-Policy are all present. | |
| 11.2 | Try to embed the site in an iframe | The frame is refused. | |
| 11.3 | Submit the registration form repeatedly | It is rate limited. | |
| 11.4 | Check every page at 320px, 768px, 1024px and 1440px | No sideways scroll, no clipped buttons, no overlapping text. | |
| 11.5 | Open the site in Chrome, Safari and Firefox | Layout and forms behave the same. | |
| 11.6 | Run the test suites | `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:rls` and `npm run test:e2e` all pass. | |
