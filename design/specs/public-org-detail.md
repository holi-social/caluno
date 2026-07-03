# Spec: `public-org-detail` — Public Org Detail Page

**Slug:** `public-org-detail`
**Status:** ready for dev
**Ticket:** [VOLI-617](https://holi.atlassian.net/browse/VOLI-617) · sub-task of [VOLI-526](https://holi.atlassian.net/browse/VOLI-526)
**Design file:** `design/design_files/public-detail-pages.pen`
**Design nodes:** `YZNTF` (mobile), `FvfQM` (desktop)
**Context:** `design/public-org-detail-context.md`
**Translations:** `design/public-org-detail-translations.md`
**Route:** `/[locale]/orgs/[orgId]` (public, no auth required)

---

## Problem

Clippy has no public-facing org profile page. Two use cases are blocked:

- **Coordinators** need a shareable link that describes their org and lists its upcoming events and shifts — a lightweight recruitment artifact they can post in newsletters, Slack, or flyers.
- **Volunteers** arriving via event or shift detail page org bylines currently have no destination. VOLI-622 (event detail) already references this route in AC 22; the page must exist before event detail ships.

The org profile also acts as the entry point for membership requests, which is a prerequisite for volunteers to be invited to shifts in access-gated orgs.

---

## User Stories

**Volunteer — First-Timer**
- I land on a shared org link and see what the org does, where it operates, and how many volunteers are involved — without logging in.
- I can browse upcoming events and shifts to judge whether this org fits my schedule.
- I can request membership in one tap so a coordinator can later invite me to specific shifts.

**Volunteer — Regular**
- I arrive from an event detail org byline and confirm this is the org I want before requesting membership.

**Coordinator**
- The org page works as a standalone promo artifact: cover image, About us text, and upcoming events/shifts visible without auth.

---

## Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Hero Variant B — full-bleed cover image + scrim + frosted-glass floating nav | Same pattern as VOLI-616 and VOLI-622. Principle 6 — Same job, same shape. |
| 2 | Join CTA is "Request membership", not instant join | All orgs require coordinator approval. Matches Org A compliance model. |
| 3 | Floating nav uses `backdrop-filter: blur(4px)` + `bg-background/70` | `#f2f3f0b3` in craft is the precise frosted-glass value; tokenized for DS compliance. Same decision as VOLI-622 Decision 4. |
| 4 | Events section appears before standalone shifts | Events are higher-engagement; volunteers scan events first. |
| 5 | Events section and standalone shifts section hidden when empty | Intentional product behavior — no empty-state designed or required. |
| 6 | Logo chip shows initials when `logoUrl` is null | Derived from first letter of each word in `OrgUnit.name`, max 2 chars. |
| 7 | `OrgUnit.address` is a single free-text field displayed on two lines | Wrap at `\n` for display. No structured address model. Same as `Event.location` in VOLI-622. |
| 8 | No-cover-image state uses `bg-muted` hero fallback | Not designed; minimal viable fallback. Design Debt D1. |
| 10 | Pending join state: button goes inactive with updated label and note | After `requestMembership` succeeds, the join button becomes disabled, label changes to `OrgDetail.joinPendingCta`, subline changes to `OrgDetail.joinPendingNote`. |

---

## Scope Boundary

**In scope:**
- Public org detail page at `/[locale]/orgs/[orgId]` — mobile and desktop layouts.
- Hero with org identity (name, tagline, logo chip, cover image).
- Action section: address, stats (member count + open shifts), join CTA.
- About us section.
- Events list with event cards linking to `/[locale]/events/[eventId]`.
- Standalone shifts list with shift cards linking to `/[locale]/shifts/[shiftId]`.
- `OrgDetail` namespace in `en.json` and `de.json`.

**Out of scope:**
- Membership management UI (coordinator side).
- Approved / rejected membership states.
- Org editing or creation UI.
- Any backoffice view of the org.
- Pagination or "show more" for events or shifts lists.
- Tab bar.

---

## Acceptance Criteria

### Page — Core

1. `GET /[locale]/orgs/[orgId]` renders server-side for unauthenticated users. The page is publicly accessible with no session required.
2. If `orgId` does not exist, the route returns 404 and shows the standard not-found page.
3. Cover image renders as full-bleed hero (mobile: 240px tall; desktop: 300px tall). When `OrgUnit.coverImageUrl` is null, the hero slot shows `bg-muted` — no broken image. *(Design Debt D1.)*

### Hero

4. A linear scrim gradient overlays the hero bottom-anchored: `#09090b00` at top → `#09090bf0` at bottom, full hero width. The org identity block sits above the scrim, pinned to the bottom of the hero frame (padding `[0, 16, 24, 16]`).
5. Logo chip: 48×48px on mobile / 40×40px on desktop, `$card` fill, cornerRadius 12 (mobile) / 8 (desktop). When `OrgUnit.logoUrl` is set display the image; when null display initials — first letter of each word in `OrgUnit.name`, max 2 chars, 18px bold `$foreground` (mobile) / 14px bold (desktop).
6. Org name: `OrgUnit.name`, 27px bold `$primary-foreground`, below logo chip, gap 4px.
7. Tagline: `OrgUnit.tagline`, 16px medium `$primary-foreground`, directly below org name, gap 4px.

### Floating header (mobile) / Desktop nav

8. Mobile: A floating header is absolutely positioned at `y: 54` (below status bar), full width, `#f2f3f0b3` fill, `backdrop-filter: blur(4px)`. Left: back button (44×44px, cornerRadius 8, `aria-label={Common.back}`). Right: `Cobranding/small` — org logo 32×32 + 1px `$border` divider + Clippy platform mark.
9. Desktop: Full-width nav bar, 64px height, same `#f2f3f0b3` fill and `backdrop-filter: blur(4px)`, 80px horizontal padding. Left: `arrow-left` icon (20px) + `Common.back` label. Right: `Cobranding/small`.
10. The floating header / nav appears first in DOM (positioned absolute) so keyboard focus reaches Back before page content.
11. Back button returns to the previous page (`router.back()`).

### Action section (mobile) / OrgCard (desktop right column)

12. Address row: `map-pin` icon (20px `$foreground` mobile / 16px `$muted-foreground` desktop) + two-line address — line 1: street (16px 500 `$foreground`), line 2: city/district (14px normal `$muted-foreground`) — + `chevron-right` (20px `$muted-foreground`, mobile only). `OrgUnit.address` is wrapped at `\n` for the two-line display. On mobile the row is tappable and opens the device maps app with the org address; on desktop the chevron is omitted.
13. Stats: `users` icon + `OrgDetail.memberCount` · `calendar-check` icon + `OrgDetail.openShiftsCount`. On mobile these render as a single line `{memberCount} · {openShiftsCount}` (16px normal `$foreground`, icon 20px). On desktop they render as two separate chips (icon 16px `$muted-foreground`, text 16px normal `$muted-foreground`).
14. Join button: `Button(variant="default", size="lg")`, full-width, `user-plus` icon (20px), label `OrgDetail.joinCta`. On desktop inside OrgCard: cornerRadius 8, height 44px (same `$primary` fill).
15. Join note: `OrgDetail.joinNote` below the join button, 14px `$muted-foreground`, centered.
16. Unauthenticated click on join button → redirect to `/[locale]/auth/login?callbackUrl=/[locale]/orgs/[orgId]`. After login the join action fires automatically.
17. Authenticated click → API call to `requestMembership(orgUnitId)`. On success the join button becomes inactive (`disabled`, `variant="outline"`), its label changes to `OrgDetail.joinPendingCta` ("You requested to join"), and the subline below changes to `OrgDetail.joinPendingNote` ("Someone in the organisation will see your request soon"). This state persists on page reload (query `OrgUnit.hasPendingRequest` boolean on the current user).

### About us section

18. Section heading: `OrgDetail.aboutHeading`, 20px 600 `$foreground`. Body: `OrgUnit.description`, 18px normal `$foreground`, lineHeight 1.55. When `OrgUnit.description` is null or empty the entire section is hidden — no empty heading.
19. On mobile the About section renders after the Action section and before Events (gap: 24px with separator between sections). On desktop it renders in the right column below the OrgCard (gap: 32px).

### Events section

20. Section heading: `OrgDetail.eventsHeading`, 20px 600 `$foreground`. On desktop only, show `OrgDetail.eventsCount` right-aligned next to the heading, 14px 500 `$muted-foreground`.
21. Event cards: `$card` fill, `$border` stroke, cornerRadius 12, padding 14, gap 12, full-width. Layout: body column (fill) + `chevron-right` icon (20px `$muted-foreground`). Tapping navigates to `/[locale]/events/[eventId]`.
22. Event card body (gap 4, top to bottom):
    - Eyebrow: `getFormatting().formatRange(event.startDate, event.endDate)` (mobile: append ` · {event.location}`; desktop: date range only). 16px normal `$muted-foreground`.
    - Title: `event.title`, 18px 600 `$foreground`, lineHeight 1.56.
    - Meta row: `layers` icon (16px `$muted-foreground`) + `OrgDetail.eventMeta` with `{shifts}=event.shiftCount` and `{spots}=event.spotsLeft`, 14px 500 `$muted-foreground`.
23. When the org has no events the Events section is hidden entirely.

### Individual shifts section

24. Section has a heading group (gap 4): `OrgDetail.shiftsHeading` (20px 600 `$foreground`) + `OrgDetail.shiftsSub` (14px normal `$muted-foreground`). On desktop only, show `OrgDetail.shiftsCount` right-aligned next to the heading, 14px 500 `$muted-foreground`.
25. Shift cards: same card style as event cards (AC 21). Layout: body column (fill) + `chevron-right`. Tapping navigates to `/[locale]/shifts/[shiftId]`.
26. Shift card body (gap 4, top to bottom):
    - Eyebrow: abbreviated day + date + `·` + time range via `getFormatting().formatDateTime(shift.date, shift.startTime, shift.endTime)`. 16px normal `$muted-foreground`.
    - Title: `shift.title`, 18px 600 `$foreground`, lineHeight 1.56.
    - Meta row: `users` icon (16px `$muted-foreground`) + `OrgDetail.spotsFree` with `{n}=shift.spotsLeft`, 14px 500 `$muted-foreground`.
27. When the org has no standalone shifts the Individual shifts section is hidden.

### Desktop layout

28. Desktop body: two-column layout — left 680px (Events + separator + Individual shifts), right 392px (OrgCard + About us), gap 48px, 80px horizontal padding, `padding-top: 48px`, `padding-bottom: 64px`.
29. OrgCard (right column, top): `$card` fill, `$border` stroke, cornerRadius 12, padding 24, gap 16. Contains top-to-bottom: StatsRow, AddressRow, 1px `$border` separator, join button, join note.
30. Desktop left column sections separated by 1px `$border` separator between Events and Individual shifts. Section headings rendered as a `justifyContent: space-between` row with the count label right-aligned.

### i18n

31. All UI strings use `useTranslations('OrgDetail')` (client) or `getTranslations('OrgDetail')` (server). No hardcoded English or German strings in component code.
32. `en.json` and `de.json` contain the full `OrgDetail` namespace as specified in `design/public-org-detail-translations.md`. Add after the `EventDetail` key.
33. Date ranges: `getFormatting().formatRange(event.startDate, event.endDate)` — never hardcoded or manually constructed.

### Accessibility

34. Page `<title>` is `{OrgUnit.name} — Clippy` (via `generateMetadata`).
35. Hero org name and tagline have contrast ≥ 7:1 against the scrim at the bottom of the hero. The scrim must reach at least `rgba(9,9,11,0.94)` at the bottom where text sits.
36. Floating header/nav appears first in DOM so keyboard focus reaches Back before page content.
37. Join button is a semantic `<button>`. After request is sent: `aria-disabled="true"`. Back button on mobile: `aria-label={t('Common.back')}` (icon only, no visible label on mobile).
38. Event and shift cards are `<a>` elements linking to their respective detail pages.

---

## Design Assets

- **Design file:** `design/design_files/public-detail-pages.pen`
  - `YZNTF` — Mobile craft frame (Orgdetails — B)
  - `FvfQM` — Desktop craft frame (Organisationsdetails — B · Desktop)
- **Components from `@repo/ui`:**
  - `Button` (`default` variant, `lg` size) — Join CTA
  - `Cobranding/small` — floating header / desktop nav right side

---

## Discussion Artifacts

- **VOLI-526** — parent solution, full discovery scope.
- **VOLI-616** — public shift detail (sibling) — shift cards on this page link there.
- **VOLI-622** — public event detail (sibling) — event cards link there; event detail AC 22 links back to this page from org byline.

---

## Design Debt

| # | Item | Gate | Priority |
|---|------|------|----------|
| D1 | No-cover-image hero fallback — `bg-muted` only; no illustration or org accent-color variant designed | Gate 4 | Medium |

---

## Dependencies

| DEP | Ticket | What's needed |
|-----|--------|---------------|
| DEP-1 | (create) | Public `GET /orgs/[orgId]` GraphQL query in `@repo/data` — returns `OrgUnit` with: name, tagline, coverImageUrl, logoUrl, address, description, memberCount, openShiftsCount, events[], standaloneShifts[] |
| DEP-2 | (create) | `OrgUnit.tagline` field — new if not yet on the model |
| DEP-3 | (create) | `OrgUnit.memberCount` resolver — count of enrolled volunteers |
| DEP-4 | (create) | `OrgUnit.openShiftsCount` resolver — count of available future ShiftInstances belonging to this org |
| DEP-5 | (create) | `OrgUnit.standaloneShifts` resolver — ShiftInstances not linked to any Event |
| DEP-6 | (create) | `requestMembership(orgUnitId: ID!)` mutation — creates a pending membership request for the authenticated user |
| DEP-7 | (create) | `OrgUnit.hasPendingRequest` boolean — true when the authenticated user has a pending membership request for this org; returned by the page query so the button renders in pending state on reload |

---

## i18n Notes for Dev

- Namespace: `OrgDetail`. Use `getTranslations('OrgDetail')` (server) / `useTranslations('OrgDetail')` (client).
- Mobile stats line: concatenate `t('memberCount', { n })` + ` · ` + `t('openShiftsCount', { n })` in component code — no separate combined i18n key.
- Never build date/time strings manually — use `getFormatting().formatRange()` and `getFormatting().formatDateTime()`.
- Add `OrgDetail` blocks to both message files after `EventDetail`. Keep both locales in sync.

### `en.json` — `OrgDetail` block

```json
"OrgDetail": {
  "joinCta": "Request membership",
  "joinNote": "A coordinator will confirm your request.",
  "joinPendingCta": "You requested to join",
  "joinPendingNote": "Someone in the organisation will see your request soon",
  "aboutHeading": "About us",
  "eventsHeading": "Events",
  "eventsCount": "{n, plural, one {# event} other {# events}}",
  "eventMeta": "{shifts, plural, one {# shift} other {# shifts}} · {spots, plural, one {# spot free} other {# spots free}}",
  "shiftsHeading": "Individual shifts",
  "shiftsSub": "Not part of an event",
  "shiftsCount": "{n, plural, one {# shift} other {# shifts}}",
  "memberCount": "{n, plural, one {# member} other {# members}}",
  "openShiftsCount": "{n, plural, one {# open shift} other {# open shifts}}",
  "spotsFree": "{n, plural, one {# spot free} other {# spots free}}"
}
```

### `de.json` — `OrgDetail` block

```json
"OrgDetail": {
  "joinCta": "Mitgliedschaft beantragen",
  "joinNote": "Ein Koordinator bestätigt deine Anfrage.",
  "joinPendingCta": "Anfrage gestellt",
  "joinPendingNote": "Jemand aus der Organisation wird deine Anfrage bald sehen.",
  "aboutHeading": "Über uns",
  "eventsHeading": "Events",
  "eventsCount": "{n, plural, one {# Event} other {# Events}}",
  "eventMeta": "{shifts, plural, one {# Schicht} other {# Schichten}} · {spots, plural, one {# Platz frei} other {# Plätze frei}}",
  "shiftsHeading": "Einzelne Schichten",
  "shiftsSub": "Nicht Teil eines Events",
  "shiftsCount": "{n, plural, one {# Schicht} other {# Schichten}}",
  "memberCount": "{n, plural, one {# Mitglied} other {# Mitglieder}}",
  "openShiftsCount": "{n, plural, one {# offene Schicht} other {# offene Schichten}}",
  "spotsFree": "{n, plural, one {# Platz frei} other {# Plätze frei}}"
}
```
