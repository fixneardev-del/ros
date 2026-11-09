imespent --- Design System
Extracted from the supplied HTML/CSS. This document captures the
visual system and reusable interface patterns only. Product copy,
application logic, JavaScript behaviour, and data content are
intentionally excluded.

1. Visual direction
Design character: playful, editorial, confident, friendly, and
product-led.
- Warm off-white canvas with near-black typography.
- Teal as the primary brand accent, supported by bright yellow and
  warm brown.
- Strong, compact headlines with tight tracking.
- Rounded geometry, pill-shaped actions, outlined surfaces, and
  deliberate hard-offset shadows.
- Product UI previews are treated as visual storytelling: framed
  device mockups, miniature interface cards, charts, and widgets.
- A restrained neutral foundation lets saturated feature colours
  create variety.
2. Design tokens
Colour
  Token        Value       Intended use
  --bg       #FCFCF8   Main page background
--ink      #111111   Primary text, outlines, dark surfaces
--mut      #666666   Secondary text
--teal     #0F766E   Primary accent, button shadow, labels
--line     #E7E7E0   Dividers and subtle borders
--yellow   #FACC15   Highlight, attention badge, chart accent
--brown    #BC7F4A   Testimonial surface / warm accent
Feature palette
  Token / class   Value
  c-blue        #1E2A9C
c-orange      #E94E1B
c-green       #2FAE6B
c-red         #E91E4D
c-teal        #0F766E
c-brown       #B07A3F
c-purple      #5B21B6
c-white       #FFFFFF with #111111 outline

Usage guidance - Use #FCFCF8 as the default page canvas rather
than pure white. - Use #111111 for high-contrast text and structural
outlines. - Reserve teal for key accents and interactive emphasis. -
Yellow is a highlight colour, not a general-purpose background. -
Feature colours are assigned to distinct categories/cards; avoid using
the entire palette in one component. - Keep body copy muted but readable
against the warm background.
Typography
Primary family: Inter
Display / editorial family: Instrument Serif (loaded in the source;
no prominent application is visible in the supplied styles)
Fallback: system-ui, sans-serif
  Role                                Source styling
  Hero heading                        52px, weight 900, line-height 0.95,
letter-spacing -0.05em

  Section heading                     36px, weight 900, line-height 1,
letter-spacing -0.045em

  Body / lead                         14px, line-height 1.6

  Hero supporting copy                15px, line-height 1.55

  Navigation                          13px, weight 600

  Button                              13px, weight 700

  Card title                          14px, weight 700--800, line-height
1.1

  Eyebrow / kicker                    11px, weight 800, uppercase,
letter-spacing 0.14em
Microcopy                           8--11px depending on context
Typography principles - Use heavy weights for display headings and
short card titles. - Tighten tracking on large headings for a compact
editorial feel. - Use uppercase, widely tracked kickers to establish
section hierarchy. - Keep supporting copy short, with generous
line-height. - Use small text for metadata, labels, and compact widget
details only.
3. Layout system
Global container
- Maximum content width: 1180px.
- Horizontal page padding: 24px.
- Centre the container with automatic side margins.
- Main sections use approximately 56px top padding and 10px bottom
  padding.
- Footer begins with approximately 70px separation from the
  preceding content.
Grid patterns
  Pattern                 Desktop                     Responsive behaviour
  Hero                    Two columns,                One column below 900px
1.05fr / 0.95fr, 20px
gap                         

  Feature cards           Eight equal columns, 10px Four columns below
gap                         900px; two below 560px

  Reviews                 Two equal columns, 30px   One column below 900px
gap                         
Footer                  Four columns,               Two columns below 900px
1.4fr / 1fr / 1fr / 1fr
Spacing character
The interface uses compact controls and card internals, balanced by
large section spacing.
- Common compact gaps: 5–10px.
- Navigation links: 18px gap.
- Hero actions: 10px gap.
- Card grid: 10px gap.
- Major two-column content: 20–30px gap.
- Section rhythm: 56px top padding.
4. Shape, borders, and elevation
Radius language
  Element                               Radius
  Circular logo mark / round controls   50%
