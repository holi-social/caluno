# Spot-opened → auto-email the waitlist (VOLI-1260)

Date: 2026-09-10 · Ticket: [VOLI-1260](https://holi.atlassian.net/browse/VOLI-1260) (parent: VOLI-907 "Shift waiting list") · Status: design approved in chat, pending implementation plan

## Summary

When a seat frees on a live, capped shift instance with a non-empty waitlist, every waitlisted volunteer receives a "spot opened" email with a deep link to the shift. The seat goes to whoever claims first (first-come, first-served). The existing silent auto-promotion of the oldest waitlisted volunteer is removed. A waitlisted volunteer viewing a shift with a free spot sees a Join button instead of the waitlist-only state.

## Decisions (from brainstorm)

1. **Remove auto-promotion.** `promoteOldestWaitlisted` in `ShiftService` (auto-seating the oldest `WAITLIST_JOINED` invite when a seat frees) is deleted; its behavior and tests are replaced by broadcast + first-come-first-served.
2. **Trigger scope: single-instance paths only.** Volunteer cancel, admin reject/uninvite chip, and single-instance member-list removal notify. Multi-instance cascades — all-instances member removal, series-level cancel/reject, event-level uninvite — intentionally do **not** notify: they free a seat on every future instance, and volunteers waitlisted on a recurring series are waitlisted on each instance, so one action could email the same person N times. Instance/series cancellation sends no spot-opened email; waitlisted users already receive the standard "cancelled" notice (`WAITLIST_JOINED ∈ ACTIVE_SHIFT_INVITE_STATUSES`).
3. **Architecture: event + listener**, matching every other shift lifecycle email. (`shift-call-out.service` remains the documented exception — it needs synchronous per-recipient delivery records.)

## Backend

### Trigger helper — `notifyWaitlistOfOpenedSeat(instanceId, db?)` (private, ShiftService)

Emits `NotificationEvent.SHIFT_INSTANCE_WAITLIST_SPOT_OPENED` only when **all** hold:

- instance exists, `isCancelled: false`, master not deleted
- `actualStartsAt > now`
- seat available (`hasAvailableSeat` vs `overrideMaxVolunteers ?? master.maxVolunteers`)
- ≥ 1 invite with status `WAITLIST_JOINED`

Waitlists only form on full instances, so "seat available + waitlist non-empty" implies a seat just freed; over-calling the helper is a harmless no-op. One emit per operation → one email per waitlisted user per operation (removing 3 members in one save = one blast).

**Call sites (2):**

1. `updateShiftInstanceInviteStatus` — exactly where `promoteOldestWaitlisted` is called today: `freedSeat && targetStatus ∈ {VOLUNTEER_CANCELLED, ADMIN_REJECTED}`. (volunteer cancel, admin reject/uninvite chip)
2. `updateMembersForShiftInstance`, non-cascade branch — after commit, when ≥ 1 removed user had a `JOINED` invite (statuses are loaded pre-transaction).

### Claim path (first-come-first-served)

- `volunteerMayRequestInviteStatus` (`shared/invite-status.ts`): allow `WAITLIST_JOINED → JOINED` for self-requests. Admin-only targets stay blocked; the transition map already permits the edge.
- `joinShiftInstance`: a `WAITLIST_JOINED` existing invite no longer early-returns. Seat free → assert transition, update to `JOINED`, fire the existing joined-notification and PostHog join capture (source `waitlist_promote`). Full → return the unchanged invite (result resolves to `WaitlistJoined`; no error).
- `updateShiftInstanceInviteStatus`: self-requesting `JOINED` from `WAITLIST_JOINED` re-resolves by capacity — full ⇒ return the invite unchanged; seat free ⇒ proceeds through the normal `JOINED` flow (notification + PostHog captures).
- Approval shifts: a waitlisted volunteer on a `joinRequiresApproval` shift got there via admin-approval overflow; claiming goes straight to `JOINED` — no re-approval.
- Race: capacity is re-checked at claim time; two simultaneous claims for one seat resolve to one `JOINED` + one still-waitlisted. The residual DB-level race equals the existing fresh-join race — accepted (no new serialization).

### Event, listener, template

- `NotificationEvent.SHIFT_INSTANCE_WAITLIST_SPOT_OPENED = 'notification.shift-instance.waitlist-spot-opened'`; payload: `recipientUserIds`, `organizationUnitId`, `organizationUnitName`, `shiftId`, `shiftTitle`, `instanceId`, `startsAt`, `endsAt`, `shiftLocation` (same sources as the invited payload); entry in `notification-event-map.ts` + `payloads/`.
- `ShiftListener` handler → `notificationService.sendNotification` → per-recipient locale template.
- `templates/shift-instance-waitlist-spot-opened.template.ts`: subject "A spot opened up: {shiftTitle}" (de: "Ein Platz ist frei: {shiftTitle}"); detail rows for shift, date/time, organization; button "Claim your spot" (de: "Platz sichern") → `shiftPublicUrl(shiftId, instanceId)`; note: first-come-first-served, you stay on the waitlist if someone else claims first. en + de strings in the backend email i18n files.

## Frontend

**`join-shift-button.tsx`** — `WaitlistJoined` branch:

- `!isFull` → primary **Join** button wired to `handleReenter()` (already routes correctly: `joinShiftInstance` mutation for `AllMembers` shifts, `respondToInvite(Joined)` for invite-only). Lost race resolves back to `WaitlistJoined` with the existing `join.waitlistJoined` toast — honest, no error.
- `isFull` → current "Leave the waitlist" button.
- Icons (ticket "Additional" #1, replacing `ArrowRightIcon` on both): "Join the waitlist" → `ListPlusIcon`; "Leave the waitlist" → `ListXIcon`.

**`shift-action-card.tsx`:**

- Waitlist badge ("You're on the waitlist") and `waitlistNote` render only when `full`.
- Spot free: no badge; new note `waitlistSpotOpenNote` — "A spot just opened — join to claim it." (de equivalent). New en + de messages in `messages/{en,de}.json`.

No new GraphQL surface: `spotsLeft`/`myInviteStatus` already flow to the shift page.

## Data flow

seat frees (mutation) → helper guard → typed event → ShiftListener → per-locale template → EmailService → volunteer clicks → shift page (spot free → Join button) → claim mutation → capacity re-check → `JOINED`.

## Error handling

- Claim when full: no error thrown; invite returned unchanged; UI stays waitlisted (both mutation paths).
- Emails are fire-and-forget via the emitter (existing behavior); a failed send logs through the notification service and never fails the mutation.
- Helper no-ops silently on cancelled/past instances, deleted masters, and empty waitlists.

## Testing

Backend (existing suites: `shift.service.spec.ts`, `shift.integration.spec.ts`, `notification.spec.ts`, `invite-status.spec.ts`):

- volunteer cancel on a full instance with a waitlist → all waitlisted receive the spot-opened email; the oldest is **not** auto-joined
- admin chip reject/uninvite → same
- member-list removal (single instance) of a `JOINED` user → same; removal of non-`JOINED` users → no email
- empty waitlist, cancelled instance, and the cascade paths (series cancel, event uninvite, all-instances removal) → no spot-opened email
- claim via `joinShiftInstance`: seat free → `JOINED` + joined notification + PostHog source `waitlist_promote`; full → unchanged
- claim via `updateShiftInstanceInviteStatus`: same pair
- unit: `volunteerMayRequestInviteStatus(WAITLIST_JOINED → JOINED)` allowed for self
- replace the auto-promotion capture test (`shift.service.spec.ts` ~2252) and "forbids volunteer from skipping waitlist" (`shift.integration.spec.ts` ~3339) with the new-behavior tests

Frontend: browser verification against the dev server — waitlisted + full shows leave button + badge; waitlisted + spot free shows Join and no badge; claim transitions to joined; en/de copy renders.

## Out of scope

- Multi-instance cascade notifications (decision #2; VOLI-1260 AC amended to match)
- In-app notifications, digest bundling, per-user email throttling
- DB-level serialization for the claim race (consistent with existing join behavior)
