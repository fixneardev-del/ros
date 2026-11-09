# Decisions

Architecture decisions that should not be re-litigated without a reason. Product scope is in `SPEC.md`; delivery order is in `tasks/plan.md`.

## Product and scope

- **Pilot area is a set of enabled postcode districts.** No distance search, maps or geolocation.
- **Contact details are private until an offer is accepted.** The release happens in a Postgres RPC so it cannot be bypassed by the client.
- **No payments or commission.** Customers and providers agree payment directly.
- **Providers are independent.** The platform does not guarantee qualifications, insurance or checks unless a profile says so.
- **Money is integer pence.** A null price means "Quote on inspection".
- **Closed and removed jobs are terminal.** So are accepted, declined and withdrawn offers.

## Architecture

- **Next.js App Router with Server Components for reads.** No client data-fetching library and no global client store.
- **Writes only in Server Actions.** Actions validate with Zod, enforce authorisation, then write.
- **Authorisation is enforced twice.** In the action and in RLS. Neither is treated as optional.
- **Actions return `ActionResult`.** Forms use `useActionState` where typed feedback is needed; simple admin forms redirect with `?ok=` or `?error=`.
- **Notifications use an outbox.** Rows are written first, email is sent in the background with `after`. A failed email never fails the user action.
- **Accepting an offer is one transaction.** `accept_offer` is a Postgres RPC that accepts one offer and declines the others.
- **Session refresh happens in `proxy.ts`.** Next 16 uses `proxy.ts`, not `middleware.ts`.
- **The session is read once per request.** `getSessionContext` is wrapped in React's `cache`, so the layout and the page share one round trip.

## Admin access

- **A signed-in non-admin gets a real 403.** Next's `forbidden()` is used with `experimental.authInterrupts`. The check sits in the admin **layout**, not in each page, because a check inside a `Suspense` boundary runs after the shell has streamed and the response would be a 200.
- **The proxy makes the status code right.** A check in a layout or a page runs during render, which is after the response has been committed on a streamed page. `proxy.ts` runs before anything renders, so it resolves the role first and rewrites admin routes to `/admin-denied` for anyone who is not an admin. That page calls `forbidden()` before anything renders, which returns a 403.
- **The in-app checks stay.** The proxy is the front door, not the only defence. The admin layout and every admin action still check the role, so a change to the matcher cannot open the admin area.
- **An anonymous visitor is sent to sign in first.** A 403 for someone who has not signed in yet is not useful. The proxy handles this too, so the redirect is a 307 rather than a client side redirect after the page has streamed.
- **Every decision records who and when.** Provider review, provider suspension, provider removal, job removal, offer withdrawal and user suspension all write an actor and a timestamp to the row, not only to the audit log.

## Analytics

- **Analytics are first party and cookie free.** The client had not chosen a hosted tool, so the build records page views, searches, jobs posted and provider applications in our own table. No IP address, no user id, no cookies, no third party script.
- **Analytics are off until switched on.** The `analytics_provider` site setting is set to `first-party` by an admin. The browser asks once per session whether analytics are on, so a site with them disabled sends nothing.
- **No cookie consent banner.** It is only needed if the tool sets cookies. Supabase's session cookie is strictly necessary, and our own analytics set none. If the client later picks a tool that needs consent, the banner is the piece to add.

## Data and security

- **RLS is the second line of defence.** Server actions use the user client; system tasks use the service-role client and return `null` when the key is absent.
- **Status transitions are enforced in SQL triggers.** A provider cannot approve themselves; a customer cannot change moderation fields or `accepted_offer_id` directly.
- **Providers may delete their own pending profile.** This supports cleanup when an application fails part-way. Cascades remove services and photos.
- **Storage buckets are public for provider photos and private for job photos.** Storage policies mirror the table policies.
- **The first admin is promoted server-side.** The profile trigger creates customer profiles, so promotion must bypass the trigger or use the service role.
- **The migration states its own grants.** Supabase grants table access by project default, but the migration grants explicitly so it behaves the same on a clean project. The three RPCs are revoked from `public` and `anon` and granted only to `authenticated`.
- **The accept bypass is scoped to one call.** `accept_offer` sets a trigger bypass so it can update offers and the job in one transaction, then clears it. Without the reset, a customer could repoint `accepted_offer_id` later in the same transaction.

