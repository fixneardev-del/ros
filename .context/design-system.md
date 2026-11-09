# Mend design system

Design system for **Repairs and Other Services**, a local community services marketplace piloting in Glasgow's West End and selected university communities.

Stack: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Vercel.

> **Status:** proposal. The client has not supplied a logo, brand colours or fonts. Every colour and font below is a CSS variable, so the client's brand can replace these values without touching components. Replace this file's values, not its structure.

---

## 1. Design direction

### Subject, audience, primary job

- **Subject:** people helping neighbours repair, alter, refurbish and organise things, and earning from skills and hobbies.
- **Audience:** Glasgow residents, students and makers, including hair braiders, tailors, furniture menders and decluttering helpers. Many will use a phone, many are not "tech people", and many providers are first-time sellers.
- **Primary job:** a customer finds a nearby person or posts a job in under a minute. A provider creates a trustworthy profile without help.

### Concept: visible mending

Visible mending is the practice of repairing something with bold, contrasting thread, so the repair is shown rather than hidden. It fits the business: repair is celebrated, work is shown (profiles and photos of previous work), and the platform is honest about what is finished and what is still being stitched.

Two devices carry the concept. Everything else stays quiet.

1. **The stitch line** (a running stitch) is used only to mean *not finished yet*: pending review, upcoming step, open pilot area. A solid line means settled. It is structural information, not decoration.
2. **The repair tag** is the shape of a listing (provider card, job card): a plain panel with one punched hole, like the tag on an item left at a repair shop.

### Review against the brief

Before building the system I tested my first plan against common generic defaults and changed it:

| First idea | Problem | Changed to |
|---|---|---|
| Warm cream background, kraft-paper feel, clay/terracotta accent for "craft" | Cream plus terracotta is the most common "handmade" look and says nothing about Glasgow or this client | Cool chalk-blue paper, indigo workwear denim, mustard thread. Denim and thread are the actual materials of mending |
| Stitched dividers between all sections | Decoration. Dilutes the meaning | Stitch only encodes unfinished state |
| Small uppercase labels above headings, numbered section markers | Template chrome | Sentence-case headings only. Numbers appear only in the real step sequence |
| Identical rounded cards with soft grey shadows | The SaaS-card default | Radius varies by role, no card shadows, borders carry structure, only listings are tags |

### Principles

1. **Show the work.** Real photos of real work beat illustration. Give photos room.
2. **Say what state it is in.** Every record shows its status with text and an icon, never colour alone.
3. **One primary action per screen.** Find local help, Post a job, Offer your services are the only three verbs on the homepage.
4. **Plain words.** Name things the way users do (job, offer, postcode), not how the system is built.
5. **Spend boldness once.** The hero repair tag and the stitch state line are distinctive. Everything else is disciplined.

---

## 2. Users and key flows

Proto-personas. Fictional and unvalidated, so confirm with 5 to 8 pilot interviews before locking designs.

| Persona | Situation | Needs | Design implication |
|---|---|---|---|
| **Customer: Amara, 21, student in G12** | Zip broke on her winter coat, short of time and money | Find someone nearby fast, see proof of skill, a rough price | Postcode search must work on a phone with one thumb. Photos first. Show price indications |
| **Provider: Grace, 38, braids hair from home** | Wants steady local clients without social-media chasing | Easy profile, her photos looking good, clear expectation of who contacts her | Registration under 5 minutes, photo-led profile, honest approval status |
| **Admin: Dr Fisayo, runs the pilot** | Reviews applications and jobs between other work | Fast approve/reject, spot problems, control pilot postcodes | Dense but readable queue, one-click actions with reasons |

### Flow: customer finds help

```
Home (service + postcode) -> Results (approved providers in pilot area)
  -> Provider profile -> Post a job (login if needed) -> Job posted confirmation
Errors: invalid postcode -> inline fix | outside pilot -> pilot message + email capture
        no results -> "Post a job instead"
```

