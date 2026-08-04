# VOLI-952 — Membership lifecycle states in the profile

**Status:** Draft for review · **Date:** 2026-07-30 · **Branch:** `952-my-orgs`

## Links

- **Jira:** [VOLI-952](https://holi.atlassian.net/browse/VOLI-952) — `[S4] Your organization units`
- **Design file:** `.ai/design/design_files/volunteer-profile-memberships.pen`, frame **`S1 — Profile overview`** (node `3kytgo`), section **`Memberships Section`** (node `ngiqr8`).
- **Out of scope, separate tickets:** drill-in detail (VOLI-944), documents (VOLI-945), empty-state UX (VOLI-947).

## Goal

Show a volunteer's org-unit memberships and membership requests as one combined list in `/profile`, with each item showing its **real state** and the right lifecycle action. The user always knows where things stand and can withdraw a request or leave an accepted membership — and a declined org never silently vanishes (it stays visible in the list, read-only).

> ⚠️ **Ticket deviation (needs a VOLI-952 criteria update).** The ticket's acceptance criteria describe a `Left` state with a `Left · {date}` card reached via Leave. We are **dropping `Left` entirely** — Leave hard-deletes the membership and no card remains. This aligns the implementation with the design, which shows only three cards (Accepted, Requested, Declined) and never a Left card. The `StatusBadge/Left` component in the library stays unused.

> ⚠️ **Design deviation.** The S1 design's Declined card shows **Dismiss** + **Re-apply** actions. Both are cut (Re-apply not in this ticket; **Dismiss removed per owner decision** — we work only with the existing statuses). The implemented Declined card is **read-only**: it shows the `Declined · {date}` status with no actions.

## Scope

**In scope (this ticket):**
- The **Requested** and **Declined** state cards.
- The **Withdraw** and **Leave** actions + their mutations and lifecycle.
- Composing these with VOLI-942's Accepted cards into one list.

**Explicitly out of scope:** drill-in (944), documents (945), empty-state UX (947), **Re-apply** (cut — not in this ticket), **Dismiss** (removed — no new status), and **shift/event cleanup on Leave** (follow-up).

## State model

Two source tables merge into one list. The visible card states are exactly **three**:

| Card state | Source data | StatusBadge | Meta line | Date source | Action(s) |
|---|---|---|---|---|---|
| **Accepted** | `memberships` row (existence = accepted) | `Accepted` | `Joined · {date}` | `memberships.createdAt` | **Leave** (+ Open drill-in → 944) |
| **Requested** | `membership_requests` → `PENDING` | `Requested` | `Requested · {date}` | `membership_requests.createdAt` | **Withdraw** |
| **Declined** | `membership_requests` → `REJECTED` | `Declined` | `Declined · {date}` | `membership_requests.reviewedAt` | **none — read-only** |

**Not shown** (filtered out of the list):
- `membership_requests` → `ACCEPTED` — would duplicate the `memberships` row.
- `membership_requests` → `CANCELLED` — the post-Withdraw state.

**Domains kept separate:** org membership (`Membership` / `MembershipRequest`) is distinct from shift/event participation (`ShiftInvite` / `EventInvite` with `INVITED/SELF_JOINED/ACCEPTED/REJECTED/CANCELLED`). The shift-invite lifecycle (see `models/Invite-states.plantuml`) does **not** add card states here — those surface under "Your shifts." This list is membership-only.

## Recorded decisions

| Decision | Choice | Rationale |
|---|---|---|
| Leave persistence | **Hard-delete** the `memberships` row; no `Left` card | Matches the design (3 cards); simplest; re-joining starts fresh via `joinOrganization` |
| Dismiss action | **Removed** — declined requests have no Dismiss action | Owner decision: work with existing statuses only (`PENDING/ACCEPTED/REJECTED/CANCELLED`); declined cards stay visible read-only until re-application (out of scope) |
| Withdraw persistence | **Reuse** `cancelMembershipRequest` → `CANCELLED`, filtered from list | Reuses existing mutation; ticket mandates reuse |
| List composition | **RSC merges two queries** | Fits RSC-first convention; reuses 942's query untouched; keeps the 942/952 seam clean |
| Re-apply | **Cut** | Not in the ticket's three actions |
| Leave + future shifts | **Follow-up** | Leave only deletes membership; orphan shift invites noted as risk |

## Backend changes

### Schema
- **No changes.** We work entirely with the existing `MembershipRequestStatus` values (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`): Withdraw reuses `CANCELLED`, Leave hard-deletes the membership, and there is no Dismiss action. No enum additions and no migration.

### Query filter
- `myMembershipRequests` must return only `PENDING` + `REJECTED`. Exclude `ACCEPTED` (duplicates the membership) and `CANCELLED` (post-Withdraw). (Update the existing query/hook in `packages/data/src/repositories/membershipRequest/membershipRequest.graphql` and `use-membership-request.ts` so the profile list is correct.)

### New mutations
Add to the membership-lifecycle resolver (`apps/backend/src/membership-lifecycle/membership-lifecycle-mutation.resolver.ts`):

- **`leaveMembership(id: ID!): Boolean!`** — deletes the `memberships` row owned by the current user. Self-scoped (the member themselves; no `VOLUNTEER_EDIT` permission).

### Withdraw (no new mutation)
- **Withdraw** calls the existing `cancelMembershipRequest` (`membership-lifecycle-mutation.resolver.ts:84-96`) → `CANCELLED`.

### Notes & risks
- **Unique constraint:** `membership_requests` has a unique `(userId, orgUnitId)` constraint. A `REJECTED`/`CANCELLED` row occupies that slot and blocks re-application until removed. With no Dismiss, a `REJECTED` row stays until re-application is built — tracked in **[VOLI-968](https://holi.atlassian.net/browse/VOLI-968)**.
- **Orphan shifts (follow-up):** leaving does not touch the volunteer's `ShiftInvite`/`EventInvite` rows for future shifts in that org; those `ACCEPTED`/`SELF_JOINED` invites persist pointing at a non-member. Tracked in **[VOLI-969](https://holi.atlassian.net/browse/VOLI-969)**; this ticket does membership only.

## Frontend changes

### List composition (server component)
The profile page (`apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx`) already fetches `data.membershipRequest.findMine()`. Extend it to merge with 942's accepted memberships into one list of a discriminated type:

```ts
type MembershipEntry =
  | { state: 'accepted';  membership: …; role?: …;   date: Date }
  | { state: 'requested'; request: …;                date: Date }
  | { state: 'declined';  request: …;                date: Date };
```

**Sort:** Accepted → Requested → Declined, then by `date` descending within each group (matches the S1 design ordering).

### Card component
- One **`MembershipCard`** renders each entry; its `StatusBadge`, meta line, and actions switch on `state`. The **Declined** variant renders status + meta only, with **no action buttons**.
- **Replaces** the transitional block in `profile/page.tsx` (lines ~47–56) and the components under `apps/frontend/src/domain/membership-requests/components/` (`my-membership-requests.tsx`, `my-membership-request-card.tsx`). The existing `cancel-membership-request-button.tsx` becomes the **Withdraw** island.
- `StatusBadge` variants already exist for Accepted/Pending/Rejected in the design; map `PENDING`→Requested, `REJECTED`→Declined.

### Actions (island client components + `revalidatePath`)
Each destructive action is a small client component (matching the existing cancel button pattern) that opens a confirmation dialog, calls its mutation, then `revalidatePath('/profile')`:

- **Withdraw** → confirm → `cancelMembershipRequest` → revalidate.
- **Leave** → confirm (destructive styling) → `leaveMembership` → revalidate.

(No Dismiss action; the Declined card is read-only.)

### Confirmation & error handling
- **Both actions require a confirmation dialog** before any state change, cancelable. Reuse the existing confirm/`DeleteAlertDialog` pattern.
- **On failure:** card state unchanged + an error toast. No silent removal (ticket requirement).

## Internationalization

New translation keys (namespace `MembershipRequest` / `Profile`):
- Status labels: `Requested`, `Declined`.
- Meta lines: `Requested · {date}`, `Declined · {date}` (reuse `Joined · {date}` from 942 for Accepted).
- Actions: `Withdraw`, `Leave`.
- Confirmation dialogs: title + body for Withdraw and Leave.

## Testing

- **Withdraw:** confirming cancels the request and the card leaves the list; cancelling the dialog changes nothing; a failed call leaves the card + shows an error.
- **Leave:** confirming deletes the membership and the card leaves the list (no Left card); cancel does nothing; failure leaves the card + error.
- **Declined (read-only):** a `REJECTED` request renders the Declined card with no actions and stays in the list (no Dismiss).
- **List filter:** `myMembershipRequests` excludes `ACCEPTED`, `CANCELLED` (no duplicates, no post-Withdraw residue); `REJECTED` is shown.
- **Sort:** Accepted → Requested → Declined, date desc within group.

## Follow-ups / open items

1. **Update VOLI-952 acceptance criteria** to drop the `Left` state / `Left · {date}` card **and** the Dismiss action + its criterion.
2. **Orphan shifts on Leave** — **[VOLI-969](https://holi.atlassian.net/browse/VOLI-969)**, to cancel/release the leaving volunteer's future `ShiftInvite`/`EventInvite` in that org.
3. **Re-application / Declined lifecycle** — **[VOLI-968](https://holi.atlassian.net/browse/VOLI-968)**, not in this ticket; revisit the `(userId, orgUnitId)` unique-constraint behaviour and what (if anything) retires a `REJECTED` row when re-application is built.
