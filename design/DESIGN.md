---
name: Clippy
description: Volunteer and shift management for multi-tenant organisations, in backoffice and volunteer modes.

---

# Design System: Clippy

> **Tokens live in code, not here.** Canonical values are defined in [`packages/ui/src/styles/default.css`](packages/ui/src/styles/default.css) (consumed via [`apps/frontend/src/app/globals.css`](apps/frontend/src/app/globals.css)). 

## 1. Overview

**Creative North Star: "The Volunteer's Welcome"**

Clippy coordinates volunteers and shifts for organisations, and the interface treats every volunteer as someone who chose to show up rather than someone being processed. The system leads with the person and lets the tooling recede: generous spacing, soft `rounded-xl` corners, a single warm green that reads as growth and energy. Even the backoffice, where coordinators run rosters and check-ins, inherits this hospitality. Density is never bought at the cost of breathing room.

The aesthetic is calm and humane, not clinical. Surfaces are flat at rest and lift only in response (hover, focus, the floating navigation) or when the elevation is needed for hierarchy. The palette is almost entirely tinted neutral, so the one green carries real weight when it appears. Geologica, a soft humanist sans, gives the whole product a friendly, contemporary voice without tipping into novelty.

This system explicitly rejects the dense enterprise-admin look: zebra-striped data grids, hairline-thin 13px type, slate-on-slate dashboards, and color used as decoration. It also rejects the over-friendly consumer extreme: no bouncy mascots, no rainbow gradients, no oversized illustration leading every empty state. Clippy is warm and dependable, the feeling of a well-run community shift, not a SaaS funnel.

**Key Characteristics:**
- One warm green, spent sparingly, against tinted-neutral surfaces.
- Soft, consistent rounding (`rounded-xl` on actions and containers).
- Comfortable, slightly oversized type. The smallest text is still 14px.
- Flat by default; elevation is a response to state, not a baseline.
- First-class dark mode, identical token roles to light.

## 2. Colors

A near-monochrome neutral field with one decisive green. Cool-tinted greys (hue ~286) keep the surface calm so the warm green (hue ~133) stands out as the single point of energy.

All colors are OKLCH, defined under `:root` and `.dark` in [`default.css`](packages/ui/src/styles/default.css). Names below are descriptive; the parenthetical is the canonical CSS variable.

### Primary
- **Field Green** (`--primary`, also aliased `--success`): The one voice of color. Growth and on-the-ground energy, the feeling of people showing up to do the work. Reserved for primary actions, the active navigation state, success, and confirmation. Its foreground pair (`--primary-foreground`) is a near-white with a faint green warmth for text and icons on green fills.
- **Focus Ring** (`--ring`): A brighter, higher-chroma green used only for focus rings, at reduced opacity. Signals keyboard focus without competing with the primary.

### Neutral
- **Ink** (`--foreground`): Primary text and high-emphasis foreground. A near-black tinted cool, never pure `#000`.
- **Paper** (`--background`, `--card`, `--popover`): Base background and card surface in light mode.
- **Surface Muted** (`--muted`, `--secondary`, `--accent`): Secondary, muted, and accent fills; the tab-bar track, hover states, quiet chips.
- **Muted Ink** (`--muted-foreground`): Secondary text, inactive icons, placeholder copy, inactive tab labels.
- **Hairline** (`--border`, `--input`): Borders, input strokes, dividers. Quiet enough to structure without drawing the eye.

### Tertiary
- **Danger** (`--destructive`): Destructive actions and error states only. Paired with `--destructive-foreground`. Never decorative.
- **Charts** (`--chart-1` through `--chart-5`): A graduated green ramp for data visualisation only. Data viz is the one place green may exceed the One Voice budget, because there the color is the data.

### Named Rules
**The One Voice Rule.** Field Green appears on at most 10% of any screen: the primary button, the active tab, a success badge, a confirmation. Everything else is tinted neutral. The green means something precisely because it is rare. If a screen looks green, something is overusing it.