Pill buttons and badges               999px
Small timer / compact panel           10px
Goal card                             16px
Feature card                          18px
Review card                           22px
Device frame                          42px
Borders
- Primary structural outline: 2px solid #111111.
- Secondary outline: 1.5px solid #111111.
- Subtle divider: 1px solid #E7E7E0.
- Selected feature card: 2px solid #111111.
- Keep outlines dark and crisp rather than relying on soft shadows
  alone.
Shadow language
The design uses playful, visible offset shadows alongside soft ambient
shadows.
- Primary button: 0 3px 0 var(--teal).
- Dark button: 0 3px 0 #111111.
- Selected card: 0 10px 0 #111111.
- Goal card: 0 4px 0 #111111.
- Review card: 6px 6px 0 #111111.
- Floating badge: 3px 3px 0 #111111.
- Device frame: soft, broad shadow 0 20px 50px rgba(0,0,0,.12).
Principle: use hard-offset shadows for tactile, playful controls and
soft shadows for depth behind large mockups.
5. Component patterns
Navigation bar
- Sticky at the top of the viewport.
- Warm translucent background: rgba(252,252,248,.88).
- Backdrop blur: 14px.
- Inner row height: 62px.
- Logo uses a small circular outlined mark and bold wordmark.
- Navigation links are compact, horizontally aligned, and semibold.
- Primary navigation action uses the pill button style.
- Mobile navigation collapses behind a circular menu control.
Logo / wordmark
- Horizontal lockup with mark followed by wordmark.
- Mark: 26 × 26px, white fill, 1.5px dark outline, circular.
- Wordmark: 15px, weight 800, letter-spacing -0.04em.
- Maintain compact spacing (8px) between symbol and wordmark.
Buttons
Base - White background. - 2px dark outline. - Fully rounded pill
shape. - Padding: 8px 16px. - Font: 13px, weight 700. -
Inline-flex alignment with a 7px icon gap. - Teal hard-offset shadow.

Variants - dark: near-black background, white text, dark offset
shadow. - Larger hero action: approximately 11px 20px padding. -
Compact action: approximately 5–7px 12–14px padding and 11px text.

Interaction states - Hover: lift by 2px, increase shadow depth. -
Active: press down by 1px, reduce shadow depth. - Preserve clear
pointer affordance.
Hero section
- Two-column composition with copy on the left and device mockup on
  the right.
- Large, bold, tightly tracked headline.
- Short supporting paragraph with a controlled maximum width.
- Primary and secondary pill actions sit together and wrap when
  needed.
- Small award / proof points appear beneath the actions.
- Device mockup is the main visual anchor.
Device mockup
- Approximate desktop frame: 290 × 560px.
- White surface, 3px dark border, 42px radius.
- Subtle inset border and broad soft shadow.
- Slight rotation (1deg) gives a physical, editorial feel.
- Top notch is a dark rounded capsule.
- Screen uses a white-to-pale-teal gradient.
- Floating controls, badges, and a small image card overlap the device
  frame.
- On narrow screens, frame reduces to approximately 260 × 500px.
Feature cards
- Eight-column desktop grid.
- Minimum height: 340px.
- Radius: 18px.
- Padding: 14px 12px 12px.
- Saturated category background with white text, except the outlined
  white variant.
- Vertical flex layout places a miniature UI preview at the bottom.
- Hover lifts the card by 6px.
- Selected state adds a dark outline and hard-offset shadow.
Miniature UI preview
- White or dark inset panel inside feature cards.
- Rounded top corners: 16px 16px 10px 10px.
- Minimum height: 190px.
- Compact labels, progress bars, timers, tallies, and charts.
- Soft shadow separates the preview from the parent card.
- Use a small number of meaningful UI elements; avoid dense dashboard
  clutter.
