# Draft reply — access update and handover

Subject: Re: Project access update — ROS MVP

Hi [Name],

Thank you for the access update and the project access PDF. I have recorded the
following position in the repository:

- GitHub: the company has full ownership/access through the
  `fixneardev@gmail.com` account. The repository `fixneardev-del/ros` remains
  under that organisation on `main`, with all production changes pushed and CI
  passing.
- The demo accounts you listed are sufficient for testing the admin, customer,
  approved-provider and switch flows. They are test-only accounts and must be
  removed or have their passwords changed before public launch.
- Vercel, Supabase and Resend are reported as accessible through SSO tied to the
  same account, and all environment variables are stored in Vercel.

## Important security step

The account password was shared in chat. I have not stored it, repeated it in
the repository or used it. Please rotate that password now. Going forward,
please send secrets only through a client-controlled password manager or by
entering them directly in the relevant platform.

## Access I need

To configure the deployment, database and email without handling your password,
please add the GitHub account `ejemi1989` as Admin/Owner:

1. Vercel project `ros` — Admin access.
2. Supabase project `eohqgkxnjshnzwadglnh` — Owner/Admin access.
3. Resend — Owner/Admin access.

Google Cloud/OAuth can remain in your account; I only need confirmation that it
is yours and the final domain origins once the domain is chosen.

## Domain and email

As agreed, you will buy the branded ROS domain and I will configure it. Please
send:

1. The exact domain name.
2. Registrar/DNS admin access, or the DNS records Vercel and Resend give you to
   apply yourself.
3. The agreed ROS support mailbox address and confirmation of who creates and
   monitors it. The application does not create mailboxes.
4. Confirmation of whether the Resend sending domain and API key are already in
   Vercel, or whether they still need to be added.

Once those are available I will:

- attach the domain to Vercel and update `NEXT_PUBLIC_SITE_URL`;
- update Supabase redirect URLs and Google OAuth authorised origins;
- add SPF/DKIM and set `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SUPPORT_EMAIL` and
  `ADMIN_NOTIFICATION_EMAIL`;
- test sign-in and password reset on the branded domain;
- apply `supabase/migrations/0003_active_dashboard.sql` to hosted Supabase so
  dashboard switching persists on the profile.

## Current status

The landing-page review items for copy, approval wording, colours and one
login/two dashboards are live at `https://ros-jet.vercel.app`. The remaining
launch blockers are the official ROS logo/brand green, the branded domain and
email setup, secret rotation/admin access, hosted dashboard migration, removal
of demo accounts and approved legal copy.

Full details are in:

- `docs/requirements-audit-2026-11-26.md`
- `docs/project-access-and-technical-handover.md`
- `docs/project-access-and-technical-handover.pdf`

Please let me know the domain name and send the three invites above, and I will
complete the configuration.

Best regards,
Oladimeji
