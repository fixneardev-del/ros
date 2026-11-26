# Login details for review

These are the shared demo accounts for reviewing the marketplace. They are **test accounts only**: do not use them in production, and do not give them to real customers. All of them use the same password.

## Where to sign in

Use the sign-in page at the address supplied for your environment. For a local copy of the app that is <http://localhost:3001/login>.

## Accounts

| Email | Password | Role | What it lets you check |
|---|---|---|---|
| `admin@example.com` | `password123` | Site owner (admin) | Full admin area: provider approvals, jobs, offers, categories, pilot areas, users, reports and analytics |
| `customer@example.com` | `password123` | Customer | Customer jobs, offers, account and notifications |
| `provider@example.com` | `password123` | Approved provider | Provider dashboard, matching jobs and offers; can switch to “Find help” and back |
| `pending@example.com` | `password123` | Pending provider applicant | Customer dashboard with the application status visible on `/account` |
| `callum@example.com` | `password123` | Customer | Added as a second customer |

The first three accounts are created by the setup scripts. `pending@example.com` and `callum@example.com` appear only after the relevant test flows have been run.

## Good to know

- An approved provider opens their saved dashboard after sign-in. Use the account menu, or the buttons on `/account`, to switch between “Find help” and “Provide services” without signing out.
- Running the demo setup again restores all three main accounts to `password123`, even if the password was changed earlier.
- Real user passwords are never stored in readable form. For any real account, use **Forgot password** on the sign-in page.
- The demo accounts must be removed or changed before the site goes live. The demo setup command must never be run against production.