### Flow: provider joins

```
Offer your services -> Create account -> Application (4 steps) -> Pending review
  -> Approved email -> Provider dashboard -> View open jobs -> Send offer
```

### Flow: admin approves

```
Provider queue (pending) -> Open application -> Check photos and categories
  -> Approve | Reject with reason | Request more information -> Email sent
```

---

## 3. Colour

All text pairs below meet WCAG 2.2 AA. Ratios were calculated, not estimated.

### 3.1 Core palette

| Token | Name | Hex | Role |
|---|---|---|---|
| `--ink` | Ink | `#14253F` | Body text, headings |
| `--denim-700` | Denim | `#1F3A5F` | Primary actions, links, brand |
| `--denim-800` | Denim pressed | `#172D4B` | Primary hover and pressed |
| `--paper` | Chalk | `#F3F6F8` | Page background |
| `--white` | White | `#FFFFFF` | Surfaces, inputs |
| `--thread-400` | Thread | `#F2B01E` | Accent fill, highlights, pending stitch |
| `--thread-100` | Thread tint | `#FDF1D3` | Warning/pending backgrounds |
| `--thread-700` | Thread text | `#7A4E00` | Text on thread tint |
| `--mend-600` | Mend | `#1B6F5A` | Success, approved, accepted |
| `--mend-100` | Mend tint | `#E1F2EC` | Success background |
| `--mend-800` | Mend text | `#14503F` | Text on mend tint |
| `--patch-600` | Patch | `#B8322A` | Errors, destructive actions |
| `--patch-100` | Patch tint | `#FBE6E4` | Error background |
| `--patch-800` | Patch text | `#8F241E` | Text on patch tint |
| `--info-100` | Info tint | `#E3ECF8` | Information background |

### 3.2 Neutrals

| Token | Hex | Use |
|---|---|---|
| `--slate-100` | `#E4EAEF` | Subtle fills, table stripes, disabled backgrounds |
| `--slate-200` | `#CBD5DD` | Decorative dividers (not for essential boundaries) |
| `--slate-400` | `#7F90A0` | Input and control borders (3.28:1 on white) |
| `--slate-500` | `#5E7081` | Secondary text on white only |
| `--slate-600` | `#475666` | Muted text on any light surface |

### 3.3 Semantic tokens (use these in components)

| Semantic | Light value |
|---|---|
| `--bg` | `--paper` |
| `--surface` | `--white` |
| `--text` | `--ink` |
| `--text-muted` | `--slate-600` |
| `--border` | `--slate-200` |
| `--border-strong` | `--slate-400` |
| `--primary` / `--primary-fg` | `--denim-700` / `--white` |
| `--accent` / `--accent-fg` | `--thread-400` / `--ink` |
| `--success` / `--success-bg` / `--success-fg` | `--mend-600` / `--mend-100` / `--mend-800` |
| `--danger` / `--danger-bg` / `--danger-fg` | `--patch-600` / `--patch-100` / `--patch-800` |
| `--warning-bg` / `--warning-fg` | `--thread-100` / `--thread-700` |
| `--info-bg` / `--info-fg` | `--info-100` / `--denim-700` |
| `--focus` | `--denim-700` |

### 3.4 Contrast reference

| Pair | Ratio |
|---|---|
| Ink on chalk | 14.16:1 |
| Ink on white | 15.37:1 |
| Slate-600 on chalk | 6.93:1 |
| Slate-500 on white | 5.11:1 |
| White on denim | 11.48:1 |
| Ink on thread | 8.06:1 |
| White on mend | 6.06:1 |
| White on patch | 5.95:1 |
| Thread text on thread tint | 6.41:1 |
| Mend text on mend tint | 8.05:1 |
| Patch text on patch tint | 7.19:1 |
| Denim on info tint | 9.64:1 |
| Slate-400 border on white | 3.28:1 (meets 3:1 for UI components) |

