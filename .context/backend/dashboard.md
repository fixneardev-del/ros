Movexa — Clinic Analytics Dashboard Design System
Design extraction from the supplied Movexa HTML. This document captures the visual language, design tokens, layout rules, reusable UI patterns, and responsive behaviour. It intentionally excludes application logic, patient/staff data, business rules, and JavaScript interactions.

1. Design direction
Product type: Clinic operations and analytics dashboard.

Visual character: Soft, calm, modern, compact, data-dense, and approachable. The interface uses a warm grey-beige canvas, translucent off-white cards, rounded geometry, restrained shadows, and orange as the primary accent. Secondary colours distinguish analytics categories and operational states.

Design principles
- Keep the interface visually calm despite high information density.
- Use a consistent card system to group metrics, charts, lists, and operational workflows.
- Use warm neutrals as the foundation; reserve saturated colours for emphasis, categories, and status.
- Prefer compact labels and clear numerical hierarchy.
- Use rounded pills for filters and actions, and circular icon containers for quick visual recognition.
- Maintain consistent spacing and alignment across dashboard modules.
2. Design tokens
Colour palette
Token	Value	Intended use
--bg	#F1EFEE	Main application canvas
--card	#F8F7F6	Card surface reference
--ink	#17171B	Primary text
--muted	#85838D	Secondary text, labels
--border	#FFFFFF	Light card outlines
--orange	#FF7446	Primary brand/action accent
--blue	#4B8FF7	Secondary data and status accent
--green	#27AE68	Positive state, completion
--purple	#9969F6	Analytics category accent
--amber	#EE9B17	Attention and waiting state
--dark	#18181D	Dark buttons and selected controls
Body backdrop	#D8D8D8	Outer page background


Supporting colour treatments
- Orange tint: #FFEBE3
- Blue tint: #E3EBFB
- Green tint: #DFEEE6
- Purple tint: #EEE7FD
- Amber tint: #F9EDDA
- Neutral inset surface: #F0EEEE
- Light control surface: #FAFAFA
- Soft divider / progress track: #E7E6E6
- Positive badge surface: #DEEEE4
Usage guidance
- Orange is the dominant accent and should be used for primary emphasis, selected highlights, and brand moments.
- Blue, green, purple, and amber are semantic supporting colours. Keep their meaning consistent across charts, icons, and status labels.
- Use dark charcoal for high-contrast selected states and primary dark actions.
- Use muted grey-violet for secondary labels rather than reducing opacity on all text.
Typography
Typeface: Inter, with Arial/sans-serif fallback.
Role	Observed styling
Brand wordmark	27px, weight 700, letter-spacing -1.9px
Main page heading	25px, weight 500, letter-spacing -0.8px
Section heading	14px, weight 500
KPI value	23px, weight 500, letter-spacing -0.7px
Body / card content	Typically 10–12px
Metadata / helper labels	Typically 8–10px
Compact control labels	Typically 9px


Typography principles
- Use medium weights for headings and key values; reserve bold for the wordmark and emphasis.
- Use tight tracking for the logo and large numeric values.
- Keep metadata compact and muted.
- Maintain a clear distinction between primary values, labels, and supporting context.
Shape, radius, and elevation
Element	Radius / treatment
Main application shell	29px top corners; 3px translucent white border
Cards	22px
Pill controls	25–30px / fully rounded
Icon circles and avatars	50%
Small inset panels	11–15px
Patient/list rows	12–15px
Dropdown	15px
Main shell shadow	0 30px 70px #0000001b
Search shadow	0 4px 12px #00000009
Small card shadow	0 4px 10px #00000008


The visual system favours soft edges and subtle separation rather than hard outlines. Cards use a translucent white surface and a white border; nested items use slightly brighter surfaces or light neutral fills.
3. Layout system
Application shell
- Maximum width: 1390px.
- Desktop top margin: 48px.
- Desktop padding: 22px 41px 46px.
- Minimum height: viewport height minus 50px.
- Warm grey-beige surface with a translucent white border.
- Large rounded top corners; the shell reads as a floating workspace against a darker neutral page backdrop.
Global header
- Horizontal flex layout with left-aligned wordmark and right-aligned action/profile controls.
- Search control is centred independently using absolute positioning.
- Header bottom spacing: approximately 27px.
- Search field: 320px × 38px, pill-shaped, with a small circular orange gradient icon and compact keyboard shortcut hint.
Dashboard grid
- KPI strip: five equal columns with 12px gap.
- Main analytics area: two-column grid with a 2fr / 1fr ratio and 15px gap.
- Left and right columns are vertical stacks with 15px gaps.
- Lower analytics cards: two equal columns.
- Cards should have min-width: 0 inside grid columns to prevent content overflow.
Staff directory
- Four-column card grid on wide desktop.
- Staff cards use a compact profile header, status chip, three mini-stat cells, schedule/progress strip, and two actions.
Clinic desk / queue
- Four operational queue columns plus a wider side panel (1.5fr).
- Queue columns use compact patient cards and a minimum desktop height of 650px.
- Side panel groups at-a-glance metrics, an AI suggestion panel, and callback list.
- On narrower screens, the queue retains horizontal scrolling rather than compressing each queue into unreadable columns.
4. Spacing and sizing
The source uses a compact spacing scale rather than a formally declared token set. The following practical scale is derived from repeated values:
Token	Value	Typical use
space-1	4px	Tight icon/control spacing
space-2	6–8px	Small gaps, compact actions
space-3	9–10px	List and internal component spacing
space-4	12–15px	Card grids and section gaps
space-5	18px	Card padding
space-6	20–22px	Section and shell spacing
space-7	27px	Header-to-content spacing
space-8	41px	Wide desktop horizontal shell padding


