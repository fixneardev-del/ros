# ROS MVP - Services used

Generated 26 November 2026. Source: `docs/project-access-and-technical-handover.md`, section 3.4.

## Third-party services in use

| Service | Used for | Owner / control | Cost status |
|---|---|---|---|
| GitHub | Source code, issues, CI | `fixneardev-del/ros`; client confirmed via `fixneardev@gmail.com` | Likely free for public repo, confirm billing |
| Vercel | Hosting, builds, preview/production deploys, cron, logs | Project `ros`, `fixneardev-del` scope | Confirm via Vercel billing |
| Supabase | Postgres database, Auth, Storage, RLS, Google OAuth config | Project ref `eohqgkxnjshnzwadglnh` | Confirm via Supabase billing |
| Resend | Transactional email through the outbox table | Not configured in repo; client reports SSO access | Confirm via Resend billing |
| Google Cloud / Google OAuth | Google sign-in | Not visible in repo | Usually low or free, confirm |
| Domain registrar / DNS | Branded ROS domain and email DNS | None attached yet | Client to confirm |
| Email mailboxes | ROS support and admin notification inboxes | Not created by the app | Client's provider |
| GitHub Actions | CI checks: secret scan, lint, types, tests, build | Part of GitHub | Included with GitHub plan |
| Supabase Storage | Provider photos and job photos | Part of Supabase project | Included in Supabase plan |
| Vercel Cron | Daily `/api/notifications/retry` at 06:00 UTC | Part of Vercel project | Included with Vercel |

## Not used

- Payment providers
- AI services
- External analytics tools
- External monitoring or logging tools
- Supabase Edge Functions
- Inbound webhooks
- Persistent queue workers

## Notes

- Analytics are first-party, cookie-free events stored in Supabase `analytics_events`.
- Monitoring is Vercel build and runtime logs only.
- No API keys or secret values are included in this document. Secrets remain in Vercel and must be entered securely.
- Domain, DNS, Resend sending domain, support mailbox and Google OAuth final-domain settings are still pending configuration.