**Rules**

- **Never use thread (`#F2B01E`) as text, or alone as a focus ring, on a light background.** It is 1.91:1 on white. It is a fill that always carries ink text.
- Colour never carries meaning alone. Pair every status colour with an icon and a word.
- Links are denim and underlined in running text.

### 3.5 Dark theme (optional, ship after launch)

| Semantic | Dark value | Check |
|---|---|---|
| `--bg` | `#0E1A2B` | |
| `--surface` | `#16263B` | |
| `--text` | `#E8EEF4` | 14.96:1 on bg, 13.07:1 on surface |
| `--text-muted` | `#9FB0C2` | 7.88:1 on bg |
| `--border-strong` | `#6F88A6` | 4.18:1 on surface |
| `--border` | `#2B3F58` | decorative only |
| `--primary` / `--primary-fg` | `#F5BE3F` / `#0E1A2B` | 10.26:1 |
| link | `#8FB4EA` | 7.19:1 on surface |
| success text | `#5FD0AC` | 8.08:1 on surface |
| danger text | `#FF8F86` | 6.93:1 on surface |

In dark mode thread becomes the primary action colour, because denim would lose contrast.

---

## 4. Typography

| Role | Family | Why |
|---|---|---|
| Display and headings | **Archivo** (variable, width axis) | Sign-painter feel at wider widths. Reads like a workshop shop sign. Free on Google Fonts |
| Body, forms, UI | **Atkinson Hyperlegible Next** | Designed for low-vision legibility. Clear letterforms in forms and prices. Clearly different from Archivo |

Fallbacks: `Archivo, "Arial Narrow", Arial, sans-serif` and `"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, sans-serif`. Confirm the exact `next/font/google` export name for Atkinson at build and fall back to Atkinson Hyperlegible if needed.

### Scale

Base 16px. Desktop / mobile in px (size / line height).

| Style | Desktop | Mobile | Face and settings |
|---|---|---|---|
| display | 56/60 | 36/40 | Archivo 800, width 118, tracking -0.01em |
| h1 | 40/46 | 30/36 | Archivo 800, width 112 |
| h2 | 30/36 | 24/30 | Archivo 700, width 108 |
| h3 | 22/28 | 20/26 | Archivo 700, width 100 |
| h4 | 18/24 | 18/24 | Archivo 700, width 100 |
| body-lg | 18/28 | 18/28 | Atkinson 400 |
| body | 16/26 | 16/26 | Atkinson 400 |
| small | 14/20 | 14/20 | Atkinson 400 |
| caption | 13/18 | 13/18 | Atkinson 400 (floor: nothing smaller) |
| label | 16/22 | 16/22 | Atkinson 700, sentence case |
| price | 18/24 | 18/24 | Atkinson 700, tabular numerals |

**Rules**

- Line length 45 to 66 characters for body copy (`max-width: 66ch`).
- Sentence case everywhere. **No all-caps labels, no eyebrow text above headings.**
- Headings never highlight a single word in another colour or style.
- Form labels are always visible above the field. A placeholder is never the label.
- Prices use tabular numerals and the pound sign: **£45**, "from £20".

---

## 5. Layout, spacing, shape

### Spacing (4px base)

`4, 8, 12, 16, 24, 32, 48, 64, 96`. Tailwind: `1, 2, 3, 4, 6, 8, 12, 16, 24`.

### Grid and breakpoints

| Breakpoint | Width | Columns | Gutter | Margin |
|---|---|---|---|---|
| default (mobile) | 320+ | 4 | 16 | 16 |
| `md` | 768+ | 8 | 24 | 32 |
| `lg` | 1024+ | 12 | 24 | 48 |
| `xl` | 1280+ | 12 | 32 | auto (max width 1200) |

