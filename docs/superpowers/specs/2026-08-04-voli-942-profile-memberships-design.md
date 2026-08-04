# Volunteer profile — memberships (VOLI-942)

**Date:** 2026-08-04
**Jira:** VOLI-942 — [S1] Accepted membership cards (read-only)
**Branch:** `952-my-orgs`
**Design ref:** `.ai/design/design_files/volunteer-profile-memberships.pen` (S1) + `.ai/design/specs/volunteer-profile-memberships-context.md`

## Summary

On the volunteer profile, fetch the current user's **org-unit memberships** and merge them with their existing **membership requests** into one unified list of cards. Accepted memberships are rendered as a distinct card (org avatar/name, **Accepted** badge, role, `Joined · {date}`, and a **Leave** button).

This implements VOLI-942 (accepted cards) and, per the task brief, additionally:

- merges accepted memberships into the same list as the existing requested/declined request cards, and
- adds a working **Leave** action to accepted cards.

Leave was chosen to be included because all of its infrastructure (the `leaveMembership` mutation, the `@repo/data` `LeaveMembership` op + repo method, and the `LeaveMembershipButton` component) already exists.

## Scope decision: memberships are the source of truth

**Memberships are the master record for the accepted state.** The membership-request row is **not** trusted to decide whether someone is a member — some members may exist without a corresponding `ACCEPTED` membership request. Therefore:

- Every row in `memberships` becomes an **accepted** card.
- **`ACCEPTED` membership requests are ignored entirely** (never read, never reconciled against memberships).
- `CANCELLED` requests are hidden (as today).
- As a defensive dedup, if a membership exists for an org unit, any `PENDING`/`REJECTED` request for that same unit is suppressed (the accepted card wins). This is a data-anomaly guard; normally a member has no open request for a unit they already belong to.

## Data model & merge algorithm

The merge happens in the frontend (`buildMembershipEntries`), extending the existing pattern. The backend only adds a read query; it does **not** own the merge.

Inputs:

- `memberships` — current user's memberships (`id`, `createdAt`, `roles[]`, `organizationUnit`)
- `requests` — current user's membership requests (as today)

Algorithm (memberships = master):

```
entries = []
memberOrgUnitIds = Set()
for m of memberships:                      // master first
  push accepted entry { id: m.id, date: m.createdAt, roles: roleNames(m), orgUnit, organizationName }
  memberOrgUnitIds.add(m.organizationUnit.id)
for r of requests:
  if r.status in (ACCEPTED, CANCELLED): continue        // ignore entirely
  if memberOrgUnitIds.has(r.organizationUnit.id): continue   // dedup, membership wins
  if r.status == PENDING:  push requested entry
  if r.status == REJECTED: push declined entry
sort: accepted(0) → requested(1) → declined(2); within a group, newest date first
```

Defaults (confirmable at review):

- **Role display:** join all role names on the membership (e.g. `Member`, `Member, Coordinator`). Omit the role line entirely when the membership has no roles (VOLI-942 AC). Internal roles (e.g. the default member role) are included — showing `Member` is the intended baseline.
- **List order:** accepted, then requested, then declined; newest first within each group (matches the design S1 ordering).

## Backend changes

### 1. Expose `createdAt` on the `Membership` model

`apps/backend/src/membership/models/membership.model.ts` — add:

```ts
@Field(() => Date)
createdAt!: Date;
```

The `MembershipEntity` already has `createdAt`; `BaseMapper` uses `plainToInstance({ excludeExtraneousValues: false })`, so it auto-maps with no mapper change.

### 2. Add `getMyMemberships(userId)` to `MembershipService`

`apps/backend/src/membership/membership.service.ts` — mirror `getMemberships`, scoped to the user:

```ts
async getMyMemberships(userId: string): Promise<MembershipEntity[]> {
  return this.db.query.memberships.findMany({
    where: { userId },
    with: {
      organizationUnit: true,
      roles: { with: { role: true } },
    },
  });
}
```

`roles` must be eager-loaded — `MembershipFieldResolver.roles` reads `membership.roles` (the join rows) to resolve `[Role]`. The nested `organization` / `type` / `parent` fields on `OrganizationUnit` are resolved by their own field resolvers (the same ones that make `GetMyMembershipRequests` work), so loading `organizationUnit` is sufficient.

### 3. Add `myMemberships` query

`apps/backend/src/membership/resolvers/membership-query.resolver.ts`:

```ts
@Permissions(PERMISSIONS.VOLUNTEER_VIEW)
@Query(() => [Membership])
async myMemberships(@Session() session: UserSession): Promise<Membership[]> {
  const memberships = await this.membershipService.getMyMemberships(session.user.id);
  return this.membershipMapper.toArray(memberships);
}
```

`VOLUNTEER_VIEW` matches the existing `memberships` query. A plain list (`[Membership]`, no pagination) is consistent with the existing `memberships` query and appropriate for a user's own memberships.

No DB migration — no schema change, only a new read path.

## `@repo/data` changes

### 4. New GraphQL operation

`packages/data/src/repositories/membership/membership.graphql` — add (mirrors the orgUnit fragment already used by `GetMyMembershipRequests`):

```graphql
query MyMemberships {
  myMemberships {
    id
    createdAt
    organizationUnit {
      id
      name
      logoUrl
      type { icon }
      parent { id }
      organization { name }
    }
    roles { id name }
  }
}
```

