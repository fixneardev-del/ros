# Decisions

Architecture decisions that should not be re-litigated without a reason. Product scope is in `SPEC.md`; delivery order is in `tasks/plan.md`.

## Product and scope

- **Pilot area is a set of enabled postcode districts.** No distance search, maps or geolocation.
- **Contact details are private until an offer is accepted.** The release happens in a Postgres RPC so it cannot be bypassed by the client.
- **No payments or commission.** Customers and providers agree payment directly.
- **Google is the only social provider.** Added at the client's request on 2026-11-16. Supabase owns the Google client secret; the app only holds the public Supabase key and the `/auth/callback` redirect URL.
- **Providers are independent.** The platform does not guarantee qualifications, insurance or checks unless a profile says so.
- **Money is integer pence.** A null price means "Quote on inspection".
- **Closed and removed jobs are terminal.** So are accepted, declined and withdrawn offers.
- **Provider applications need 1–6 photos.** The wizard and the server both enforce it; the cap is `MAX_PROVIDER_PHOTOS`.
- **Key provider changes go back to review.** With `reapprove_on_key_change` on (the seeded default), changing the display name or provider type returns an approved profile to `pending` until an admin approves it again.

## Architecture

- **Next.js App Router with Server Components for reads.** No client data-fetching library and no global client store.
- **Writes only in Server Actions.** Actions validate with Zod, enforce authorisation, then write.
- **Authorisation is enforced twice.** In the action and in RLS. Neither is treated as optional.
- **Actions return `ActionResult`.** Forms use `useActionState` where typed feedback is needed; simple admin forms redirect with `?ok=` or `?error=`.
- **Notifications use an outbox.** Rows are written first, email is sent in the background with `after`. A failed email never fails the user action.
- **Accepting an offer is one transaction.** `accept_offer` is a Postgres RPC that accepts one offer and declines the others.
- **Session refresh happens in `proxy.ts`.** Next 16 uses `proxy.ts`, not `middleware.ts`.
- **The session is read once per request.** `getSessionContext` is wrapped in React's `cache`, so the layout and the page share one round trip.
- **Search lives in the URL.** Every search box is a plain GET form, so a result set can be linked to, refreshed and shared, and the page stays a Server Component with no client state. The query is cleaned in `lib/search.ts` before it is compared or echoed. Matching happens on the server where the rows are already read; the lists do not paginate, and a list that starts to will move its filter into the database query.

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
- **The first admin is promoted server-side.** The owner is the account whose email is `ADMIN_NOTIFICATION_EMAIL`. The profile trigger creates customer profiles, so promotion must bypass the trigger or use the service role.
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
- **The landing design system is scoped, and it now covers the public, auth and job pages.** The client supplied `.context/frontend/landing.md`, first for the landing page and then for every public, auth and job page. The shared stylesheet lives in `app/design-system.css`; a `.studio` wrapper in `app/studio.css` remaps the Tailwind theme variables (colour, font, radii) and adds the shape language. `app/globals.css` uses `@theme` rather than `@theme inline` so utilities emit `var(--color-*)` and the remap works. The provider dashboard sits outside `.studio` and keeps the mending tokens exactly.
- **The customer, provider and admin dashboards use the Movexa dashboard design system.** `.context/backend/dashboard.md` specifies a warm grey-beige canvas, translucent cards, orange accents and a compact, data-dense type scale. `app/dash.css` implements it as a `.dash` scope that remaps the same Tailwind theme variables, and `components/shells/dash-shell.tsx` renders the floating shell, wordmark header and footer. All three signed-in groups use it, with a per-variant header nav. URLs and behaviour are unchanged.
- **The dashboard theme overrides shared utility classes inside its own scope.** `.dash` remaps `--color-*`, `--font-*` and `--radius-*`, and the unlayered rules in `app/dash.css` override the Tailwind utilities emitted from `app/globals.css`. Heading rules are written at element specificity and the text-size overrides use `:where()`, so an `h2` with `text-xl` still renders at the 14px section-heading size rather than the 16px utility size.
- **The dashboard uses no chart library and no fake global search.** The analytics event mix is a CSS bar chart over the real recorded totals. The marketplace search needs both a service and a postcode, so a single free-text header field would not work; the customer header links to the real search page instead. No dependency was added.
- **The dashboard has no darker page backdrop.** The Movexa source put a `#D8D8D8` backdrop behind the floating shell. It was removed on request, so the canvas is the warm grey-beige throughout and `.context/backend/dashboard.md` no longer lists a backdrop colour. The shell keeps its rounded top corners, translucent white border and soft shadow.
- **Session reads are request-time by design.** `getSessionContext()` calls `await connection()`, because the Supabase auth client compares the session expiry against the current time and a value that changes between renders cannot be baked into a static shell.
- **Route groups own their chrome.** `(studio)` and `(auth)` render `components/shells/studio-shell.tsx` with the landing header and footer; `(customer)`, `(provider)` and `(admin)` render `components/shells/dash-shell.tsx`. URLs are unchanged. `jobs/[id]` sits in `(customer)` and `provide/apply` in `(provider)`.
- **Shared components gain inert hooks, never studio-only or dashboard-only classes.** `Button`/`ButtonLink` carry `btn` and `data-variant`; `StatusBadge` carries `badge`; `OfferCard` and `ReportForm` carry `s-panel`. Outside `.studio` and `.dash` these do nothing, so the provider dashboard is untouched.
- **The landing page shows the real search form, not a mockup.** The supplied design system includes device mockups, but a mockup full of invented dashboard widgets would misrepresent the product. The hero frames the actual service and postcode form instead.
- **The landing page has no testimonials or FAQ.** There is no approved testimonial or FAQ copy, and inventing either would be dishonest.
- **Service tiles pick their text colour per background.** White fails WCAG AA on the brown, green, orange and red tiles, so those use ink. Blue, teal and purple keep white.
- **The landing page's hair braiding tile uses a deeper red.** On the brand red `#e91e4d`, ink reaches 4.28:1 and white 4.41:1, so neither clears the 4.5:1 that small text needs. The tile uses `#e2184a` with white, which reaches 4.71:1. The brand red token is unchanged, because it is still used for accents that do not carry text.
- **Scroll reveal is CSS only.** It uses `animation-timeline: view()` inside `@supports`, so there is no script mutating a React-rendered attribute and no hydration mismatch. It is disabled for reduced motion and in print.
- **The landing page after sign in depends on the role, not on the page that asked for it.** A visitor who follows "Offer your services" while signed out is sent to sign in with `next=/provide`, and an admin signing in with that URL used to land on the provider dashboard. `landingPath` in `lib/next-path.ts` now sends an admin to `/admin`, a provider to `/provide` and a customer to `/account`, and never sends an admin to a provider-only path. The role is read with the server key, because the request-scoped client cannot see the session cookie it has just written. A requested path is still honoured when it suits the role.