- Forms and text-heavy pages: single column, max width 640px.
- **Alignment:** left-aligned text everywhere. Centre only short empty-state and confirmation messages.
- Design mobile first. Pages must reflow at 320px width with no horizontal scroll at 200% zoom.

### Radius, varied by role

| Token | Value | Applies to |
|---|---|---|
| `--r-control` | 6px | Buttons, inputs, selects |
| `--r-surface` | 14px | Panels, tags, modals |
| `--r-pill` | 999px | Chips, status badges |
| `--r-photo` | 4px | Portfolio photos |

### Borders and elevation

- Structure comes from 1px borders, not shadows. **Cards have no shadow.**
- Only overlays (menus, modals, toasts) have shadow: `0 8px 24px rgba(20, 37, 63, 0.18)`.
- Solid line = settled. **Stitch line = unfinished** (see 5.1).

### 5.1 The stitch line

```css
/* horizontal running stitch */
.stitch-x {
  height: 2px;
  background-image: repeating-linear-gradient(
    90deg, var(--stitch-color, var(--thread-400)) 0 8px, transparent 8px 14px
  );
}
/* stitched outline for pending panels */
.stitch-box {
  border: 2px dashed var(--stitch-color, var(--thread-400));
  border-radius: var(--r-surface);
}
```

Meaning, applied consistently:

| Where | Stitched means | Solid means |
|---|---|---|
| Stepper segments | Step not done yet | Step done |
| Provider application card | Pending review | Approved |
| Job card | Open, no accepted offer | Closed |
| Pilot notice | Pilot area, still growing | n/a |

On a white surface the stitch border may use `--thread-400` only if the item also has a text status badge. The stitch is never the sole indicator.

### 5.2 The repair tag

```css
.tag {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-surface);
  padding: 16px;
}
.tag::after { /* punched hole, top right */
  content: "";
  position: absolute; top: 14px; right: 14px;
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--bg);
  border: 1px solid var(--border-strong);
}
```

Use the tag only for **provider cards and job cards**. Nothing else gets a hole.

---

## 6. Motion

- Standard: 120ms (small state change), 200ms (panel/overlay), easing `cubic-bezier(0.2, 0.7, 0.2, 1)`.
- **One orchestrated moment:** on first homepage load, the stitch line under the hero draws left to right once (about 900ms). It does not loop.
- **Motion that answers an action:** stepper stitch turns solid when a step completes; toast slides in after save; accordion opens.
- No scroll-triggered fade-ins, no hover animations on every card.
- Respect `prefers-reduced-motion: reduce`: remove the stitch draw and slides, keep instant state changes.

---

## 7. Imagery and icons

- **Photos of real work are the primary imagery.** Provider portfolio: 4:3 crop, shown at least 280px wide on mobile, with before-and-after allowed as two images.
- Provider upload guidance on the form: "Show the finished work in good light. Add a short description so everyone can tell what it shows."
- Alt text: provider supplies a short description; fallback `Photo of {category} work by {provider name}`.
- Icons: Lucide (already in the shadcn stack), 20px default, 1.75px stroke, paired with text except in common utility actions (close, menu).
- Illustration: none in the MVP. Empty states use text and the stitch line.

---

## 8. Components

States for every interactive component: default, hover, focus-visible, pressed, disabled, loading, error (where inputs).

### 8.1 Focus (global)

Two rings so it works on any background: inner 2px white, outer 2px `--focus`. In dark mode the outer ring is thread.

```css
:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
  box-shadow: 0 0 0 2px var(--surface);
}
```

### 8.2 Button

| Variant | Use | Style |
|---|---|---|
| Primary | One per screen: Find local help, Post a job, Send offer | Denim fill, white text, 6px radius |
| Accent | Hero provider call to action: Offer your services | Thread fill, ink text |
| Secondary | Cancel, Back | White fill, 1px denim border, denim text |
| Quiet | Skip, Report | Text only, underlined on hover |
| Destructive | Reject provider, Remove listing, Close job | Patch fill, white text. Always confirms with a dialog naming the item |