Use the same spacing rhythm for repeated components. Dense data modules should remain compact, but avoid reducing touch targets below comfortable mobile sizes.
5. Component patterns
5.1 Wordmark
- Text-based wordmark: “Movexa”.
- 27px bold Inter, tight negative tracking.
- Primary wordmark is near-black; a short trailing brand detail is orange.
- No enclosing badge or icon is required in the supplied design.
5.2 Global search
- Centred pill-shaped field.
- Near-white surface, subtle white border and soft shadow.
- Circular orange gradient spark icon at the left.
- Small muted shortcut key at the right.
- Input text is compact and muted.
5.3 Icon buttons and profile controls
- Circular, near-white icon buttons, approximately 36px.
- Dark variant approximately 31px.
- Profile avatar approximately 36px, circular and cropped with object-fit: cover.
- Small horizontal gaps between top actions.
5.4 Page heading and filters
- Heading and subtitle aligned as a left content group.
- Heading actions aligned on the right on desktop.
- Segmented control uses a near-white capsule background.
- Selected segment uses dark charcoal with white text.
- Unselected segments use transparent backgrounds and muted text.
5.5 KPI / statistic card
- Minimum height: 115px.
- Padding: approximately 15px 16px.
- Rounded 22px card with subtle white border.
- Top row contains a muted metric label and a tinted circular icon.
- Main value is approximately 23px.
- Trend text is compact green, with muted comparison context.
- Five-card desktop row; two-column mobile arrangement.
5.6 Analytics chart card
- Desktop height: approximately 453px.
- Padding: 18px.
- Header row contains section title and compact select control.
- Legend sits beneath the header with separated metric groups.
- Chart area is approximately 335px high on desktop.
- Chart labels and legend metadata are muted; key values are larger.
- Use orange as the leading series accent, with secondary series colours taken from the semantic palette.
5.7 Secondary insight / information cards
- Two-column lower card grid.
- Minimum height around 190px.
- Padding: 18px.
- Section title around 14px.
- List rows use compact typography and small coloured square markers.
- Quote or review excerpts sit on a near-white inset surface with a 12px radius.
5.8 AI insight panel
- Warm peach gradient background, from pale orange to warm off-white.
- Minimum height around 252px.
- Spark icon in an orange gradient circle.
- Insight items appear as near-white inset rows with rounded corners.
- Highlight important terms using the orange accent.
- Primary action is a dark pill; secondary action is a light pill.
5.9 Staff utilisation panel
- Minimum height around 247px.
- Staff rows use a small circular avatar, name/metadata, and right-aligned percentage.
- Progress track is light grey, with a coloured fill.
- Progress bars are short, rounded, and visually restrained.
5.10 Compact alert / dues panel
- Horizontal layout with a larger tinted circular icon.
- Text block expands to fill available space.
- Supporting text is muted; key amount or value is medium-weight and larger.
- Minimum height around 126px.
5.11 Staff profile card
- Minimum height around 235px.
- Header: avatar, name, role, overflow action.
- Status chip uses semantic background/text pairing.
- Three-column mini-stat strip on a light neutral surface.
- Schedule label and thin segmented schedule bar.
- Two horizontally aligned pill actions at the bottom.
5.12 Operational queue column
- Queue column is a rounded card with compact title row and count badge.
- Patient items use a near-white inset card, 15px radius, and subtle shadow.
- Patient header combines avatar/initials, name, secondary detail, and overflow action.
- Footer contains appointment time and optional status tag.
- Contextual actions appear within the relevant queue item as compact buttons.
5.13 Queue side panels
- “Today at a glance” uses a two-by-two metric grid with icon circles.
- Patient flow uses a compact vertical bar visualization.
- AI suggestion panel uses a warm tinted surface and compact action pills.
- Callback list uses repeated avatar + patient detail + circular call action rows.
5.14 Status chips and badges
- Fully rounded, compact labels with small text.
- Use semantic pairs:
  - Positive: pale green background with green text.
  - Attention: pale orange background with orange text.
  - Neutral: light grey background with muted text.
  - Warning: pale amber background with amber text.
  - Informational: pale blue background with blue text.
