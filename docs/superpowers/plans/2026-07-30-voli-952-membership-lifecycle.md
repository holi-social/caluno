# VOLI-952 Membership Lifecycle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a volunteer's org-unit membership requests as per-state cards in `/profile` (Requested → Withdraw, Declined → read-only), and add a self-service Leave action that hard-deletes the user's own membership.

**Architecture:** Backend adds a self-scoped `leaveMembership` mutation (hard-delete) and restricts `myMembershipRequests` to `PENDING` + `REJECTED`; Withdraw reuses the existing `cancelMembershipRequest`. The NextJS profile server component maps the filtered requests into a discriminated `MembershipEntry` list and renders one `MembershipCard` variant per state; destructive actions are client islands (confirm dialog → mutation → `router.refresh()`). No new status, no migration.

**Tech Stack:** NestJS + GraphQL (code-first) + Drizzle ORM + Postgres · NextJS App Router + next-intl · `@repo/data` (graphql-request + graphql-codegen) · `@tanstack/react-query` · `@repo/ui` (shadcn).

## Global Constraints

- Use `bun` — never npm or yarn. Root scripts: `bun run dev`, `bun run lint`, `bun run check-types`, `bun run codegen`, `bun run db:up`.
- RSC-first: only add `'use client'` to the action-button islands. Cards and the page stay server components.
- Prefer `type` over `interface`; prefer ESM function syntax (`const x = () => {}`) except in `page.tsx`/`layout.tsx`. Avoid `as` casts.
- Use `<Link />` from next-intl/navigation, never `<a />`.
- Backend errors: throw `NotFoundGraphQLError` / `ForbiddenGraphQLError` from `src/graphql/errors` — never raw `Error`.
- Work only with the existing `MembershipRequestStatus` values (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`). **No enum additions, no DB migration.**
- Declined (`REJECTED`) card is read-only — no action buttons.
- Both actions (Withdraw, Leave) require a confirmation dialog before any state change; on failure the card is unchanged and an error toast shows.
- **Backend tests use the real DB** via the `bun:test` integration pattern in `apps/backend/test/organization.service.spec.ts` (`ensureTestDatabase`, `DatabaseModule`, `registerTestResourceCleanup`, and the `createUser` / `createOrganizationWithType` / `createUnit` / `addMembership` helpers it imports). Mirror that file's imports exactly.
- **No frontend test runner exists** (no vitest/jest/playwright). Frontend tasks verify with `bun run check-types`, `bun run lint`, and a manual dev-server check — not failing-test-first.
- **Prerequisite / seam:** VOLI-942 delivers the Accepted card + the `myAcceptedMemberships` query. This plan renders the **Requested** and **Declined** cards now and leaves an explicit seam (an optional `acceptedEntries` argument) so 942 plugs in without rework. The `LeaveMembershipButton` is built here and mounted by 942 on the Accepted card.

---

## File Structure

**Backend (create/modify):**
- Create: `apps/backend/test/membership.service.spec.ts` — integration tests for `leaveMembership` + the `getMyMembershipRequests` filter.
- Modify: `apps/backend/src/membership/membership.service.ts` — add `leaveMembership(id, userId)`; rewrite `getMyMembershipRequests` filter.
- Modify: `apps/backend/src/membership-lifecycle/membership-lifecycle-mutation.resolver.ts` — add `leaveMembership` resolver method.
- Regenerate: `apps/backend/src/schema.gql` (NestJS emits it) after the resolver lands.

**Data layer `@repo/data` (modify):**
- `packages/data/src/repositories/membership/membership.graphql` — add `LeaveMembership`.
- `packages/data/src/repositories/membership/membership.repository.ts` — add `leave(id)`.
- `packages/data/src/react/hooks/use-memberships.ts` — add `useLeaveMembership()`.
- Regenerate: `packages/data/src/generated/graphql.ts` via `bun run codegen`.

**Frontend (create/modify/delete):**
- Create: `apps/frontend/src/domain/memberships/types.ts` — `MembershipEntry` discriminated type.
- Create: `apps/frontend/src/domain/memberships/lib/entries.ts` — `buildMembershipEntries`, `sortMembershipEntries`, `formatMembershipDate`, `orgInitials`.
- Create: `apps/frontend/src/domain/memberships/components/membership-status-badge.tsx`.
- Create: `apps/frontend/src/domain/memberships/components/membership-card.tsx` (server component).
- Create: `apps/frontend/src/domain/memberships/components/withdraw-membership-button.tsx` (client island).
- Create: `apps/frontend/src/domain/memberships/components/leave-membership-button.tsx` (client island).
- Modify: `apps/frontend/messages/en.json` and `de.json` — new keys.
- Modify: `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx` — render the combined list.
- Delete (Task 6, after confirming no other importers): `apps/frontend/src/domain/membership-requests/components/my-membership-requests.tsx`, `my-membership-request-card.tsx`, `cancel-membership-request-button.tsx`.

---

## Task 1: Backend — `leaveMembership` mutation (TDD)

**Files:**
- Create: `apps/backend/test/membership.service.spec.ts`
- Modify: `apps/backend/src/membership/membership.service.ts`
- Modify: `apps/backend/src/membership-lifecycle/membership-lifecycle-mutation.resolver.ts`

**Interfaces:**
- Produces: `MembershipService.leaveMembership(id: string, userId: string): Promise<boolean>` — deletes the `memberships` row matching both `id` and `userId`; throws `NotFoundGraphQLError` if no row matched. GraphQL mutation `leaveMembership(id: ID!): Boolean!`.

- [ ] **Step 1: Write the failing tests**

Create `apps/backend/test/membership.service.spec.ts`. Import the test helpers from the **same module** that `apps/backend/test/organization.service.spec.ts` imports them from (open that file and copy its helper imports verbatim — do not guess the path).

```ts
import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import { type Database, DatabaseModule } from '../src/database/database.module';
import * as schema from '../src/database/schema';
import { MembershipRequestStatus } from '../src/membership/enums';
import { MembershipService } from '../src/membership/membership.service';
import { NotFoundGraphQLError } from '../src/graphql/errors';
import { NotificationService } from '../src/notification';
import { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
import { RequirementProfileService } from '../src/requirement-profile/services/requirement-profile.service';
// + the helper imports copied verbatim from test/organization.service.spec.ts
//   (ensureTestDatabase, registerTestResourceCleanup, createUser,
//    createOrganizationWithType, createUnit, addMembership)

describe('MembershipService', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let service: MembershipService;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);
    service = new MembershipService(
      db,
      {} as RequirementProfileService,
      {} as AuthService,
      {} as NotificationService,
      {} as RequiredFormService,
    );
    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  describe('leaveMembership', () => {
    it('deletes the current user membership and returns true', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Leave Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      await addMembership(db, user.id, unit.id);
      const membership = await db.query.memberships.findFirst({
        where: { userId: user.id, organizationUnitId: unit.id },
      });
      expect(membership).toBeTruthy();

      const result = await service.leaveMembership(membership!.id, user.id);

      expect(result).toBe(true);
      const after = await db.query.memberships.findFirst({
        where: eq(schema.memberships.id, membership!.id),
      });
      expect(after).toBeUndefined();
    });

    it('is self-scoped: another user cannot delete it and throws NotFound', async () => {
      const owner = await createUser(db);
      const other = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Scope Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      await addMembership(db, owner.id, unit.id);
      const membership = await db.query.memberships.findFirst({
        where: { userId: owner.id, organizationUnitId: unit.id },
      });

      await expect(
        service.leaveMembership(membership!.id, other.id),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);

      const stillThere = await db.query.memberships.findFirst({
        where: eq(schema.memberships.id, membership!.id),
      });
      expect(stillThere).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/backend && bun run test:integration -- test/membership.service.spec.ts`
Expected: FAIL — `service.leaveMembership is not a function`.

- [ ] **Step 3: Implement the service method**

In `apps/backend/src/membership/membership.service.ts`, add this method to `MembershipService` (the class already imports `and`, `eq` from `drizzle-orm`, `* as schema`, and `NotFoundGraphQLError`):

```ts
async leaveMembership(id: string, userId: string): Promise<boolean> {
  const [deleted] = await this.db
    .delete(schema.memberships)
    .where(
      and(
        eq(schema.memberships.id, id),
        eq(schema.memberships.userId, userId),
      ),
    )
    .returning();

  if (!deleted) {
    throw new NotFoundGraphQLError('Membership not found');
  }

  return true;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/backend && bun run test:integration -- test/membership.service.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Expose the mutation on the resolver**

In `apps/backend/src/membership-lifecycle/membership-lifecycle-mutation.resolver.ts`, add this method to `MembershipLifecycleMutationResolver` (no `@Permissions` decorator — it is self-service, mirroring `cancelMembershipRequest`; `@Session` and `MembershipService` are already imported/injected):

```ts
@Mutation(() => Boolean)
async leaveMembership(
  @Args('id', { type: () => ID }) id: string,
  @Session() session: UserSession,
): Promise<boolean> {
  return this.membershipService.leaveMembership(id, session.user.id);
}
```

- [ ] **Step 6: Regenerate the GraphQL schema**

The frontend codegen reads `apps/backend/src/schema.gql`, which NestJS emits from the resolvers. Start the backend briefly so it writes the file, then stop it:
Run: `cd apps/backend && timeout 20 bun run dev` (or the repo-root `bun run dev`), then kill it once the console shows GraphQL ready.
Verify the new mutation is present:
Run: `grep -n "leaveMembership" apps/backend/src/schema.gql`
Expected: a `leaveMembership(id: ID!): Boolean!` line appears.

- [ ] **Step 7: Lint + typecheck + commit**

Run: `cd apps/backend && bun run lint && bun run check-types`
```bash
git add apps/backend/test/membership.service.spec.ts \
        apps/backend/src/membership/membership.service.ts \
        apps/backend/src/membership-lifecycle/membership-lifecycle-mutation.resolver.ts \
        apps/backend/src/schema.gql
git commit -m "feat(backend): add leaveMembership mutation (hard-delete own membership)"
```

---

## Task 2: Backend — filter `myMembershipRequests` to `PENDING` + `REJECTED` (TDD)

**Files:**
- Modify: `apps/backend/test/membership.service.spec.ts` (add a `describe` block)
- Modify: `apps/backend/src/membership/membership.service.ts` (`getMyMembershipRequests`)

**Interfaces:**
- Produces: `getMyMembershipRequests(userId, status?)` returns `PENDING` + `REJECTED` when `status` is omitted; returns the single requested status when `status` is supplied.

- [ ] **Step 1: Write the failing tests**

Append this `describe` block inside the `MembershipService` describe in `apps/backend/test/membership.service.spec.ts`. If a direct insert errors on a missing column, mirror the field set used in `MembershipService`'s own request-creation insert (`db.insert(schema.membershipRequests)` near `src/membership/membership.service.ts:335`).

```ts
  describe('getMyMembershipRequests (profile filter)', () => {
    it('returns only PENDING and REJECTED, excluding ACCEPTED and CANCELLED', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Filter Org ${crypto.randomUUID()}`,
      );
      const mkUnit = (name: string) =>
        createUnit(db, { organizationId: organization.id, typeId: type.id, name });

      const [pending, accepted, rejected, cancelled] = await Promise.all([
        mkUnit('pending'),
        mkUnit('accepted'),
        mkUnit('rejected'),
        mkUnit('cancelled'),
      ]);

      await db.insert(schema.membershipRequests).values([
        { userId: user.id, organizationUnitId: pending.id, status: MembershipRequestStatus.PENDING, metadata: {} },
        { userId: user.id, organizationUnitId: accepted.id, status: MembershipRequestStatus.ACCEPTED, metadata: {} },
        { userId: user.id, organizationUnitId: rejected.id, status: MembershipRequestStatus.REJECTED, metadata: {} },
        { userId: user.id, organizationUnitId: cancelled.id, status: MembershipRequestStatus.CANCELLED, metadata: {} },
      ]);

      const items = await service.getMyMembershipRequests(user.id);
      const statuses = items.map((i) => i.status).sort();
      expect(statuses).toEqual([
        MembershipRequestStatus.PENDING,
        MembershipRequestStatus.REJECTED,
      ]);
    });

    it('honors an explicit status filter', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Filter2 Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      await db.insert(schema.membershipRequests).values({
        userId: user.id,
        organizationUnitId: unit.id,
        status: MembershipRequestStatus.PENDING,
        metadata: {},
      });

      const items = await service.getMyMembershipRequests(
        user.id,
        MembershipRequestStatus.PENDING,
      );
      expect(items).toHaveLength(1);
      expect(items[0].status).toBe(MembershipRequestStatus.PENDING);
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/backend && bun run test:integration -- test/membership.service.spec.ts`
Expected: the first new test FAILS (ACCEPTED/CANCELLED are currently returned).

- [ ] **Step 3: Rewrite the filter**

In `apps/backend/src/membership/membership.service.ts`, replace the `getMyMembershipRequests` method body. The current method uses the object-where form `{ userId, ...(status ? { status } : {}) }`. Switch to the function-where form so an `inArray` default applies (`inArray` is already imported from `drizzle-orm`):

```ts
async getMyMembershipRequests(
  userId: string,
  status?: MembershipRequestStatus,
): Promise<MembershipRequestEntity[]> {
  return this.db.query.membershipRequests.findMany({
    where: (fields, { eq, and, inArray }) =>
      and(
        eq(fields.userId, userId),
        status
          ? eq(fields.status, status)
          : inArray(fields.status, [
              MembershipRequestStatus.PENDING,
              MembershipRequestStatus.REJECTED,
            ]),
      ),
    with: {
      user: true,
      organizationUnit: true,
      reviewedBy: true,
      requirementProfileSubmissions: true,
    },
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/backend && bun run test:integration -- test/membership.service.spec.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Lint + typecheck + commit**

Run: `cd apps/backend && bun run lint && bun run check-types`
```bash
git add apps/backend/test/membership.service.spec.ts apps/backend/src/membership/membership.service.ts
git commit -m "feat(backend): restrict myMembershipRequests to PENDING and REJECTED"
```

---

## Task 3: Data layer — `LeaveMembership` mutation, repository method, hook

**Files:**
- Modify: `packages/data/src/repositories/membership/membership.graphql`
- Modify: `packages/data/src/repositories/membership/membership.repository.ts`
- Modify: `packages/data/src/react/hooks/use-memberships.ts`
- Regenerate: `packages/data/src/generated/graphql.ts`

**Interfaces:**
- Produces: `MembershipRepository.leave(id: string): Promise<boolean>`; React hook `useLeaveMembership()` (mutation `{ id: string }` → `boolean`). The hook invalidates `['memberships']` and `['membershipRequests']` on success.

- [ ] **Step 1: Add the GraphQL document**

Append to `packages/data/src/repositories/membership/membership.graphql`:

```graphql
mutation LeaveMembership($id: ID!) {
  leaveMembership(id: $id)
}
```

- [ ] **Step 2: Regenerate types**

Run (repo root): `bun run codegen`
Verify: `grep -n "LeaveMembershipMutation" packages/data/src/generated/graphql.ts` returns the generated type + SDK method.

- [ ] **Step 3: Add the repository method**

In `packages/data/src/repositories/membership/membership.repository.ts`, add to `MembershipRepository` (mirrors the existing `getMyMembershipStatus` style):

```ts
async leave(membershipId: string) {
  const data = await this.sdk.LeaveMembership({ id: membershipId });
  return data.leaveMembership;
}
```

- [ ] **Step 4: Add the React hook**

In `packages/data/src/react/hooks/use-memberships.ts`, add (mirror `useUpdateMembershipRoles` already in that file — same imports: `useMutation`, `useQueryClient`, `useSdk`, `MembershipRepository`):

```ts
export function useLeaveMembership() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new MembershipRepository(sdk);

  return useMutation({
    mutationFn: (membershipId: string) => repository.leave(membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['membershipRequests'] });
    },
  });
}
```

- [ ] **Step 5: Lint + typecheck + commit**

Run (repo root): `bun run lint && bun run check-types`
```bash
git add packages/data/src/repositories/membership/membership.graphql \
        packages/data/src/repositories/membership/membership.repository.ts \
        packages/data/src/react/hooks/use-memberships.ts \
        packages/data/src/generated/graphql.ts
git commit -m "feat(data): add LeaveMembership mutation, repository method and hook"
```

---

## Task 4: Frontend — i18n keys

**Files:**
- Modify: `apps/frontend/messages/en.json`
- Modify: `apps/frontend/messages/de.json`

**Interfaces:**
- Produces: keys under the existing `MembershipRequest` namespace: `status.requested`, `status.declined`, `meta.requestedDate`, `meta.declinedDate`, `meta.joinedDate`, `actions.withdraw`, `actions.leave`, `dialog.withdrawTitle`, `dialog.withdrawDescription`, `dialog.leaveTitle`, `dialog.leaveDescription`, `toast.withdrawn`, `toast.withdrawFailed`, `toast.left`, `toast.leaveFailed`.

- [ ] **Step 1: Add English keys**

In `apps/frontend/messages/en.json`, inside the existing `"MembershipRequest"` object, merge these keys (keep existing keys intact):

```json
"status": {
  "pending": "Pending",
  "approved": "Approved",
  "rejected": "Rejected",
  "requested": "Requested",
  "declined": "Declined"
},
"meta": {
  "requestedDate": "Requested · {date}",
  "declinedDate": "Declined · {date}",
  "joinedDate": "Joined · {date}"
},
"actions": {
  "withdraw": "Withdraw",
  "leave": "Leave"
},
"dialog": {
  "withdrawTitle": "Withdraw request?",
  "withdrawDescription": "Withdraw your request to join {orgName}?",
  "leaveTitle": "Leave organization?",
  "leaveDescription": "Are you sure you want to leave {orgName}?"
},
"toast": {
  "withdrawn": "Membership request withdrawn",
  "withdrawFailed": "Failed to withdraw request",
  "left": "You have left {orgName}",
  "leaveFailed": "Failed to leave organization"
}
```
(Only add the sub-keys shown that are missing; do not duplicate keys that already exist under `status`/`toast`. Preserve any existing siblings inside each object.)

- [ ] **Step 2: Add German keys**

Mirror the same keys in `apps/frontend/messages/de.json`:

```json
"status": {
  "requested": "Angefragt",
  "declined": "Abgelehnt"
},
"meta": {
  "requestedDate": "Angefragt · {date}",
  "declinedDate": "Abgelehnt · {date}",
  "joinedDate": "Beigetreten · {date}"
},
"actions": {
  "withdraw": "Zurückziehen",
  "leave": "Verlassen"
},
"dialog": {
  "withdrawTitle": "Anfrage zurückziehen?",
  "withdrawDescription": "Möchtest du deine Anfrage für {orgName} zurückziehen?",
  "leaveTitle": "Organisation verlassen?",
  "leaveDescription": "Möchtest du {orgName} wirklich verlassen?"
},
"toast": {
  "withdrawn": "Anfrage zurückgezogen",
  "withdrawFailed": "Zurückziehen fehlgeschlagen",
  "left": "Du hast {orgName} verlassen",
  "leaveFailed": "Verlassen fehlgeschlagen"
}
```

- [ ] **Step 3: Validate JSON + commit**

Run: `cd apps/frontend && bun run lint`
```bash
git add apps/frontend/messages/en.json apps/frontend/messages/de.json
git commit -m "feat(frontend): add membership lifecycle i18n keys"
```

---

## Task 5: Frontend — `MembershipCard`, status badge, Withdraw + Leave buttons

**Files:**
- Create: `apps/frontend/src/domain/memberships/types.ts`
- Create: `apps/frontend/src/domain/memberships/lib/entries.ts`
- Create: `apps/frontend/src/domain/memberships/components/membership-status-badge.tsx`
- Create: `apps/frontend/src/domain/memberships/components/membership-card.tsx`
- Create: `apps/frontend/src/domain/memberships/components/withdraw-membership-button.tsx`
- Create: `apps/frontend/src/domain/memberships/components/leave-membership-button.tsx`

**Interfaces:**
- Consumes: `MembershipRequestStatus`, `GetMyMembershipRequestsQuery` from `@repo/data`; `useCancelMembershipRequest`, `useLeaveMembership` from `@repo/data/react`; `Badge`, `Card*`, `Button` from `@repo/ui`; `DeleteAlertDialog` from `@/components/delete-alert-dialog`.
- Produces: `MembershipEntry` (discriminated union of `requested` | `declined`; `accepted` added by VOLI-942); `MembershipCard` (server component) rendering per-state; `WithdrawMembershipButton` and `LeaveMembershipButton` (client islands).

- [ ] **Step 1: Create the entry type**

`apps/frontend/src/domain/memberships/types.ts`:

```ts
export type MembershipCardOrg = { id: string; name: string };

export type MembershipEntry =
  | { state: 'requested'; id: string; org: MembershipCardOrg; date: string }
  | { state: 'declined'; id: string; org: MembershipCardOrg; date: string };
// VOLI-942 will add: | { state: 'accepted'; id: string; org: MembershipCardOrg; role?: string; date: string }
```

- [ ] **Step 2: Create the helpers**

`apps/frontend/src/domain/memberships/lib/entries.ts`. `GetMyMembershipRequestsQuery` is exported from `@repo/data`; its items expose `id`, `status`, `createdAt`, `reviewedAt`, and `organizationUnit: { id, name }`.

```ts
import { MembershipRequestStatus } from '@repo/data';
import type { MembershipEntry, MembershipCardOrg } from '../types';

type MyRequestItem = {
  id: string;
  status: MembershipRequestStatus;
  createdAt: string;
  reviewedAt?: string | null;
  organizationUnit: MembershipCardOrg;
};

const STATE_ORDER: Record<MembershipEntry['state'], number> = {
  requested: 0,
  declined: 1,
};

export function buildMembershipEntries(
  requests: MyRequestItem[],
): MembershipEntry[] {
  const entries: MembershipEntry[] = [];
  for (const request of requests) {
    const org = request.organizationUnit;
    if (request.status === MembershipRequestStatus.Pending) {
      entries.push({ state: 'requested', id: request.id, org, date: request.createdAt });
    } else if (request.status === MembershipRequestStatus.Rejected) {
      entries.push({ state: 'declined', id: request.id, org, date: request.reviewedAt ?? request.createdAt });
    }
    // ACCEPTED / CANCELLED are excluded by the backend filter and ignored here.
  }
  return sortMembershipEntries(entries);
}

export function sortMembershipEntries(entries: MembershipEntry[]): MembershipEntry[] {
  return [...entries].sort((a, b) => {
    const byState = STATE_ORDER[a.state] - STATE_ORDER[b.state];
    if (byState !== 0) return byState;
    return Date.parse(b.date) - Date.parse(a.date);
  });
}

export function orgInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatMembershipDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}
```

- [ ] **Step 3: Create the status badge**

`apps/frontend/src/domain/memberships/components/membership-status-badge.tsx` (server component; `Badge` variants: `info` for Requested, `error` for Declined):

```tsx
import { Badge } from '@repo/ui';
import { useTranslations } from 'next-intl';
import type { MembershipEntry } from '../types';

const VARIANT: Record<MembershipEntry['state'], 'info' | 'error'> = {
  requested: 'info',
  declined: 'error',
};

const LABEL_KEY: Record<MembershipEntry['state'], string> = {
  requested: 'status.requested',
  declined: 'status.declined',
};

export function MembershipStatusBadge({ state }: { state: MembershipEntry['state'] }) {
  const t = useTranslations('MembershipRequest');
  return <Badge variant={VARIANT[state]}>{t(LABEL_KEY[state])}</Badge>;
}
```

- [ ] **Step 4: Create the Withdraw button**

`apps/frontend/src/domain/memberships/components/withdraw-membership-button.tsx` (`'use client'`). It wraps the existing `useCancelMembershipRequest` hook in a `DeleteAlertDialog` confirm, then `router.refresh()` + toast. Mirror the imports of `cancel-membership-request-button.tsx` (`useRouter` from `@/i18n/navigation`, `toast` from `sonner`).

```tsx
'use client';

import { useCancelMembershipRequest } from '@repo/data/react';
import { Button } from '@repo/ui';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

type Props = { id: string; organizationUnitId: string; orgName: string };

export function WithdrawMembershipButton({
  id,
  organizationUnitId,
  orgName,
}: Props) {
  const router = useRouter();
  const t = useTranslations('MembershipRequest');
  const { mutate, isPending } = useCancelMembershipRequest();

  const handleWithdraw = () => {
    mutate(
      { id, organizationUnitId },
      {
        onSuccess: () => {
          toast.success(t('toast.withdrawn'));
          router.refresh();
        },
        onError: () => toast.error(t('toast.withdrawFailed')),
      },
    );
  };

  return (
    <DeleteAlertDialog
      title={t('dialog.withdrawTitle')}
      description={t('dialog.withdrawDescription', { orgName })}
      onDelete={handleWithdraw}
      trigger={
        <Button variant="outline" size="sm" disabled={isPending}>
          {t('actions.withdraw')}
        </Button>
      }
    />
  );
}
```

- [ ] **Step 5: Create the Leave button**

`apps/frontend/src/domain/memberships/components/leave-membership-button.tsx` (`'use client'`). Same shape, using `useLeaveMembership`. Built now; VOLI-942 mounts it on the Accepted card.

```tsx
'use client';

import { useLeaveMembership } from '@repo/data/react';
import { Button } from '@repo/ui';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

type Props = { membershipId: string; orgName: string };

export function LeaveMembershipButton({ membershipId, orgName }: Props) {
  const router = useRouter();
  const t = useTranslations('MembershipRequest');
  const { mutate, isPending } = useLeaveMembership();

  const handleLeave = () => {
    mutate(membershipId, {
      onSuccess: () => {
        toast.success(t('toast.left', { orgName }));
        router.refresh();
      },
      onError: () => toast.error(t('toast.leaveFailed')),
    });
  };

  return (
    <DeleteAlertDialog
      title={t('dialog.leaveTitle')}
      description={t('dialog.leaveDescription', { orgName })}
      onDelete={handleLeave}
      trigger={
        <Button variant="destructive" size="sm" disabled={isPending}>
          {t('actions.leave')}
        </Button>
      }
    />
  );
}
```

- [ ] **Step 6: Create the card**

`apps/frontend/src/domain/memberships/components/membership-card.tsx` (server component — no `'use client'`). Declined renders no actions. The `locale` prop is passed from the page; `useTranslations` works in server components.

```tsx
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { formatMembershipDate, orgInitials } from '../lib/entries';
import type { MembershipEntry } from '../types';
import { MembershipStatusBadge } from './membership-status-badge';
import { WithdrawMembershipButton } from './withdraw-membership-button';

type Props = { entry: MembershipEntry; locale: string };

export function MembershipCard({ entry, locale }: Props) {
  const t = useTranslations('MembershipRequest');
  const { org, date } = entry;

  return (
    <Card>
      <CardHeader className="flex flex-row gap-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-muted text-xs font-semibold">
          {orgInitials(org.name)}
        </div>
        <CardTitle className="flex-1">{org.name}</CardTitle>
        <CardAction>
          <MembershipStatusBadge state={entry.state} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <span className="text-muted-foreground text-sm">
          {t(entry.state === 'requested' ? 'meta.requestedDate' : 'meta.declinedDate', {
            date: formatMembershipDate(date, locale),
          })}
        </span>

        {entry.state === 'requested' && (
          <div className="flex justify-end">
            <WithdrawMembershipButton
              id={entry.id}
              organizationUnitId={org.id}
              orgName={org.name}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7: Typecheck + lint**

Run: `cd apps/frontend && bun run check-types && bun run lint`
Expected: no errors. (If `CardAction`/`CardContent` import names differ, match the exports of `@repo/ui` `card.tsx` — the transitional card used `Card, CardAction, CardContent, CardHeader, CardTitle`.)

- [ ] **Step 8: Commit**

```bash
git add apps/frontend/src/domain/memberships/
git commit -m "feat(frontend): add MembershipCard with Withdraw/Leave actions"
```

---

## Task 6: Frontend — render the combined list on the profile

**Files:**
- Modify: `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx`
- Delete: `apps/frontend/src/domain/membership-requests/components/my-membership-requests.tsx`, `my-membership-request-card.tsx`, `cancel-membership-request-button.tsx`

**Interfaces:**
- Consumes: `buildMembershipEntries`, `MembershipCard` from Task 5; `data.membershipRequest.findMine()` (now returns only `PENDING` + `REJECTED`).

- [ ] **Step 1: Wire the page**

In `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx`, replace the import of `MyMembershipRequests` and the transitional block. The page already fetches `data.membershipRequest.findMine()`; build entries and render the cards under the existing "Your organizations" heading. `locale` is already resolved in the file.

Replace the transitional block (the `<div>` containing `id="memberships"` and `<MyMembershipRequests .../>`) and the empty "Your organizations" `<section>` with a single section:

```tsx
import { buildMembershipEntries } from '@/domain/memberships/lib/entries';
import { MembershipCard } from '@/domain/memberships/components/membership-card';
```

In the component body, after fetching:

```tsx
const { items: membershipRequests } = await data.membershipRequest.findMine();
const membershipEntries = buildMembershipEntries(membershipRequests);
```

Render (replacing both the empty `organizations` section and the transitional memberships block):

```tsx
<section className="space-y-4">
  <h2 className="text-xl font-bold">{tProfile('organizations')}</h2>
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    {membershipEntries.map((entry) => (
      <MembershipCard key={`${entry.state}-${entry.id}`} entry={entry} locale={locale} />
    ))}
  </div>
</section>
```

Leave the `personalInformation` and `accountSettings` section slots and the `ProfileForm` block as they are. (VOLI-942 will pass accepted entries into `buildMembershipEntries`; the seam is already there — add an `acceptedEntries` parameter defaulting to `[]` when 942 lands.)

- [ ] **Step 2: Typecheck + lint**

Run: `cd apps/frontend && bun run check-types && bun run lint`
Expected: no errors.

- [ ] **Step 3: Manual verification in the dev server**

Run: `bun run db:up` (if Postgres isn't running), then `bun run dev`.
As a volunteer with a `PENDING` request and a `REJECTED` request (seed via the fixtures/dev data), open `/profile`:
- A Requested card shows the org name + initials, a `Requested` badge, `Requested · <date>`, and a **Withdraw** button.
- A Declined card shows the org, a `Declined` badge, `Declined · <date>`, and **no buttons**.
- `ACCEPTED`/`CANCELLED` requests do **not** appear.
- Click Withdraw → confirm dialog → on confirm the Requested card disappears and a success toast shows; cancelling the dialog changes nothing.
- Force a failure (e.g. stop the backend) → click Withdraw → the card stays and an error toast shows.

- [ ] **Step 4: Remove the transitional components**

Confirm they have no other importers:
Run: `grep -rn "my-membership-requests\|my-membership-request-card\|cancel-membership-request-button" apps/frontend/src --include="*.tsx" --include="*.ts"`
Expected: only the files themselves (and the now-removed page import) match. If another file imports them, stop and reconcile first.
Then delete:
```bash
git rm apps/frontend/src/domain/membership-requests/components/my-membership-requests.tsx \
       apps/frontend/src/domain/membership-requests/components/my-membership-request-card.tsx \
       apps/frontend/src/domain/membership-requests/components/cancel-membership-request-button.tsx
```

- [ ] **Step 5: Typecheck + lint + commit**

Run: `cd apps/frontend && bun run check-types && bun run lint`
```bash
git add apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx
git commit -m "feat(frontend): render combined membership list on the profile"
```

---

## Self-Review (completed)

**Spec coverage:**
- Withdraw (Requested → cancel) → Task 5 button + Task 6 wiring + reuse of `cancelMembershipRequest` (existing). ✓
- Leave (Accepted → hard-delete) → Task 1 backend + Task 3 data + Task 5 button (mounted by 942). ✓
- Dismiss removed, Declined read-only → Task 5 card (no actions for `declined`) + Task 2 excludes nothing extra. ✓
- No new status / no migration → Tasks 1–2 use existing enum only. ✓
- Combined-list composition (RSC merge) + sort Accepted→Requested→Declined → Task 6 + `buildMembershipEntries`/`sortMembershipEntries`. ✓
- Confirmation dialogs + error handling → Task 5 buttons (`DeleteAlertDialog` + toast). ✓
- `myMembershipRequests` excludes `ACCEPTED`/`CANCELLED` → Task 2. ✓
- i18n keys → Task 4. ✓
- Ticket-deviation notes (Left dropped, Dismiss removed, 942 seam, follow-ups VOLI-968/969) → captured in the spec, not re-litigated here. ✓

**Placeholder scan:** none — every step has concrete code or an exact command. Test helper imports point to a real file to copy from rather than a guessed path.

**Type consistency:** `MembershipEntry` (Task 5 Step 1) is the single shape consumed by `MembershipCard`, `MembershipStatusBadge`, and `buildMembershipEntries`; `state` values (`requested`/`declined`) match across all three. Hook names `useCancelMembershipRequest` (existing) and `useLeaveMembership` (Task 3) match Task 5 usage. `leaveMembership(id: ID!): Boolean!` matches across resolver, schema, `.graphql`, repository, and hook.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-30-voli-952-membership-lifecycle.md`.