### 5. Repository method

`packages/data/src/repositories/membership/membership.repository.ts`:

```ts
async findMine() {
  const data = await this.sdk.MyMemberships();
  return data.myMemberships;
}
```

`data.membership` is already registered on the `DataClient`, so no client change.

### 6. Regenerate types

Run `./packages/data/node_modules/.bin/graphql-codegen` from `packages/data` (per `CLAUDE.local.md`, `bun run codegen` is broken in this env) so `MyMemberships`, `MyMembershipsQuery`, and the SDK method are generated.

## Frontend changes

### 7. Extend the `MembershipEntry` type

`apps/frontend/src/domain/memberships/types.ts` — add the accepted variant (replacing the `// VOLI-942 will add` TODO):

```ts
| {
    state: 'accepted';
    id: string;            // membership id — used by Leave
    organizationName: string;
    orgUnit: MembershipCardOrgUnit;
    roles: string[];       // role names; empty array → role line omitted
    date: Date;            // memberships.createdAt
  }
```

### 8. Extend `buildMembershipEntries`

`apps/frontend/src/domain/memberships/lib/entries.ts`:

- Change signature to `buildMembershipEntries(requests, memberships)`.
- Add a `MyMembershipItem` input type (id, createdAt, roles `{ id, name }[]`, organizationUnit).
- Implement the merge algorithm above (memberships master, `ACCEPTED`/`CANCELLED` ignored, dedup by org unit).
- Update `STATE_ORDER` to `{ accepted: 0, requested: 1, declined: 2 }`.

### 9. `MembershipCard` — accepted rendering

`apps/frontend/src/domain/memberships/components/membership-card.tsx` — add an accepted branch:

- Role line: when `entry.state === 'accepted'` and `entry.roles.length > 0`, render a muted `text-sm` line with the joined role names. Omit when empty.
- Date line: `Joined · {formatted createdAt}` via a new `meta.joinedDate` key (same formatter/day-month-year style as today).
- Action: render the existing `<LeaveMembershipButton membershipId={entry.id} orgName={organizationName} />` (left-aligned, matching the existing `WithdrawMembershipButton` placement).

### 10. `MembershipStatusBadge` — accepted variant

`apps/frontend/src/domain/memberships/components/membership-status-badge.tsx`:

- `VARIANT`: add `accepted: 'success'` (green; the `success` Badge variant exists).
- `LABEL_KEY`: add `accepted: 'status.accepted'`.

### 11. Profile page wiring

`apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx`:

```ts
const [requestPage, memberships] = await Promise.all([
  data.membershipRequest.findMine(),  // → paginated { items }
  data.membership.findMine(),         // → Membership[] (plain array, step 5)
]);
const membershipEntries = buildMembershipEntries(
  requestPage.items,
  memberships,
);
```

(Fetch in parallel. The request repo returns a paginated wrapper; the membership repo returns the plain array — note the difference when destructuring.)

## i18n

Add to the `MembershipRequest` namespace (EN + DE, matching existing keys):

- `status.accepted` — EN `Accepted`, DE `Akzeptiert`
- `meta.joinedDate` — EN `Joined · {date}`, DE `Beigetreten · {date}`

`actions.leave`, `dialog.leaveTitle`, `dialog.leaveDescription`, and the leave toasts already exist (used by `LeaveMembershipButton`).

## Acceptance criteria

- A volunteer with accepted memberships sees one **accepted** card per membership: org logo-or-initials, org name, green **Accepted** badge, role line (if any), and `Joined · {createdAt}` formatted e.g. `14 Jan 2024`.
- A membership with no roles omits the role line (no empty label).
- Accepted cards show a working **Leave** button that removes the membership and refreshes the list.
- A volunteer sees accepted cards **alongside** their existing requested/declined request cards in one list; ordering is accepted → requested → declined, newest first within a group.
- A member whose `ACCEPTED` membership request row is missing (or present) is shown identically — the membership row alone drives the accepted card.
- No duplicate card for a single org unit.

## Out of scope

- Drill-in to a membership detail view (VOLI-944).
- Requirement-profile / document rows on cards (VOLI-945).
- Edit-identity mode (VOLI-943).
- Empty-state UX for "no organizations" (VOLI-947) — the current "no cards" rendering remains.
- "Past" grouping for left/rejected (design open decision) — rejected cards keep their current dismiss-free rendering.
- Pagination of `myMemberships` (a plain list is returned).

## Testing approach

- **Backend:** unit test `MembershipService.getMyMemberships` returns only the user's memberships with roles loaded; resolver test for `myMemberships` mapping. Existing `leaveMembership` is already covered.
- **Frontend (unit):** `buildMembershipEntries` — cover (a) memberships-only → accepted entries with role/date; (b) memberships + pending/rejected requests → merged + ordered; (c) an `ACCEPTED` request present → ignored; (d) a request for an org unit that also has a membership → suppressed; (e) no roles → role line absent; (f) empty memberships → requested/declined only (regression of current behavior).
- **Component:** `MembershipCard` accepted variant renders badge (`success`), role line, `Joined` date, and `LeaveMembershipButton`; role line absent when `roles` empty.
- **Manual:** profile page shows merged list; Leave removes the card on refresh.
