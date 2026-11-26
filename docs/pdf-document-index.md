# ROS MVP — PDF document index

Generated 26 November 2026. These PDFs are the current handover pack for the
client. Each PDF is rendered from the matching Markdown source in `docs/`.

## Current handover PDFs

| PDF | Source | Purpose |
|---|---|---|
| `project-access-and-technical-handover.pdf` | `project-access-and-technical-handover.md` | Access, environment variables, services, database, backups, outstanding work and handover checklist |
| `services-used.pdf` | `services-used.md` | Third-party services in use, ownership and cost status, and services not used |
| `requirements-audit-2026-11-26.pdf` | `requirements-audit-2026-11-26.md` | Consolidated audit of landing review, one-login flow and handover status |
| `reply-to-access-update-2026-11-26.pdf` | `reply-to-access-update-2026-11-26.md` | Draft reply confirming ownership, access and transfer requests |
| `reply-to-handover-questions-2026-11-26.pdf` | `reply-to-handover-questions-2026-11-26.md` | Full section-by-section reply to questions 3.1 to 3.8 |
| `client-review-implementation.pdf` | `client-review-implementation.md` | Landing review changes and live verification evidence |
| `handover.pdf` | `handover.md` | Operational handover guide |
| `admin-guide.pdf` | `admin-guide.md` | Admin tasks, promotion and day-to-day operations |
| `local-development.pdf` | `local-development.md` | Local Supabase stack and developer setup |
| `manual-test-script.pdf` | `manual-test-script.md` | Manual QA and release test steps |
| `client-login-details.pdf` | `client-login-details.md` | Demo account details; confidential, must be removed before launch |

## Earlier client reports

| PDF | Purpose |
|---|---|
| `acceptance-test-report-2026-11-22.pdf` | Acceptance test results |
| `client-future-development-report-2026-11-20.pdf` | Future development notes |
| `client-progress-report-2026-11-16.pdf` | Progress report |
| `client-project-completion-report-2026-11-16.pdf` | Project completion report |

## Notes

- The service-role key, Resend key and other secrets are not included in these
  documents. They remain in Vercel and must be entered securely.
- The demo account password in `client-login-details.pdf` is a published test
  password. Rotate it and remove the demo accounts before public launch.
- Regenerate a PDF after editing its Markdown source with:

```bash
~/.claude/skills/gstack/make-pdf/dist/pdf generate --cover --toc \
  --author "Oladimeji" --title "Document title" \
  docs/source.md docs/output.pdf
```
