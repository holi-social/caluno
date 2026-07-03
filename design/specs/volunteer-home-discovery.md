# Spec: `volunteer-home-discovery` — Volunteer Home & Discovery

**Slug:** `volunteer-home-discovery`
**Status:** ready for dev
**Ticket:** [VOLI-618](https://holi.atlassian.net/browse/VOLI-618) · sub-task of [VOLI-526](https://holi.atlassian.net/browse/VOLI-526)
**Design file:** `design/design_files/volunteer-home.pen`
**Design nodes:** `ax7bW` (home/upcoming), `myxxu` (discover), `N3WzQT` (your shifts), `uiek0` (desktop 1-col), `fmll8` (desktop 2-col) + `C276u`, `wN9ht`, `dpECO`, `hLfJa`, `u58h5`, `S2WcgN` (empty/loading variants)
**Context:** `design/volunteer-home-discovery-context.md`
**Translations:** `design/volunteer-home-discovery-translations.md`
**Routes:** `/[locale]/` (home — stub exists), Discover and Your shifts sub-routes TBD (see Design Debt D4)

---

## Problem

The volunteer-facing home (`/[locale]/`) is a stub showing only a "Home" heading. Volunteers have no surface to see their upcoming committed shifts or discover available ones. All three pilot orgs need this immediately:

- **Org A** volunteers need to track their committed shifts at a glance, with time and location.
- **Org B** volunteers primarily use a discovery feed — flexible, come-and-go participation depends on seeing what's available right now.
- **Org C** coordinators attract volunteers through event-linked shift cards; the discovery feed is the promotional surface.

Without this page, a volunteer who completes login has nowhere meaningful to go.

---

## User Stories

**Volunteer — Regular (Org A)**
- I open the app and immediately see which shifts I'm signed up for this week, without navigating elsewhere.
- I can see a conflict warning when two of my shifts overlap in time.

**Volunteer — Temporarily Engaged (Org B)**
- I land on the home and browse what shifts are available next week, filtered by my org.
- I can switch to a calendar view to find a date that suits me.

**Volunteer — First-Timer (Org C)**
- I arrive via a shared event link, join, and then land on the home where I can see available event shifts without any setup.

**Volunteer — All**
- On mobile I can see my own upcoming shifts and a discovery feed in one app surface.
- On desktop I see both my shifts and the discovery feed side by side without navigating.

---

## Design Decisions

1. **Unified home surface**: `/[locale]/` shows both "Your shifts" (committed) and "Discover" (available) in one page rather than two separate top-level routes. *(Principle 2 — fast path: one screen, two panels.)*
2. **Two shift card variants**: `ShiftCard/Discovery/Solo` (standalone shift) and `ShiftCard/Discovery/Event` (event-linked shift with cover image). Both are new domain components. *(Principle 6 — same job, same shape: card data layout is consistent with shift detail and event detail pages.)*
3. **Day-strip calendar**: shared navigation pattern in both Discover and Your shifts — one pill per day, active day in `$primary`. *(Principle 6.)*
4. **Pre-defined date filter chips**: "Next week" and "This weekend" are quick-select named ranges, not arbitrary date pickers. Org-unit chips are dynamic (one per enrolled org unit). *(Principle 4 — plain over clever: named ranges are faster on mobile.)*
5. **Greeting header**: `HomeHeader` from `@repo/ui` takes `title` prop as greeting text; component auto-detects scroll and collapses. *(Principle 3 — warmth through restraint: one human moment at top, then content.)*
6. **Mobile sub-views are separate routes**: Discover and Your shifts use `DetailPageHeader` with back arrow — indicating separate routes off the home. Route paths need product decision (Design Debt D4).

---

## Scope Boundary

**In scope:**
- Home page `/[locale]/` — full implementation replacing the stub.
- "Your shifts" section: day strip + timeline of booked shifts, with overlap warning.
- "Discover" section: date-grouped list of available shifts, date range + org-unit filter chips.
- `ShiftCard/Discovery/Solo` and `ShiftCard/Discovery/Event` new domain components.
- Mobile and desktop layouts (all design nodes).
- All empty and loading states.
- i18n: `VolunteerHome` namespace in both `en.json` and `de.json`.

**Out of scope:**
- Shift sign-up / join flow — links to existing shift detail page (VOLI-616).
- Event detail page (VOLI-622, separate ticket).
- Check-in QR scan / confirmation modal (separate surface). The check-in and check-out **buttons** and API calls are in scope (AC 44–45).
- Push notification / real-time updates.
- Arbitrary date range picker — named chips only, by design decision 4.
- Backend Event entity (DEP-4, VOLI-710) — event card variant degrades gracefully if event data absent.
- Route path decisions for Discover and Your shifts sub-views (Design Debt D4).

---

## Acceptance Criteria

### Home page — Core

1. `GET /[locale]/` renders server-side for authenticated volunteers. Unauthenticated users are redirected to `/[locale]/auth/login?callbackUrl=/[locale]/`.
2. The `HomeHeader` component from `@repo/ui` is used for the greeting header. The `title` prop receives `VolunteerHome.greeting` with `{firstName}` interpolated from `session.user.firstName`. When `firstName` is null or empty, `title` receives `VolunteerHome.greetingFallback`.
3. `HomeHeader` handles its own scroll collapse — no JavaScript scroll listener in the page component. Pass no `variant` prop so the component auto-detects.
4. `HomeHeader.avatarUrl` is populated from `session.user.image`. When null, the DS `AvatarFallback` (UserIcon) renders automatically.

### Your shifts section (home preview)

5. "Your shifts" section lists upcoming committed `ShiftInstance` records for the authenticated volunteer, ordered by `actualStartsAt` ascending from now.
6. The preview is horizontally scrollable on mobile, showing cards at natural width; container does not clip on desktop. A "See all →" link (`VolunteerHome.yourShiftsSeeAll`) navigates to the Your shifts sub-view.
7. When the volunteer has no upcoming shifts, the section shows: `Empty` + `EmptyMedia` (icon: `calendar-x`) + `EmptyTitle` (`VolunteerHome.yourShiftsEmpty`) + `Button` (`lg`, `default` variant, `VolunteerHome.discoverCta`) linking to the Discover view.
8. The desktop "Your shifts" section header shows `VolunteerHome.yourShiftsCount` (ICU plural `{n}` from live count) and a `VolunteerHome.yourShiftsSeeAll` link — same label and same destination as the mobile "See all" link. There is no "Balance" link.

### Discover section / view

9. The Discover section lists available `ShiftInstance` records — shifts the volunteer has **not** signed up for — ordered by `actualStartsAt` ascending.
10. Shifts are grouped by calendar day. Each day group has a "Day Head" label showing the formatted date (`getFormatting().formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })`) and shift count.
11. Active filter chips narrow the result set. Date chips (`VolunteerHome.filterNextWeek`, `VolunteerHome.filterThisWeekend`) map to date ranges evaluated at render time server-side. Org-unit chips render one per enrolled `OrgUnit`; no chips = unfiltered. Multiple chips can be active simultaneously.
12. Filter chips are `<button>` elements using `Badge` styling (`asChild` or a `FilterChip` domain wrapper). Active state: `Badge` variant `"default"` (green). Inactive state: `Badge` variant `"outline"`. Each chip has `aria-pressed="true"` when active, `aria-pressed="false"` when inactive.
13. When active filters produce zero results: `Empty` + `EmptyMedia` (icon: `search-x`) + `EmptyTitle` (`VolunteerHome.discoverEmpty`) + `EmptyDescription` (`VolunteerHome.discoverEmptyBody`). No CTA (filters are already visible above). *(Design node: `wN9ht`.)*
14. When the Discover view has zero shifts at all (no filters active): `Empty` + `EmptyTitle` (`VolunteerHome.discoverEmpty`) + `Button` (`lg`, `default`, `VolunteerHome.discoverCta`) with `href` to the page itself (refresh / prompt to check back).

### ShiftCard/Discovery/Solo

15. Shows: time range (`actualStartsAt`–`actualEndsAt` via `getFormatting().formatTime()`), shift title (`master.title`), org unit name (`master.orgUnit.name`), recurrence label (friendly string from `master.rrule`, e.g. `VolunteerHome.weekly`), spots-left badge.
16. Spots-left badge: `Badge` variant `"outline"` showing `VolunteerHome.spotsLeft` with ICU plural `{n}` from `maxVolunteers - filledCount`. When `spotsLeft = 0`: badge shows `VolunteerHome.fullyBooked`; card gets `bg-muted` fill; card is **not** a link.
17. Available cards are `<a>` elements linking to `/[locale]/shifts/[shiftId]` (VOLI-616). Fully booked cards render as `<div>` with `aria-disabled="true"`. *(Resolves Gate 2 flag.)*
18. `Card` from `@repo/ui` is used as the container: `rounded-xl` (`cornerRadius: 12`), `bg-card`, `border border-border`.

### ShiftCard/Discovery/Event

19. All Solo rules (15–18) apply, plus: event cover image (`Event.coverImageUrl`) renders at the top of the card as `<img>` with `object-fit: cover`, `height: 120px`, full card width. Image has `alt=""` (decorative — event title is already present in the card body).
20. When `Event.coverImageUrl` is null, the image slot renders as `bg-muted` (`height: 120px`, full card width) — card retains the Event layout, no broken image, no collapse to Solo. Mirrors the cover image fallback on the public event detail page (AC 3 in `public-event-detail` spec).
21. Event title (`Event.title`) renders above the shift title in `text-sm text-muted-foreground` weight.

### ShiftCard/My (next shift & future shifts)

40. The "Your shifts" preview and full view use two card sizes: the **next shift card** (full-width, one per page — the single soonest upcoming `ShiftInstance`) and **future shift cards** (compact, min-width 140px, all remaining booked shifts). Only the next shift card has interactive check-in/check-out elements. *(Design node: `USHss`.)*

41. Next shift card structure: vertically stacked — a timer banner at the top, then a horizontal body row. The timer banner spans the full card width, `cornerRadius: [8,8,2,2]` (top corners rounded, bottom flat so it sits flush above the body). The body row contains shift info on the left (`fill`) and a right-side action button (100px wide, height stretches to fill body height). Card container: `rounded-xl`, `bg-card`, `border border-border`, `padding: 12px`.

42. Card body shows: time range (`actualStartsAt`–`actualEndsAt`), shift title (`master.title`), recurrence label, and **address** (`map-pin` icon). Address is shown here — **not** `orgUnit.name` as on discovery cards. A booked volunteer needs to know where to go, not which org unit. *(Decision 8.)*

43. Timer banner has four states, re-evaluated every minute client-side:
    - **Far** (`actualStartsAt − now > 3h`): `clock-4` icon · `VolunteerHome.timerStartsIn` · default text color. Action button: **hidden**.
    - **Soon** (`0 < actualStartsAt − now ≤ 3h`): `clock-4` icon · `VolunteerHome.timerStartsIn` · default text color. Action button: **"Check in"** enabled.
    - **Overdue** (`now ≥ actualStartsAt`, not checked in): `bell-ring` icon · `VolunteerHome.timerStartedAgo` · `text-alert` token (`--alert` in DS). Action button: **"Check in"** enabled.
    - **Active** (checked in): `play` icon · `VolunteerHome.timerVolunteering` · default text color. Action button: **"Check out"**.

44. Check-in button: `bg-primary text-primary-foreground` (not hardcoded `#5ea500`), Lucide `qr-code` icon (20px), label `VolunteerHome.checkIn`. On tap: calls the `checkIn` mutation for this `ShiftInstance`. The QR scan / confirmation flow is out of scope — the button triggers a direct API call.

45. Check-out button: `variant="outline"`, Lucide `door-open` icon (20px), label `VolunteerHome.checkOut`. On tap: calls the `checkOut` mutation. Same dimensions as check-in button (100px × body height).

46. Future shift cards (compact): time range, title, recurrence, address — min-width 140px, no timer banner, no action button. Used in the horizontal home preview scroll (AC 6) and in the timeline list below the next shift card in the full view (AC 28–30).

### Day strip (shared — Discover and Your shifts)

22. Day strip shows one pill per calendar day. On **Discover**: range spans today → latest `actualStartsAt` in the result set — future only, today is always the first pill. On **MyShifts**: range spans the earliest booked `actualStartsAt` → the latest — past **and** future; the strip is scrollable in both directions so volunteers can navigate their full shift history.
23. Active day pill: `bg-primary text-primary-foreground` — **not** a hardcoded hex. *(Resolves Gate 1 flag: `#5ea500` in design → `bg-primary`.)* Inactive pills with shifts: `bg-border text-foreground`. Days with no shifts: `bg-muted text-muted-foreground`, `aria-disabled="true"`, not interactive.
24. Day pills have a **fixed width** (per design file). Each pill shows abbreviated day name + date number (`getFormatting().formatDate(date, { weekday: 'short', day: 'numeric' })`). Pills with shifts show a shift count badge beneath the date.
25. Day strip container has `role="tablist"`. Each pill button has `role="tab"` and `aria-selected="true"` / `"false"`. Arrow left/right keys move focus between interactive (non-disabled) tabs. *(Gate 2.)*
26. Selecting a day scrolls the list below to that day's group and snaps the active pill to the visible area of the strip (scroll-into-view on the pill). URL is not changed — day strip is client state only.
27. On initial render the active day is always **today** — on both Discover and MyShifts. On Discover, today is the first pill so it is inherently at the start. On MyShifts, today sits mid-range; the strip's initial scroll position is set so today's pill is visible without user interaction. Past days are reachable by scrolling left; future days by scrolling right.
47. When the user has scrolled the day strip ≥ 1.5 viewport widths away from today's pill, a `Button` (`variant="outline"`, `size="md"`) with label `VolunteerHome.todayButton` appears pinned to the right edge below the strip. Tapping it scrolls the strip back to today's pill and sets today as the active day. The button is hidden when today is already within 1.5 viewport widths of the current scroll position.

### Your shifts — full view

28. Accessed from the "See all →" link on the home. Back button returns to home (`router.back()`). Label: `Common.back`.
29. Your shifts view uses the day strip (AC 22–27) showing only days on which the volunteer has booked shifts.
30. When two shift instances overlap (time ranges intersect), an inline warning between the conflicting cards shows: `triangle-alert` icon + `VolunteerHome.overlapWarning`. Icon has `aria-hidden="true"`; the warning text is the sole accessible label. *(Gate 2.)*
31. The first upcoming shift in the full view uses the **next shift card** (AC 40–45) with the timer banner and check-in/check-out button. All subsequent booked shifts use the **future shift card** (AC 46). There is no Cancel or View button on these cards — both actions are available from the shift detail page at `/[locale]/shifts/[shiftId]`.
32. When no booked shifts: `Empty` + `EmptyMedia` (icon: `calendar-x`) + `EmptyTitle` (`VolunteerHome.yourShiftsEmpty`) + `Button` (`lg`, `default`, `VolunteerHome.discoverCta`) linking to the Discover view.
33. Past shifts (`actualEndsAt < now`) render as **inactive cards**: `bg-muted` fill, no check-in/check-out button, no link — same treatment as fully booked cards on the event detail page. They appear on their respective past day in the strip; the day pill itself is rendered normally (not disabled), since it has content.

### Desktop layout

33. Desktop home at `/[locale]/` renders both sections without sub-page navigation.
34. Below `min-width: 1024px` (one-column): "Your shifts" preview stacks above "Discover". Your shifts renders as a flat horizontal list (no day strip in preview mode).
35. At `min-width: 1024px` (two-column): left column (wider) = Discover with its day strip; right column = Your shifts with its own day strip. `gap-12` between columns.

### Loading states

36. While data is loading, shift card slots render as `Skeleton` components from `@repo/ui`. Day strip pills render as skeleton rectangles. Header and filter chips render immediately (not skeleton).
37. Loading skeletons must not flash for responses faster than 300ms — use React `Suspense` with a `startTransition` wrapper or a minimum delay.

### Navigation

38. `TabBar/Volunteer` from `@repo/ui` is shown at the bottom of every mobile view; Home tab is `aria-current="page"` on all sub-views of `/[locale]/`.
39. Back button in Discover and Your shifts sub-views: `DetailPageHeader` from `@repo/ui` with `router.back()`. Label: `Common.back`.

---

## Design Assets

- **Design file:** `design/design_files/volunteer-home.pen`
  - `ax7bW` — Mobile: Home / Upcoming (primary craft reference)
  - `myxxu` — Mobile: Discover
  - `N3WzQT` — Mobile: Your shifts
  - `C276u` — Mobile: Home — Empty (no upcoming shifts)
  - `wN9ht` — Mobile: Discover — Empty (filtered, no results)
  - `dpECO` / `hLfJa` / `u58h5` / `S2WcgN` — Loading state variants
  - `uiek0` — Desktop one-column
  - `fmll8` — Desktop two-column
  - `Eo765` — Card treatment exploration
  - `USHss` — My Shifts card states (timer variants + check-in/check-out button)
- **Components from `@repo/ui` (use as-is):**
  - `HomeHeader` (`packages/ui/src/components/home-header.tsx`) — greeting header
  - `DetailPageHeader` (`packages/ui/src/components/detail-page-header.tsx`) — back-nav header for sub-views
  - `Badge` + `badgeVariants` (`packages/ui/src/components/base/badge.tsx`) — filter chips + spots badges
  - `Button` (`packages/ui/src/components/base/button.tsx`) — CTAs
  - `Card` (`packages/ui/src/components/base/card.tsx`) — shift card container
  - `Empty`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent` (`packages/ui/src/components/base/empty.tsx`) — empty states
  - `Skeleton` (`packages/ui/src/components/skeleton.tsx`) — loading states
  - `TabBar/Volunteer` (`packages/ui/src/components/tab-bar.tsx`) — bottom nav
- **New domain components (build in `apps/frontend/src/domain/home/components/`):**
  - `ShiftCardDiscoverySolo` — solo shift card, discovery context
  - `ShiftCardDiscoveryEvent` — event-linked shift card with cover image
  - `DayStrip` — horizontally scrollable day-pill navigator (`role="tablist"`)
  - `FilterChip` — toggle button using `Badge` `asChild` with `aria-pressed`
  - `ShiftCardMy` — next shift card with timer banner and check-in/check-out button (AC 40–45)
  - `ShiftCardMyFuture` — compact future shift card, informational only (AC 46)

---

## Discussion Artifacts

- **VOLI-526** — parent Solution, full discovery scope.
- **VOLI-616** — public shift detail (sibling) — shift card link target.
- **VOLI-622** — public event detail (sibling) — event-linked card target.
- **VOLI-710** — DEP-4: Event entity — needed for event card cover image.
- Card treatment exploration: design node `Eo765`.

---

## Decision Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Day strip active pill uses `bg-primary` token, not `#5ea500` | Hardcoded hex violates DS token rule and breaks dark mode. (Gate 1) |
| 2 | Filter chips are `<button>` elements, not `<span>` | `Badge` is a `<span>` — filter chips need toggle semantics (`aria-pressed`). Use `Badge` with `asChild` or a `FilterChip` wrapper. (Gate 1 / Gate 2) |
| 3 | `ShiftCard/Discovery/*` and `DayStrip` are domain components, not `@repo/ui` | Cards have route context and hook dependencies; DayStrip has day-strip keyboard logic. Both are feature-specific. (Gate 1) |
| 4 | `HomeHeader` from `@repo/ui` is used directly — no custom header | Component already implements scroll collapse with motion. `title` prop carries the greeting. (Gate 1) |
| 5 | Discover and Your shifts are separate routes with back-navigation (mobile) | Design uses `DetailPageHeader` with back arrow in both. Product decision on exact paths still needed (Design Debt D4). |
| 6 | Desktop has no sub-routes — both sections coexist on `/[locale]/` | Two-column layout makes separate routes unnecessary on wide viewports. |
| 7 | "Next week" / "This weekend" chip ranges evaluated server-side at render time | Avoids client-side date hydration mismatch; consistent with SSR. |
| 8 | `ShiftCardMy` shows address instead of `orgUnit.name` | Deliberate product distinction from discovery cards: when a volunteer is already booked, they need to know *where to go*, not which org unit. (Design node: `USHss`.) |
| 9 | Desktop "Your shifts" header has `yourShiftsSeeAll` only — no separate "Balance" link | Design only shows "See all" buttons matching mobile; "Balance" was a misread of the design. |
| 10 | Day strip on Discover shows future only (today → last shift); on MyShifts shows the full range — past and future (earliest booked shift → latest booked shift) | Discover is forward-looking (find shifts to join); MyShifts is a complete record — volunteers need to see both past and upcoming booked shifts. |
| 11 | Past shifts in MyShifts render as inactive `bg-muted` cards | Consistent with fully-booked card pattern on the event detail page; past shifts are read-only context. |


---

## Dependencies

| DEP | Ticket | What's needed |
|-----|--------|---------------|
| DEP-4 | [VOLI-710](https://holi.atlassian.net/browse/VOLI-710) | `Event` entity (`title`, `coverImageUrl`) on `ShiftInstance.master.event` — needed for event card variant |
| DEP-9 | [VOLI-709](https://holi.atlassian.net/browse/VOLI-709) | `ShiftInstance.filledCount` resolver — needed for `spotsLeft` calculation on each card |
| DEP-NEW | (create) | GraphQL query: volunteer's booked shift instances, ordered by `actualStartsAt`, filtered to future only |
| DEP-NEW | (create) | GraphQL query: available shift instances for discovery, with optional date-range and org-unit filter params |
| DEP-NEW | (create) | `checkIn(shiftInstanceId)` mutation — needed for AC 44 |
| DEP-NEW | (create) | `checkOut(shiftInstanceId)` mutation — needed for AC 45 |
| DEP-NEW | (create) | `ShiftInstance.isCheckedIn` (boolean) or `checkedInAt` (timestamp) field — needed to determine timer state (AC 43) |

---

## i18n Notes for Dev

- Namespace: `VolunteerHome` for all strings on this surface.
- Use `useTranslations('VolunteerHome')` in client components, `getTranslations('VolunteerHome')` in server components / `generateMetadata`.
- Day names in the day strip: `getFormatting().formatDate(date, options)` — never hardcoded.
- Date filter chip ranges: compute "next week" / "this weekend" bounds from `new Date()` server-side.
- Both `en.json` and `de.json` must always be in sync. German-first.
- Add the `VolunteerHome` blocks below after the `MyTime` key in each file.

### `en.json` — `VolunteerHome` block

```json
"VolunteerHome": {
  "greeting": "Hi, {firstName}!",
  "greetingFallback": "Welcome back!",
  "yourShiftsHeading": "Your shifts",
  "yourShiftsCount": "{n, plural, one {# shift} other {# shifts}}",
  "yourShiftsSeeAll": "See all",
  "yourShiftsEmpty": "You have no upcoming shifts.",
  "discoverHeading": "Discover",
  "discoverCta": "Discover shifts",
  "discoverEmpty": "No shifts match these filters",
  "discoverEmptyBody": "Try adjusting your filters, or check back later.",
  "filterNextWeek": "Next week",
  "filterThisWeekend": "This weekend",
  "weekly": "Weekly",
  "spotsLeft": "{n, plural, one {# spot left} other {# spots left}}",
  "fullyBooked": "Fully booked",
  "overlapWarning": "You have overlapping shifts in your schedule",
  "todayButton": "Today",
  "checkIn": "Check in",
  "checkOut": "Check out",
  "timerStartsIn": "starts in {time}",
  "timerStartedAgo": "Started {time} ago",
  "timerVolunteering": "You're volunteering for {time}"
}
```

### `de.json` — `VolunteerHome` block

```json
"VolunteerHome": {
  "greeting": "Hallo, {firstName}!",
  "greetingFallback": "Willkommen zurück!",
  "yourShiftsHeading": "Deine Schichten",
  "yourShiftsCount": "{n, plural, one {# Schicht} other {# Schichten}}",
  "yourShiftsSeeAll": "Alle anzeigen",
  "yourShiftsEmpty": "Du hast keine bevorstehenden Schichten.",
  "discoverHeading": "Entdecken",
  "discoverCta": "Schichten entdecken",
  "discoverEmpty": "Keine Schichten für diese Filter",
  "discoverEmptyBody": "Passe deine Filter an oder schau später nochmal vorbei.",
  "filterNextWeek": "Nächste Woche",
  "filterThisWeekend": "Dieses Wochenende",
  "weekly": "Wöchentlich",
  "spotsLeft": "{n, plural, one {# Platz frei} other {# Plätze frei}}",
  "fullyBooked": "Ausgebucht",
  "overlapWarning": "Du hast überschneidende Schichten in deinem Plan",
  "todayButton": "Heute",
  "checkIn": "Einchecken",
  "checkOut": "Auschecken",
  "timerStartsIn": "beginnt in {time}",
  "timerStartedAgo": "Gestartet vor {time}",
  "timerVolunteering": "Du hilfst seit {time}"
}
```