Widget tiles and marquee
- Tile size: 190 × 130px.
- White background, subtle neutral border, 16px radius.
- Internal padding: 10px.
- Small soft shadow.
- Horizontal, continuously moving rows.
- Second row reverses direction.
- Pause motion on hover.
- Use a clipped / masked edge fade to soften the marquee boundaries.
Testimonial / review card
- Warm brown background (#BC7F4A).
- White text.
- 22px radius and 2px dark outline.
- Hard shadow: 6px 6px 0 #111111.
- Minimum height: 300px.
- Quote uses large, bold text (22px) with tight line-height.
- Author / source metadata is anchored along the bottom.
- Adjacent controls are small circular outlined buttons with compact
  pagination dots.
FAQ accordion
- Content maximum width: 760px.
- Single-column list with subtle bottom dividers.
- Question row uses a full-width, borderless button.
- Padding: 16px 4px.
- Font: 13px, weight 700.
- Plus icon is aligned to the right.
- Open state reveals muted answer text with 13px size and 1.6
  line-height.
- Open-state icon rotates to indicate expansion.
Cookie notice
- Fixed to bottom-left with 14px viewport offsets.
- Width: 280px.
- White surface, 1.5px dark outline, 14px radius.
- Padding: 12px.
- Hard shadow: 5px 5px 0 #111111.
- Compact copy and two equal-width pill-like actions.
Footer
- Top divider and generous top margin.
- Four-column desktop layout, two columns at tablet widths.
- Small uppercase section labels.
- Links are stacked with compact vertical padding.
- Brand area includes logo, primary action, and small muted legal
  copy.
- Bottom metadata row uses small muted text and flexible alignment.
6. Data visualisation primitives
The source uses simple, compact visual forms rather than complex chart
chrome.
- Progress bar: pale neutral track, coloured fill, fully rounded
  ends.
- Timer: monospaced digits, bold weight, white surface, dark
  outline, rounded rectangle.
- Heatmap: small square cells in a tight grid with yellow or green
  intensity.
- Bar chart: narrow vertical bars with rounded top corners.
- Tally / metric: large bold numeric value with small uppercase or
  supporting label.
- Map preview: pale grid background, teal radial accents, circular
  outlined pins.
Keep labels short and visualisations low-detail when used inside
miniature previews.
7. Motion and interaction styling
Visual motion extracted from the source:
  Interaction                         Treatment
  Button hover                        translateY(-2px) with deeper
shadow

  Button active                       translateY(1px) with reduced
shadow

  Feature-card hover                  translateY(-6px)

  Marquee                             Linear horizontal movement;
approximately 38s / 44s per cycle

  Marquee hover                       Pause animation

  Reveal on scroll                    Fade in while moving from
translateY(18px) to neutral

  FAQ open                            Expand answer and rotate plus icon
Floating badge                      Slight static rotation for visual
energy
Prefer short, purposeful transitions. The source generally uses
0.18–0.3s for controls and 0.6s for reveal transitions.
8. Responsive rules
At widths below 900px
- Hero and review layouts become single-column.
- Feature grid changes from eight columns to four.
- Footer changes from four columns to two.
- Hero heading reduces from 52px to 40px.
- Device zone retains a substantial minimum height.
At widths below 560px
- Feature grid changes to two columns.
- Section heading reduces to 28px.
- Hide selected desktop navigation links.
- Show circular hamburger control.
- Mobile menu becomes a vertical stacked panel.
- Device frame reduces to 260 × 500px.
9. Accessibility and implementation notes
These are extraction notes, not additional features:
- Keep text contrast strong, especially on saturated feature-card
  backgrounds.
- Preserve visible keyboard focus styles when implementing the
  components in a new project; the supplied source does not define a
  dedicated focus treatment.
- Ensure icon-only controls have accessible names.
- Respect reduced-motion preferences for marquee and reveal effects;
  the supplied source does not include a reduced-motion rule.
- Do not rely on colour alone to communicate selected or active
  states.
- Maintain usable touch targets when adapting compact desktop controls
  to mobile.
10. What is intentionally not included
This document does not specify: - Product positioning, page copy,
marketing claims, or FAQ wording. - Application data models or tracking
functionality. - JavaScript event handlers, state management, timers, or
persistence. - Backend, authentication, analytics, or third-party
integrations. - The actual app-store destination or external service
behaviour.

Those elements are outside the visual design-system extraction
requested.