- Height 48px (44px minimum on mobile target), horizontal padding 20px, label 16px bold.
- Loading: spinner replaces nothing, label stays ("Sending offer"), button disabled with `aria-busy`.
- Labels say what happens. No "Submit", no arrows appended.

### 8.3 Inputs

| Component | Specs |
|---|---|
| Text input / textarea | 48px high, 1px `--border-strong`, 6px radius, label above, hint below, error below with icon |
| Select | Native `<select>` styled. Never custom on mobile |
| **Postcode field** | `autocomplete="postal-code"`, `inputmode="text"`, uppercases on blur, accepts spaced or unspaced. Hint: "For example G12 8QQ" |
| Checkbox / radio | 24px box, whole label clickable |
| File upload | Drop area plus button "Add photos". Shows thumbnails, file size limit and type in the hint, per-file remove button |
| Date | "Preferred timeframe" select (Today, This week, Next 2 weeks, Flexible) preferred over a calendar picker |

Error pattern: icon, plain sentence saying what to fix, linked in a summary at the top of the form.

### 8.4 Hero search (repair ticket)

A repair-tag panel containing: label "What do you need help with?", service select (placeholder "Choose a service"), postcode input (placeholder "Enter your postcode"), primary button "Find local help", and a quiet link "Post a job instead".

### 8.5 Provider card (tag)

```
+-----------------------------------------------+
| [photo 4:3, cover]                      (o)   |
| Grace Adeyemi                                 |
| Hair braiding                                 |
| G12, G11, G3                                  |
| from £40                          View profile|
+-----------------------------------------------+
```

- Contents: photo, name, up to 2 service chips, service areas, indicative price (if set), link.
- One interactive target: the whole card links to the profile (single link, not nested).
- Pending card (provider dashboard only): stitched border plus badge "Waiting for review".

### 8.6 Job card (tag)

Title, category chip, postcode district only (for example "G12"), timeframe, offer count, status badge. For providers: button "Send offer". For customers: link "View offers (3)".

### 8.7 Offer card

Provider name and photo, message, indicative price ("£45" or "Quote on inspection"), timeframe, buttons "Accept offer" (primary) and "Decline" (quiet). Contact details appear only after acceptance, with the note "You can now contact each other directly."

### 8.8 Status badges

Pill shape, icon plus word, tinted background with dark text.

| Record | Status | Tint | Icon |
|---|---|---|---|
| Provider | Waiting for review | thread | clock |
| Provider | Approved | mend | check |
| Provider | Not approved | patch | x |
| Provider | Suspended | slate | pause |
| Job | Open | info | circle-dot |
| Job | Receiving offers | info | message-square |
| Job | Closed | slate | check-circle |
| Job | Removed | patch | trash |
| Offer | Sent | info | send |
| Offer | Accepted | mend | check |
| Offer | Declined | slate | x |
| Offer | Withdrawn | slate | undo |

### 8.9 Service chip

Pill, 32px high, selectable in filters (checked state: denim fill, white text, check icon), static on cards (slate-100 fill, ink text).

### 8.10 Stepper (provider application)

Four steps: About you, Services, Photos, Review. Mobile shows "Step 2 of 4: Services" with a stitch bar. Completed segments are solid denim, upcoming are stitched thread. Current step is also named, so colour is not the only cue. Container has `aria-live="polite"` for step changes.

### 8.11 Notices and alerts

| Type | Style | Example use |
|---|---|---|
| Pilot notice | Stitched border, info tint | Homepage and out-of-area results |
| Info | Info tint, icon | Provider checks explanation |
| Success | Mend tint, check icon | Application received |
| Warning | Thread tint, thread text | Photo too large |
| Error | Patch tint, alert icon | Form failed |

Provider notice on every public profile: "Providers are independent. We do not guarantee qualifications, insurance or checks unless a profile says so." Wording to be approved by the client's legal advisor.