- Keep chips small and consistent; do not use colour as the only indicator of status.
5.15 Buttons and pill controls
- Primary dark pill: charcoal surface, white text.
- Secondary pill: near-white surface, dark text.
- Filter pill: transparent or near-white surface, muted text.
- Typical compact label size: 9px.
- Pill padding: approximately 7px 12px.
- Hover uses a slight brightness change; active state scales down subtly.
5.16 Dropdown and modal surfaces
- Dropdown: white surface, light border, 15px radius, soft shadow, compact menu rows.
- Menu item: full-width button with icon and left-aligned label.
- Modal form patterns use stacked labels, inputs, selects, and a dark submit action.
- Inputs inherit the global Inter typography and use visible focus treatment.
6. Data visualisation language
- Use the semantic palette consistently across chart series, legend dots, status indicators, and progress bars.
- Orange is the main series/accent colour.
- Blue, green, purple, and amber distinguish supporting categories.
- Legend values are visually stronger than their labels.
- Keep chart framing minimal so the data remains the focus.
- Use small rounded bars for patient-flow and utilisation visualisations.
- Avoid introducing extra chart colours unless a new category genuinely requires one.
7. Interaction and state styling
The source defines these visual interaction conventions:
- Buttons and cards transition over approximately 180ms.
- Button hover applies a subtle brightness adjustment.
- Button active state scales to approximately 0.97.
- Selected tabs/segments use a dark background and white text.
- Dropdowns use a hidden/open visual state.
- Focus-visible controls use a 2px blue outline with 2px offset.
- Progress and status components use rounded fills and tracks.
This section records presentation only; it does not specify or reproduce the underlying JavaScript behaviour.
8. Responsive behaviour
At widths below 1100px
- Shell margin reduces to 20px; padding becomes 22px.
- Queue grid becomes horizontally scrollable with queue columns at least 180px wide.
- Queue side panel spans the full row and becomes a three-column grid.
- Staff grid reduces from four columns to three.
At widths below 760px
- Shell margin becomes 8px; padding becomes 18px 14px.
- Shell radius reduces to 22px.
- Header reserves vertical space for the search field, which moves below the main header row and fills the available width.
- Page heading stacks vertically.
- Heading actions fill the row and distribute space.
- KPI grid becomes two columns; the final KPI spans both columns.
- Analytics layout becomes one column.
- Main chart card height reduces to 410px; chart area to 290px.
- Lower analytics cards stack vertically.
- Staff grid becomes two columns.
- Toolbar stacks vertically; search input fills the width.
- Queue columns remain horizontally scrollable at approximately 210px each.
- Queue side panels stack vertically.
At widths below 420px
- Staff cards become a single column.
- KPI grid gap reduces to 8px.
- KPI card padding reduces to 13px.
- Segmented control horizontal padding tightens.
- Chart card padding reduces to 14px.
- Wordmark size reduces to 24px.
9. Accessibility and usability notes
- Preserve the visible blue focus outline for keyboard users.
- Keep labels and values distinguishable by hierarchy, not colour alone.
- Provide accessible names for icon-only buttons.
- Maintain sufficient contrast for muted text, especially on tinted card surfaces.
- Keep compact controls usable on touch screens; where necessary, enlarge the hit area without changing the visual scale.
- For status indicators, include text labels alongside semantic colour.
- Ensure horizontal queue scrolling is discoverable and keyboard-accessible.
10. Implementation reference
The source uses:
- CSS custom properties for the core palette.
- Inter loaded from Google Fonts.
- CSS Grid for KPI, analytics, staff, and queue layouts.
- Flexbox for headers, toolbars, list rows, and card internals.
- Lucide icons for interface iconography.
- Chart.js for chart rendering.
These are implementation references from the supplied HTML, not requirements to retain the same libraries.
11. Explicitly out of scope
This design system does not extract or define:
- Clinic business rules or workflows.
- Patient or staff records and sample content.
- Authentication, permissions, or backend architecture.
- Chart calculations or analytics definitions.
- Modal submission logic, notifications, routing, or state management.
- Any claim that the sample dashboard data is real.
Source: user-supplied Movexa — Clinic Analytics HTML. This is a separate design-system extraction and is not an extension of the previous Timespent design system.