**The Tinted-Neutral Rule.** No pure black, no pure white as text or fill. Every neutral carries the cool ~286 hue at trace chroma. Pure `#000`/`#fff` looks foreign next to the rest of the system.

## 3. Typography

Font stacks are defined as `--font-sans`, `--font-serif`, and `--font-mono` in [`default.css`](packages/ui/src/styles/default.css).

**Display / Body Font:** Geologica (`--font-sans`), main font in use, carries display through label, so hierarchy comes from scale and weight, not from mixing typefaces.
**Serif Font:** Merriweather (`--font-serif`), available for long-form editorial copy; not used in-app currently.
**Mono Font:** Source Code Pro (`--font-mono`), for codes, IDs, and tabular figures.

### The Upsizing Approach
The base shadcn/ui kit optimises for density and information display. Clippy deliberately trades some density for legibility and accessibility with a **single-step bump of the entire Tailwind type scale** implemented by redefining the scale tokens (`--text-xs` through `--text-4xl`) rather than touching markup. Every existing `text-*` class renders one step larger automatically, so layout structure, component hierarchy, and the token system are preserved. The change is deliberately minimal: a one-step type bump plus a few targeted component-size adjustments, no redesign.


### Hierarchy
The scale is deliberately shifted up one step from typical web defaults: comfortable, slightly generous, easy to read on a phone held at a check-in desk. Each step also carries an intended in-app role.

- **Display / Page Title** (`.page-title`, bold): The page-title utility at the top of a route. Responsive: `text-3xl` on mobile, `text-4xl` on desktop. Unmissable.
- **Headline** (`text-3xl`, bold): Major section headers within a page (`h1`).
- **Title** (`text-xl`, bold for a section head / semibold for a card title): Sub-section, card-group, and form-section headers (`h3`, the "smallest headline").
- **Body** (`text-base`, regular): Default running text, form values, button labels, and main content. Cap measure at 65 to 75ch.
- **Secondary** (`text-sm`, regular): Sub-headlines and supporting descriptions, usually in muted ink. One step below body.
- **Label / Helper** (`text-xs`, regular to medium): Captions, input helper text, metadata, tab labels, table headers. The floor of the scale.

### Named Rules
**The 14px Floor Rule.** Nothing renders below 14px. What other systems call `text-xs` is 14px here, not 12px. If text feels too small, the scale is being fought; step up, don't shrink.

**The One Family Rule.** Geologica does the work alone in-app. Reach for Merriweather only for genuine long-form prose, and Source Code Pro only for machine values (IDs, codes). Never mix families for decoration.

**The Weight Rebalancing Rule.** When text grows, weight must rebalance to keep the hierarchy intact, in two directions:
- **Headings and labels gain weight** so they stay dominant over the now-larger body. Section headings go SemiBold (600) to **Bold (700)**; form labels go Medium (500) to **SemiBold (600)**.
- **Dense, repeated content sheds weight** so enlarged text doesn't read as heavy. Table cell text goes Medium (500) to **Regular (400)**; badges go SemiBold (600) to **Regular (400)**.

## 4. Elevation

Flat by default. Surfaces sit on the background with a hairline border and no shadow at rest. Depth is reserved for things that genuinely float or respond: the fixed bottom navigation, popovers and dialogs, and hover states. Shadows are low-opacity (≈0.1) and tightly blurred (3px base), so even when present they read as a soft contact shadow, never a heavy drop.

### Shadow Vocabulary
Values are defined as `--shadow-*` in [`default.css`](packages/ui/src/styles/default.css); the ramp shares one soft, low-opacity recipe and only grows the spread.
- **`--shadow-xs`**: Inputs and resting controls. Barely there.
- **`--shadow-sm`**: Cards.
- **`--shadow-md`**: The floating tab-bar and its islands at rest.
- **`--shadow-lg`**: Hover lift on floating elements, popovers, dialogs.

### Named Rules
**The Flat-At-Rest Rule.** A surface earns a shadow only by floating (fixed nav, overlay) or by responding (hover, focus). Static content in the page flow uses a hairline border, never a shadow, to separate from its neighbours.