### 8.12 Toast

Bottom-left on desktop, bottom on mobile. Matches the action verb ("Job posted", "Offer sent", "Provider approved"). Stays 6 seconds, pause on hover and focus. `role="status"`. Errors do not use toasts: they stay inline.

### 8.13 Dialog

Used for destructive confirmation and rejection reasons. Title states the action ("Reject Grace Adeyemi's application?"), body states the consequence, two buttons (destructive plus "Cancel"). Focus trapped, Escape closes, focus returns to the trigger.

### 8.14 Navigation

- **Header:** logo left, links Find help, Post a job, Offer your services, account menu right. Mobile: menu button opens a full-screen list. "Post a job" stays visible outside the menu on mobile.
- **Provider dashboard:** tabs Profile, Open jobs, My offers.
- **Customer dashboard:** tabs My jobs, Account.
- **Admin:** left sidebar (Overview, Providers, Jobs, Offers, Categories, Pilot area, Users, Reports), collapses to a top select on mobile.
- Skip link "Skip to main content" is the first focusable element.

### 8.15 Admin table

Dense rows (48px), sortable headers with `aria-sort`, status badges, row actions in a menu, filters above (status, category). Under 768px, rows turn into stacked cards. Bulk actions are out of scope for MVP.

### 8.16 Empty and loading states

- Skeletons for lists (no spinners longer than 400ms without context).
- Each empty state says what is missing and the next action (see section 10).

---

## 9. Page patterns

### Home

```
+--------------------------------------------------------------+
| Logo     Find help   Post a job   Offer your services   Log in|
+--------------------------------------------------------------+
| Turn your hobbies and skills into      +--------------------+ |
| extra income by helping people in      | What do you need   | |
| your local community.             (o)  | help with?         | |
|                                        | [Choose a service v]| |
| Whether it's a hobby, talent, trade    | [Enter postcode   ] | |
| or skill, connect with people nearby   | [ Find local help ] | |
| who need what you have to offer.       | Post a job instead  | |
| - - - - - - - - - - - - - - - - -      +--------------------+ |
+--------------------------------------------------------------+
| Real work photos strip (4 photos, provider-supplied)          |
+--------------------------------------------------------------+
| Have a useful skill?  [Offer your services]                   |
| - - Pilot notice (stitched): We're starting in Glasgow's ... -|
+--------------------------------------------------------------+
```

The photo strip uses real provider photos once available. Before launch use client-supplied photos. Never use stock photos of "happy people".

### Search results

```
Furniture repair near G12   (12 providers)    [Filters: service, area]
+-------------+ +-------------+ +-------------+
| tag         | | tag         | | tag         |
+-------------+ +-------------+ +-------------+
(not what you need?)  Post a job and let providers come to you.
```

`aria-live="polite"` announces the result count.

### Provider profile

Photo gallery first, then name, services, areas, bio, price indication, notice about independence, primary button "Post a job", quiet link "Report this profile".

### Post a job

Single column, 5 fields in this order: Service, What do you need? (title), Describe the job, Postcode, When do you need it, Photos (optional). Primary button "Post job". Login/register interrupts at submission only and returns the person to the form with data kept.

### Admin provider queue

Table of pending applications plus a detail drawer with photos, categories, extra-checks flag, and actions "Approve", "Not approved" (with reason), "Ask for more information".

---

## 10. Content and voice

**Voice:** plain, practical, neighbourly, Scottish-English spelling (colour, organise). Active voice. No jargon, no hype, no emoji in UI.

### Vocabulary (use one word per concept, everywhere)

| Concept | Use | Do not use |
|---|---|---|
| Customer's request | Job | Request, gig, task, listing |
| Provider's reply | Offer | Bid, proposal, quote (except "Quote on inspection") |
| Person offering skills | Provider (public label: "Provider") | Seller, vendor, freelancer |
| Area | Postcode | Zip, location |
| Review step | Waiting for review | Pending |
| Pilot | Pilot area | Beta, launch zone |

