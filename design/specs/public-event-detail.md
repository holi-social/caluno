# Spec: `public-event-detail` — Public Event Detail Page

**Slug:** `public-event-detail`
**Status:** ready for dev
**Ticket:** [VOLI-622](https://holi.atlassian.net/browse/VOLI-622) · sub-task of [VOLI-526](https://holi.atlassian.net/browse/VOLI-526)
**Design file:** `design/design_files/public-detail-pages.pen`
**Design nodes:** `QXijI` (mobile list), `vKe81` (mobile calendar), `spjx0` (desktop)
**Context:** `design/public-event-detail-context.md`
**Translations:** `design/public-event-detail-translations.md`
**Route:** `/events/[eventId]` (public, no auth required)

---

## Problem

Clippy has no public-facing Event detail page. Two priority clients need this immediately:

- **Wellfare org** runs temporary summer events and needs a page they can use to build an event-level invitee list before shifts open. Without it, coordinators have no way to invite event-priority volunteers at scale.
- **Community hall org** uses the public page as its primary promotional vehicle to attract volunteers for festivals and community events. Without it, they cannot promote their events via a shareable URL.

The Event entity is also structurally distinct from a Shift — it has a date range, a cover image, its own invitee list, and multiple child shifts. A dedicated detail page is required to express this hierarchy clearly to the volunteer.

---

## User Stories

**Volunteer — First-Timer / Temporarily Engaged**
- I land on a public event URL and immediately understand what the event is, when and where it takes place, and which org is running it — without logging in.
- I can see which shifts are inside the event and how many spots are left, so I can decide whether to follow or sign up.
- I can "Follow" the event to get on the invitee list for shifts, without committing to a specific shift yet.
- On mobile I can toggle between a list and a calendar view of the event's shifts.

**Volunteer — Regular**
- I arrive via a coordinator's shared event link and can immediately judge whether new shifts match my availability.

**Coordinator — Event Planner (Wellfare)**
- The event page exposes enough signal (org name, shift count, dates) that sharing the link is a lightweight way to prime interested volunteers before formal invites go out.

**Coordinator — Community Hall**
- The page works as a standalone promotion artifact: cover image, event description, and shift availability are all visible without auth.

---

## Design Decisions

Tied to DESIGN.md named rules:

1. **Variant B hero** — full-bleed cover image, bottom-anchored gradient scrim, floating frosted-glass nav. Aligns with the public shift detail page (VOLI-616) hero pattern. *(Principle 6 — Same job, same shape.)*
2. **Two layouts** — mobile 393px vertical scroll; desktop 1280px two-column (shifts left, action + about right). No tablet breakpoint designed; dev to interpolate.
3. **Mobile: List/Calendar toggle** — Shifts section has two sub-states. List is default. Calendar shows a day-strip + per-day timeline, suited for multi-day events. *(Principle 2 — Two speeds, one system: volunteers on mobile need the fast path.)*
4. **Primary CTA is Follow** — `EventDetail.followCta` is a soft commitment: volunteer joins the event invitee list and will receive shift invitations. Motivational register confirmed. Individual shift signup remains on the shift detail page. *(Principle 4 — Plain over clever.)*
5. **Shift cards reuse existing pattern** — `$card` / `$border` / `cornerRadius: 12` matches the shift list on the volunteer home screen. A full/unavailable shift uses `$muted` fill.
6. **Org is shown via org byline** — title + org name below in hero, not a separate block. Org logo in mobile nav header for brand continuity.

---

## Scope Boundary

**In scope:**
- Public event detail page at `/events/[eventId]` — mobile and desktop layouts.
- Mobile: List and Calendar sub-states for the Shifts section.
- "Follow event" CTA → join the event invitee list (auth redirect if not logged in, then return).
- Shift list + shift cards linking to public shift detail pages.
- Cover image hero with frosted-glass nav.
- "About the event" section with event description.
- i18n: all strings translated (see translations file).
- `EventDetail` namespace in `en.json` and `de.json`.

**Out of scope:**
- Creating the Event entity in the backend.
- Event creation / editing UI (VOLI-602).
- Invitee list management UI (Reuse shift invitee management).
- "Show all shifts" deep-link destination (comes as a part of Volunteer discovery home).
- Org detail page (VOLI-617, separate ticket).

---

## Acceptance Criteria

### Page — Core

1. `GET /[locale]/events/[eventId]` renders server-side for unauthenticated users. The page is publicly accessible with no session required.
2. If `eventId` does not exist, the route returns 404 and shows the standard not-found page.
3. Cover image renders as full-bleed hero (mobile: 240px tall; desktop: 300px tall). When `event.coverImageUrl` is null, the hero shows the org-unit's accent color or a muted fallback — no broken image. *(See Design Debt: no-cover-image state not designed.)*
4. Event title, org unit name, date range, and location are visible without scrolling on mobile.
5. `%X% shifts · %Y% spots free` summary reads from live shift data (`Event.shiftCount`, sum of `ShiftInstance.spotsLeft` across all instances). When `spotsLeft = 0`, the label reads "{X} Schichten · Ausgebucht" (fully booked state).
6. "About the event" section shows `Event.description`. When description is null or empty, the section is hidden entirely — no empty heading.

### Follow CTA

7. CTA button (`EventDetail.followCta`) is rendered as a primary `Button` (`lg`, default variant) — **not** a custom frame. Icon: `bell-ring` from Lucide.
8. Unauthenticated click → redirect to `/[locale]/auth/login?callbackUrl=/[locale]/events/[eventId]`. After login the user returns to the event page and the follow action fires automatically.
9. Authenticated click → API call to follow the event. Button transitions to `EventDetail.followingCta` state (`Button/Secondary`). State persists on page reload.
10. The follow note beneath the CTA is always visible, independent of auth state.

### Shifts section — List view (mobile default + desktop left column)

11. Shift cards link to `/[locale]/shifts/[shiftId]` (public shift detail page, VOLI-616).
12. A shift card with `spotsLeft = 0` renders with `$muted` background fill and no clickable affordance (disabled state).
13. When the event has no shifts, the section shows an empty state: "Noch keine Schichten geplant." (no icon required).
14. The shift list on desktop shows a maximum of 4 cards; remaining cards are hidden behind "Alle Schichten anzeigen ›". See Design Debt for the destination decision.

### Shifts section — Calendar view (mobile toggle)

15. Calendar toggle is accessible as a segmented control (see Design Debt for component subtask).
16. Day strip shows one button per day in the event's date range (`startDate` to `endDate`). Selecting a day filters the timeline below to shifts on that day.
17. Days with no shifts are shown in the strip but disabled (no clickable affordance). Days with shifts show a shift count badge.
18. When the calendar view is active and no shifts exist on the selected day, shows "Keine Schichten an diesem Tag."

### Desktop layout

19. Desktop body uses a two-column layout: 680px left (shifts), 392px right (action card + about section), `48px` gap, `80px` horizontal padding.
20. The right-column action card shows: date range, location, shift/spot summary, and the Follow CTA. The card uses `$card` fill, `$border` stroke, `cornerRadius: 12`, `padding: 24`.

### Navigation

21. Back button in the floating nav returns to the previous page (`router.back()`). Label: "Zurück" (`Common.back`).
22. Org name in hero byline links to the public org detail page `/[locale]/orgs/[orgId]` (VOLI-617).
23. Floating nav uses CSS `backdrop-filter: blur(4px)` with `bg-background/70` token — **not** a hardcoded hex. *(Resolves Gate 1 flag.)*

### i18n

24. All UI strings use `useTranslations('EventDetail')` (client) or `getTranslations('EventDetail')` (server). No hardcoded English or German strings in component code.
25. `en.json` and `de.json` contain the full `EventDetail` namespace as specified in `design/public-event-detail-translations.md`. German is the product-primary language; English is the technical fallback.
26. Date range is formatted via `getFormatting().formatRange(startDate, endDate)` — never hardcoded or constructed manually.

### Accessibility

27. Page `<title>` is `{event.title} — Clippy` (via `generateMetadata`).
28. Hero title has contrast ≥ 7:1 against the scrim gradient at all scroll positions. The scrim gradient must reach at least `rgba(9,9,11,0.94)` opacity at the bottom where the title sits.
29. EventBadge in desktop hero uses `bg-primary-foreground/20` (token-bound) **not** `#ffffff20` (hardcoded). *(Resolves Gate 1 / Gate 2 flag.)*
30. Floating nav appears first in the DOM (positioned absolute) so keyboard focus reaches Back and Cobranding before page content.
31. The Follow CTA button is a semantic `<button>` element with `aria-pressed` toggling between Follow and Following states.
32. Shift cards are `<a>` elements linking to shift detail pages. Disabled (full) shift cards use `aria-disabled="true"` and `tabIndex={-1}`.
33. Calendar day strip uses `role="tablist"` with individual day buttons as `role="tab"` and `aria-selected`. Arrow keys navigate between days.

---

## Design Assets

- **Design file:** `design/design_files/public-detail-pages.pen`
  - `QXijI` — Mobile, List view (craft reference)
  - `vKe81` — Mobile, Calendar view
  - `spjx0` — Desktop
- **Components used from `@repo/ui`:**
  - `Button` (`packages/ui/src/components/base/button.tsx`) — Follow CTA (`lg`, `default` variant)
  - `TabBar/Volunteer` (`packages/ui/src/components/tab-bar.tsx`) — bottom nav (mobile, logged-in only)
  - `Cobranding/small` — mobile floating nav; `Cobranding/Big` — desktop nav
- **New component subtask — SegmentedControl** — see Dependencies

---

## Discussion Artifacts

- **VOLI-526** — parent solution, defines the full discovery scope.
- **VOLI-616** — public shift detail page (sibling, Design review) — hero pattern reference.
- **VOLI-617** — public org detail page (sibling, Design review) — org byline target.
- **VOLI-710, 711, 709** — backend DEP tasks for Event entity, FK, and filledCount.
- Intake Q2 answers (2026-06-26): Wellfare (invite-first), Community hall (promotion).

---

## Decision Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Follow CTA uses DS `Button/Default-lg` (green, primary), not custom frame | Custom frame in craft has no button semantics; primary green is correct weight for the sole CTA. |
| 2 | Mobile Calendar toggle implemented as `SegmentedControl` component (new) | No DS equivalent exists; Radix `Tabs` couples tablist to panels and needs overrides; purpose-built is cleaner. |
| 3 | EventBadge uses `bg-primary-foreground/20` token, not `#ffffff20` | Hardcoded hex fails contrast (Gate 2) and violates DS token rule. |
| 4 | Floating nav background uses CSS `backdrop-filter` + `bg-background/70` | Hardcoded `#f2f3f0b3` in craft is a precise frosted-glass value not expressible as a DS token; `backdrop-filter` achieves the same effect with semantic tokens. |
| 5 | Tab bar shown only when user is authenticated | Public page context: non-logged-in visitor should not see the volunteer app nav. Logged-in users see `TabBar/Volunteer`. |
| 6 | "Show all shifts" desktop link destination deferred | Product decision needed (expand in-page vs. navigate to filtered discovery). Logged as design debt. |
| 7 | `Event.location` is a single free-text field; design shows two address lines | Implementation wraps the field at `\n` for display. No structured address model introduced. |
| 8 | No-cover-image state uses `bg-muted` hero fallback | Not designed; minimal viable fallback that avoids broken image. Design debt for a richer fallback. |

---

## Design Debt

Items deferred from refine gates — not blocking dev, but must be resolved before the page reaches final polish.

| # | Item | Gate | Priority |
|---|------|------|----------|
| D1 | No-cover-image hero fallback — only a `bg-muted` fallback is specified; no illustration or org logo variant designed | Gate 4 | Medium |
| D2 | "Show all shifts" link destination — expand-in-page vs. navigate to filtered discovery; needs product decision | Gate 3 | High |
| D3 | Following state of the CTA (`EventDetail.followingCta`) — not designed; AC 9 specifies the behaviour but not the visual | Gate 4 | Medium |
| D4 | Past event state — no "Abgelaufen" or CTA-hidden design for events whose `endDate` is in the past | Gate 4 | Medium |
| ~~D5~~ | ~~CTA copy register~~ — **resolved**: motivational register confirmed. See `EventDetail.followCta` in translations. | Gate 7 | Closed |
| D6 | Calendar day strip scroll — no scroll behavior specified for events spanning 7+ days (day strip overflows) | Gate 4 | Medium |
| D7 | Empty description state — AC 6 hides the section; but no positive "no description" signal to coordinator (backoffice side) | Gate 4 | Low |
| D8 | Unauthenticated user viewing event page — tab bar visibility not designed; AC specifies "logged-in only" but no transition/prompt designed for logged-out state | Gate 4 | Medium |

---

## Dependencies

These tasks must be complete before dev can implement this spec:

| DEP | Ticket | What's needed |
|-----|--------|---------------|
| DEP-4 | [VOLI-710](https://holi.atlassian.net/browse/VOLI-710) | `Event` entity in backend (title, description, location, startDate, endDate, coverImageUrl, orgUnit FK) |
| DEP-5 | [VOLI-711](https://holi.atlassian.net/browse/VOLI-711) | `Shift → Event` foreign key so shifts can be queried by event |
| DEP-9 | [VOLI-709](https://holi.atlassian.net/browse/VOLI-709) | `ShiftInstance.filledCount` resolver — needed for `spotsLeft` calculation |
| DEP-NEW | (create) | `SegmentedControl` UI component in `@repo/ui` — for the List/Calendar toggle (mobile). Suggest shadcn `Tabs` as base with custom pill styling. |
| DEP-NEW | (create) | Public `GET /events/[eventId]` GraphQL query in `@repo/data` — must return all fields above. |

---

## i18n Notes for Dev

- Use namespace `EventDetail` for all strings on this page.
- **Never** hardcode strings — use `useTranslations('EventDetail')` (client components) or `getTranslations('EventDetail')` (server components / `generateMetadata`).
- Date range: `getFormatting().formatRange(event.startDate, event.endDate)` — do not build the range string manually.
- Shift/spot count: use ICU plural forms where needed (e.g., `{shifts, plural, one {# Schicht} other {# Schichten}}`).
- Add the `EventDetail` blocks below to **both** `apps/frontend/messages/en.json` and `apps/frontend/messages/de.json` (after the `MyTime` key).
- If copy changes during implementation, update **both** locales immediately — never leave one stale.

### `en.json` — `EventDetail` block

```json
"EventDetail": {
  "badge": "Event",
  "shiftsSummary": "{shifts} shifts · {spotsLeft} spots free",
  "shiftsSummaryFull": "{shifts} shifts · Fully booked",
  "followCta": "Step up to help",
  "followingCta": "You're helping ✓",
  "followNote": "Get invited to shifts, or sign up directly below.",
  "aboutHeading": "About the event",
  "shiftsHeading": "Shifts",
  "shiftsToggleList": "List",
  "shiftsToggleCalendar": "Calendar",
  "shiftsMeta": "{days} days · {occurrences} occurrences",
  "showAllShifts": "Show all shifts",
  "noShifts": "No shifts planned yet.",
  "noShiftsOnDay": "No shifts on this day.",
  "fullyBooked": "Fully booked",
  "spotsLeft": "{n, plural, one {# spot left} other {# spots left}}"
}
```

### `de.json` — `EventDetail` block

```json
"EventDetail": {
  "badge": "Veranstaltung",
  "shiftsSummary": "{shifts} Schichten · {spotsLeft} Plätze frei",
  "shiftsSummaryFull": "{shifts} Schichten · Ausgebucht",
  "followCta": "Jetzt mitmachen",
  "followingCta": "Du machst mit",
  "followNote": "Erhalte Einladungen zu Schichten oder melde dich direkt unten an.",
  "aboutHeading": "Über das Event",
  "shiftsHeading": "Schichten",
  "shiftsToggleList": "Liste",
  "shiftsToggleCalendar": "Kalender",
  "shiftsMeta": "{days} Tage · {occurrences} Termine",
  "showAllShifts": "Alle Schichten anzeigen",
  "noShifts": "Noch keine Schichten geplant.",
  "noShiftsOnDay": "Keine Schichten an diesem Tag.",
  "fullyBooked": "Ausgebucht",
  "spotsLeft": "{n, plural, one {# Platz frei} other {# Plätze frei}}"
}
```