## Testing

- **The RLS suite is SQL, not TypeScript.** The plan called for helper functions that build anon, customer, provider and admin clients. The suite instead runs as SQL against a real Postgres, switching role and the JWT subject claim to simulate each signed-in user. Testing where the rules are enforced is tighter, needs no extra dependency, and cannot silently skip.
- **The RLS runner fails when the database is unreachable.** A skipped RLS suite would look like a passing one, so the runner exits non-zero instead.
- **The RLS suite runs in one transaction and rolls back.** The database is left untouched after a pass or a failure.

## Design

- **Design tokens are CSS variables.** This lets the proposal palette ship without hard-coding it into components.
- **Fonts are Archivo (display) and Atkinson Hyperlegible Next (body).** Loaded with `next/font/google`.
- **shadcn/ui is not installed.** Lightweight Tailwind primitives are hand-rolled to avoid unapproved dependencies. Revisit if the client approves the dependency.
- **`cacheComponents` and `partialPrefetching` stay enabled.** Dynamic reads sit inside `<Suspense>` boundaries.
- **The landing design system is scoped, and it now covers the public, auth and job pages.** The client supplied `.context/frontend/landing.md`, first for the landing page and then for every public, auth and job page. The shared stylesheet lives in `app/design-system.css`; a `.studio` wrapper in `app/studio.css` remaps the Tailwind theme variables (colour, font, radii) and adds the shape language. `app/globals.css` uses `@theme` rather than `@theme inline` so utilities emit `var(--color-*)` and the remap works. The signed-in dashboards sit outside `.studio` and keep the mending tokens exactly.
- **Route groups own their chrome.** `(public)`, `(auth)` and `(studio)` render `components/shells/studio-shell.tsx` with the landing header and footer; `(customer)`, `(provider)` and `(admin)` render `components/shells/app-shell.tsx` with the original site header and footer. URLs are unchanged. `post-job`, `jobs/[id]` and `provide/apply` moved into `app/(site)/(studio)/`.
- **Shared components gain inert hooks, never studio-only classes.** `Button`/`ButtonLink` carry `btn` and `data-variant`; `StatusBadge` carries `badge`; `OfferCard` and `ReportForm` carry `s-panel`. Outside `.studio` these do nothing, so the dashboards are untouched.
- **The landing page shows the real search form, not a mockup.** The supplied design system includes device mockups, but a mockup full of invented dashboard widgets would misrepresent the product. The hero frames the actual service and postcode form instead.
- **The landing page has no testimonials or FAQ.** There is no approved testimonial or FAQ copy, and inventing either would be dishonest.
- **Service tiles pick their text colour per background.** White fails WCAG AA on the brown, green, orange and red tiles, so those use ink. Blue, teal and purple keep white.
- **Scroll reveal is CSS only.** It uses `animation-timeline: view()` inside `@supports`, so there is no script mutating a React-rendered attribute and no hydration mismatch. It is disabled for reduced motion and in print.

## Dependencies cut from the approved spec

Three packages named in the approved spec are not installed. None of them is imported anywhere in the code, so each was dead weight and, in one case, carried advisories.

- **React Hook Form and `@hookform/resolvers` removed.** Forms use React 19's `useActionState` with a Server Action, which is the native path for server-driven forms and removes a second source of form state. The typed `ActionResult` shape already carries field-level errors, so a resolver library added nothing.
- **`@react-email/components` removed.** Email templates are built as HTML and text strings in `lib/emails/templates.ts`. The package was unused and pulled in four low-severity advisories through `html-to-text` and `deepmerge`. Templates live in one file, so switching to react-email later is a single-file change.
- **`npm audit --omit=dev` is clean.**

## Known gaps

- The project is not its own git repository yet. It sits inside `/Users/oladimeji`.
- Supabase credentials are absent, so auth, storage, email and signed-in marketplace flows have not run end to end. The schema and RLS rules are verified against a real Postgres, and the public browser suite passes.
- Legal pages are clearly marked pilot copy. The client supplies approved legal text.
- Analytics tool choice and consent requirements are unresolved.
- The public, auth and job pages use the landing visual system; the signed-in dashboards use the mending system. Opening a job from `/jobs` switches chrome. That is the intended edge of the scope.