## 5. Spacing & Layout

Layout in Clippy is a meaning system, not a visual one. Space encodes how tightly things belong together; structure encodes the kind of content. Two named rules carry most of the weight.

### Named Rules
**The Proximity Spacing Scale (4 / 8 / 16 / 24).** Related elements live in one container, and the gap *inside* a group is always smaller than the gap *between* groups. The number is read off the relationship, never the look:
- **4** — elements meaningless apart: helper text under a field, a caption under a button.
- **8** — distinct facets of one subject: the time and place of an event, two badges on one entity.
- **16** — separate parts within one block.
- **24** — two separate blocks.

If a gap is chosen to "look right" instead of to express how closely two things belong, it is chosen wrong. Spacing is a meaning decision.

**The Cards-vs-Full-Screen Rule.** The container follows the content's job. A **list** of peer items is **cards**: each card is one tappable record. A **detail** view of a single entity is **full-screen with hairline `$border` separators between sections**, never nested cards. Lists collect; details unfold. This is the positive form of the never-nest-cards rule (§7): if you are reaching for a card inside a detail page, the answer is a separator.

## 6. Components

Each component's visual styling lives in its file; this section captures only purpose and the rules that aren't obvious from the code.

### Buttons
[`base/button.tsx`](packages/ui/src/components/base/button.tsx) (variants and sizes via `cva`).
- **Variant choice:** Use **primary** when it is the only action or the clearly preferred one (Save vs Cancel: Save is primary). **Outline / secondary** for neutral alternatives, **ghost** for low-emphasis, **link** for inline text links.
- **Sizing rule:** Standalone primary actions use `lg` (form submits, page-header actions, navbar CTAs). Do **not** bump toolbar, filter, or secondary controls that aren't paired with a main CTA; they stay at the default `md` size.
- **Link off-platform:** If a link sends the user off the platform, mark it with a trailing external-link icon.
- **Icon-only:** Reserve for repeated actions with a universally understood icon (Edit, Save). Use a *primary* icon button only when the action is the main or sole one.

### Inputs / Fields
[`input.tsx`](packages/ui/src/components/input.tsx).
- **Label** always required. Mark the *optional* fields rather than the required ones (required is the baseline). Add icons or a description only when they earn their place.
- **Validation** is ARIA-driven: set `aria-invalid`; never hand-roll an error class.

### Selection Controls (Checkbox, Radio, Switch)
[`base/checkbox.tsx`](packages/ui/src/components/base/checkbox.tsx), [`base/radio-group.tsx`](packages/ui/src/components/base/radio-group.tsx), [`base/switch.tsx`](packages/ui/src/components/base/switch.tsx).
- **Checkbox:** Choosing from a list, or a synonym for accept / select. The box is bumped to 18px from the 16px base; do not shrink it back.
- **Radio:** A list where exactly one option can be selected.
- **Switch:** A synonym for on / off. Place it on the right, contained in a card, so mobile and desktop match. Do **not** mix switches and checkboxes in the same list; long switch lists need their own treatment.

### Alerts
[`base/alert.tsx`](packages/ui/src/components/base/alert.tsx).
- **Purpose:** Report the outcome of a background action (e.g. after editing shift details). Prefer including the icon; the visual hook aids recognition.
- **With action:** Add a trailing action (e.g. Undo) for sensitive, reversible cases like deletion.

### Select
[`base/select.tsx`](packages/ui/src/components/base/select.tsx).
- **Label** always present. **Single-select** marks the chosen option with a checkmark (only when one is already selected). **Multi-select** replaces the leading option icon with checkboxes.

### Textarea
[`base/textarea.tsx`](packages/ui/src/components/base/textarea.tsx).
- **Label** always required. **Minimum height is 3 lines** of text; do not ship a single-line textarea.

### Input Group (people picker)
[`base/input-group.tsx`](packages/ui/src/components/base/input-group.tsx).
- A searchable list of people with selection controls ("Search name or email"). **Label** always required. Used to invite volunteers to shifts and to move people between lists in any other context.