### Action names (button, toast and email stay consistent)

| Button | Toast | Email subject |
|---|---|---|
| Post job | Job posted | Your job is posted |
| Send offer | Offer sent | You have a new offer |
| Accept offer | Offer accepted | Your offer was accepted |
| Approve | Provider approved | You're approved on {product} |
| Save profile | Profile saved | n/a |

### Copy bank

| Situation | Copy |
|---|---|
| Invalid postcode | "Enter a Glasgow postcode like G12 8QQ." |
| Outside pilot | "We're not in {district} yet. We're starting in Glasgow's West End and selected university communities. Leave your email and we'll tell you when we reach you." |
| No results | "No providers match yet. Post a job and local providers can send you offers." |
| Photo too large | "That photo is over 5 MB. Choose a smaller photo or resize it." |
| Wrong file type | "Add a JPG, PNG or WebP photo." |
| Required field | "Enter a short description of the job." |
| Session expired | "You've been signed out. Sign in again to continue. Your job is saved." |
| Server error | "We couldn't save that. Check your connection and try again." |
| Application sent | "Application sent. We review new providers within [X] working days." (client to confirm timeframe) |
| Offer accepted | "You can now contact each other directly." |
| Empty offers | "No offers yet. Providers near you can see this job." |

Errors state what went wrong and how to fix it. They do not apologise and they never say only "Something went wrong".

---

## 11. Accessibility checklist (WCAG 2.2 AA)

- [ ] Contrast: text 4.5:1, large text 3:1, UI boundaries and icons 3:1 (use token pairs in section 3)
- [ ] Visible focus on every interactive element, never removed
- [ ] Touch targets at least 44 by 44px (24px minimum under WCAG, 44px is our rule)
- [ ] All forms have visible labels, `autocomplete` attributes (`name`, `email`, `postal-code`), and error summaries linked to fields
- [ ] Status is never colour only (icon plus word)
- [ ] Page reflows at 320px, usable at 200% zoom, text resizes to 200%
- [ ] Keyboard: logical order, skip link, dialogs trap focus and restore it, no keyboard traps
- [ ] Screen reader: landmarks (header, nav, main, footer), one `h1` per page, `aria-live` for search results, stepper and toasts
- [ ] Images have alt text; decorative images have empty alt
- [ ] Reduced motion honoured; no flashing content
- [ ] File upload usable without drag and drop
- [ ] Language set (`lang="en-GB"`)

---

## 12. Implementation

### 12.1 CSS variables

```css
:root {
  --ink: #14253F;
  --denim-700: #1F3A5F;
  --denim-800: #172D4B;
  --paper: #F3F6F8;
  --white: #FFFFFF;
  --thread-400: #F2B01E; --thread-100: #FDF1D3; --thread-700: #7A4E00;
  --mend-600: #1B6F5A;   --mend-100: #E1F2EC;   --mend-800: #14503F;
  --patch-600: #B8322A;  --patch-100: #FBE6E4;  --patch-800: #8F241E;
  --info-100: #E3ECF8;
  --slate-100: #E4EAEF; --slate-200: #CBD5DD; --slate-400: #7F90A0;
  --slate-500: #5E7081; --slate-600: #475666;

  --bg: var(--paper);  --surface: var(--white);
  --text: var(--ink);  --text-muted: var(--slate-600);
  --border: var(--slate-200); --border-strong: var(--slate-400);
  --primary: var(--denim-700); --primary-hover: var(--denim-800); --primary-fg: var(--white);
  --accent: var(--thread-400); --accent-fg: var(--ink);
  --focus: var(--denim-700);

  --r-control: 6px; --r-surface: 14px; --r-pill: 999px; --r-photo: 4px;
  --shadow-overlay: 0 8px 24px rgba(20, 37, 63, 0.18);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0E1A2B; --surface: #16263B;
    --text: #E8EEF4; --text-muted: #9FB0C2;
    --border: #2B3F58; --border-strong: #6F88A6;
    --primary: #F5BE3F; --primary-hover: #E0A821; --primary-fg: #0E1A2B;
    --focus: #F5BE3F;
  }
}
```