## Dependencies cut from the approved spec

Three packages named in the approved spec are not installed. None of them is imported anywhere in the code, so each was dead weight and, in one case, carried advisories.

- **React Hook Form and `@hookform/resolvers` removed.** Forms use React 19's `useActionState` with a Server Action, which is the native path for server-driven forms and removes a second source of form state. The typed `ActionResult` shape already carries field-level errors, so a resolver library added nothing.
- **`@react-email/components` removed.** Email templates are built as HTML and text strings in `lib/emails/templates.ts`. The package was unused and pulled in four low-severity advisories through `html-to-text` and `deepmerge`. Templates live in one file, so switching to react-email later is a single-file change.
- **shadcn was not installed.** The core primitives are small, project-owned components in `components/ui/` styled with the design tokens. The generator would have added a second theme layer and a `components.json` contract for no gain on this surface area.
- **`npm audit --omit=dev` is clean.**

## Known gaps

- The project is its own git repository, but no remote has been added yet, so CI has not run.
- The hosted Supabase project has no schema applied, so the hosted dashboards and the live email send are unproven. The same flows have been run end to end against the local stack.
- Legal pages are clearly marked pilot copy. The client supplies approved legal text.
- Playwright 1.65 cannot run Firefox or WebKit on macOS 13 ARM. CI runs all three browsers; local runs use Chromium.
- The local Supabase stack and the RLS scratch database live under `~/.local/share/repairs-and-other-services/`. macOS purges the temporary folder in the background, which destroyed a running cluster once already.