### Calendar / Date Picker
[`calendar.tsx`](packages/ui/src/components/calendar.tsx), [`date-picker/`](packages/ui/src/components/date-picker/).
- **Single-day picker:** For shift and event fields, where something happens on one day.
- **Two-month range picker:** For project and event filtering over periods longer than a day. **Omit time fields** for ranges; that precision isn't needed and only adds noise.

### Cards / Containers
[`base/card.tsx`](packages/ui/src/components/base/card.tsx).
- **Purpose:** Group related content. Cards do **not** lift on hover unless the card itself is interactive (see Elevation). **Never nest cards.**

### Badges
[`base/badge.tsx`](packages/ui/src/components/base/badge.tsx).
- **Weight:** Regular, not bold (badges shed weight under the Weight Rebalancing Rule).
- **Variant maps to status meaning:** a verified volunteer reads as success (positive); a banned volunteer reads as error (negative); an open vs closed shift uses the informational pattern. Outline variants keep a colored border with neutral text, so badges don't spend the One Voice green budget.

### Navigation: The TabBar (signature component)
[`tab-bar.tsx`](packages/ui/src/components/tab-bar.tsx). Clippy's primary navigation: a floating bottom bar fixed above content, respecting the iOS safe-area inset.
- **Sizing rule:** Tabs are fixed-width so every tab and the island share one footprint; the active tab is bold.
- **Motion:** The highlight animates with a settling spring (no bounce) and must snap instantly under `prefers-reduced-motion`.
- **Islands:** At most one satellite button, chosen by app mode: a `left` island opens the backoffice sidebar (icon-only); a `right` island switches app mode (icon + label). The component stays mode-agnostic; the consumer picks which (if any).
- **Keyboard:** Arrow Left/Right move and focus between tabs; the active tab carries `aria-current="page"`.

## 7. Do's and Don'ts

### Do:
- **Do** keep Field Green to ≤10% of any screen (the One Voice Rule). Reserve it for the primary action, the active state, and success.
- **Do** tint every neutral toward the cool ~286 hue. Use the OKLCH tokens; never hardcode `#000` or `#fff`.
- **Do** keep body text at 18px and never go below the 14px floor.
- **Do** rebalance weight when text scales: headings and labels gain weight (section heading to Bold 700, label to SemiBold 600); table cells and badges shed it to Regular 400.
- **Do** reserve the `lg` button size for standalone primary actions; keep toolbar, filter, and secondary controls at the smaller `md` size.
- **Do** use `rounded-xl` for buttons and cards, `rounded-md` for inputs, and `rounded-full` for the tab-bar. Keep rounding consistent within a tier.
- **Do** start surfaces flat. Add a shadow only when an element floats or responds to state.
- **Do** drive focus, error, and active states through ARIA (`aria-invalid`, `aria-current`) and the token-bound ring, so light and dark stay in sync.
- **Do** honor `prefers-reduced-motion`: motion (like the TabBar highlight) must snap instantly when reduced.

### Don't:
- **Don't** use green as decoration, tint backgrounds with it, or let a screen "look green." Rarity is the point.
- **Don't** introduce a second accent hue. Status meaning lives in green (success) and Danger (error) only.
- **Don't** drop below 14px or revert to a tight 12/13px enterprise-admin scale.
- **Don't** mix type families for emphasis; hierarchy comes from Geologica's scale and weight. Reserve Merriweather for long-form prose and Source Code Pro for machine values.
- **Don't** put shadows on static in-flow content; separate with a hairline border instead.
- **Don't** use a `border-left`/`border-right` colored stripe as an accent on cards, list items, or alerts. Use a full border, a muted tint, or a badge.
- **Don't** add bounce or elastic easing. The TabBar's spring is calibrated to settle, not to wobble; new motion should ease out and resolve.
- **Don't** drift toward either failure mode: clinical zebra-grid enterprise admin, or bouncy mascot-and-gradient consumer.