### 12.2 Fonts (Next.js)

```ts
import { Archivo, Atkinson_Hyperlegible_Next } from "next/font/google";

export const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display" });
export const text = Atkinson_Hyperlegible_Next({ subsets: ["latin"], variable: "--font-text" });
```

### 12.3 Tailwind theme extension

```ts
// tailwind.config.ts (v3). In v4, move the same values into @theme.
export default {
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", surface: "var(--surface)", text: "var(--text)",
        muted: "var(--text-muted)", border: "var(--border)",
        primary: { DEFAULT: "var(--primary)", fg: "var(--primary-fg)", hover: "var(--primary-hover)" },
        accent: { DEFAULT: "var(--accent)", fg: "var(--accent-fg)" },
      },
      borderRadius: { control: "6px", surface: "14px", photo: "4px" },
      fontFamily: {
        display: ["var(--font-display)", "Arial Narrow", "Arial", "sans-serif"],
        sans: ["var(--font-text)", "system-ui", "sans-serif"],
      },
    },
  },
};
```

### 12.4 shadcn/ui mapping

| shadcn variable | Mend token |
|---|---|
| `--background` | `--bg` |
| `--foreground` | `--text` |
| `--card` | `--surface` |
| `--primary` / `--primary-foreground` | `--primary` / `--primary-fg` |
| `--secondary` | `--slate-100` |
| `--muted-foreground` | `--text-muted` |
| `--accent` / `--accent-foreground` | `--accent` / `--accent-fg` |
| `--destructive` | `--patch-600` |
| `--border`, `--input` | `--border-strong` for inputs, `--border` for dividers |
| `--ring` | `--focus` |
| `--radius` | `6px` |

Override shadcn's default Card so it uses the border, no shadow, and the `Tag` variant for listings.

### 12.5 Suggested component structure

```
components/
  ui/            shadcn primitives (button, input, select, dialog, toast)
  mend/          Tag, ProviderCard, JobCard, OfferCard, StatusBadge,
                 Stepper, PostcodeField, PhotoUpload, PilotNotice, StitchLine
app/
  (public)/      home, search, providers/[id], legal
  (customer)/    jobs, post-job
  (provider)/    apply, dashboard, open-jobs, offers
  (admin)/       providers, jobs, offers, categories, pilot-area, reports
```

---

## 13. Do and do not

| Do | Do not |
|---|---|
| Lead with real photos of work | Use stock photos or illustrations of smiling people |
| Show status as icon plus word | Rely on colour alone |
| Use stitch only for unfinished state | Add stitch dividers for decoration |
| Give listings the tag, everything else flat | Add holes, shadows or rounded cards everywhere |
| Keep one primary button per screen | Put "Find local help", "Post a job" and "Offer your services" at equal weight |
| Write "Post job", "Send offer" | Write "Submit", "Go", or add arrows to buttons |
| Keep text sentence case | Use all-caps labels or eyebrow text |
| State what happened and how to fix it in errors | Use "Something went wrong" |
| Hide full addresses and phone numbers until an offer is accepted | Show contact details on public jobs |

---

## 14. Open decisions for the client

1. Logo, brand colours and any existing fonts. This system's tokens are replaceable defaults.
2. Final service category list, and which categories need extra checks.
3. Whether any "checked" badge exists, and the legal meaning of it. Without client approval, the platform claims no verification.
4. Approved wording for the provider independence notice, privacy notice and terms.
5. Review turnaround time to show providers after they apply.
6. Whether a dark theme is wanted at launch (recommended after).
