# Membership Drill-In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-membership drill-in page (status, role, joined date, per-form cards) reachable from the profile's accepted membership card, plus a read-only submission view — building on VOLI-942.

**Architecture:** New owner-scoped backend queries (`myMembership`, `myOrgUnitForms`, `myFormSubmission`) reuse the existing `RequiredFormService` and `form_submissions` to compute, per org-unit, the union of forms a user has submitted or been asked to fill in (org-unit + their event invites). The data package exposes them via the SDK; a Next.js server-component drill-in page renders them; a new volunteer read-only submission route reuses a renderer extracted from the admin page.

**Tech Stack:** NestJS + Apollo GraphQL + Drizzle (backend), `graphql-request` + `graphql-codegen` (`packages/data`), Next.js App Router (RSC) + next-intl + Tailwind/shadcn (`@repo/ui`) (frontend).

## Global Constraints

Copy these verbatim into every task's context:

- **`bun` is broken in this environment.** Run binaries directly:
  - Codegen (from `packages/data`): `../../packages/data/node_modules/.bin/graphql-codegen` — wait, run from `packages/data`: `./node_modules/.bin/graphql-codegen` while cwd is `packages/data`, i.e. `cd packages/data && ../../node_modules/.bin/graphql-codegen` is wrong — use: `./packages/data/node_modules/.bin/graphql-codegen` invoked with cwd `packages/data`. Practical form: `node_modules/.bin/graphql-codegen` after `cd packages/data`. Since `cd` can prompt, prefer: `./packages/data/node_modules/.bin/graphql-codegen packages/data` is invalid — instead run `(cd packages/data && ./node_modules/.bin/graphql-codegen)`.
  - Backend type-check: `./node_modules/.bin/tsc --noEmit -p apps/backend/tsconfig.json`
  - Frontend type-check: `./node_modules/.bin/tsc --noEmit -p apps/frontend/tsconfig.json`
  - Lint/format (repo root): `./node_modules/.bin/biome check .` (add `--write` to autofix).
- **Backend integration tests** live in `apps/backend/test/*.spec.ts`, use `bun:test` imports + a real test Postgres. Run setup then tests: `(cd apps/backend && ./node_modules/.bin/bun run test/setup-test-db.ts)` then `(cd apps/backend && ./node_modules/.bin/bun test test/)`. If bun/postgres are unavailable in-session, fall back to type-check + lint and flag the test as "run in an env with the test DB". Still WRITE the test (TDD).
- **`schema.gql` regeneration:** `apps/backend/src/schema.gql` is committed and NestJS auto-writes it on boot. After adding any backend query/type/field, regenerate it by starting the backend briefly: `(cd apps/backend && ./node_modules/.bin/nest start)` until you see the GraphQL schema init line / the file's mtime updates, then kill it. Then run data codegen.
- **Pre-commit hook is broken in this worktree** (the `.ai` submodule — `clippy-ai.git` — cannot be cloned here). Commit with `git commit --no-verify`. Never push in-scope work without the user's OK.
- **Code style:** ESM arrow functions (`const x = () => {}`) for all non-page modules; `export default function` for `page.tsx`/`layout.tsx`. Prefer `type` over `interface`. Prefer React Server Components; add `'use client'` only when a component needs `useRouter`/state/effects. Avoid `as` casts. Use next.js `<Link>`, never `<a>`.
- **i18n:** default locale is `de`. Every text key added to `apps/frontend/messages/en.json` MUST also be added to `apps/frontend/messages/de.json`.
- **Spec:** `docs/superpowers/specs/2026-08-05-membership-drill-in-design.md`.

## File Structure

**Backend (`apps/backend`)**
- Modify `src/membership/membership.service.ts` — add `getMyMembership(userId, id)`.
- Modify `src/membership/resolvers/membership-query.resolver.ts` — add `myMembership(id)` query.
- Create `src/requirement-profile/models/my-org-unit-form.model.ts` — `MyOrgUnitForm` `@ObjectType` (references `RequirementForm`).
- Modify `src/requirement-profile/services/required-form.service.ts` — add `formsForUser(userId, organizationUnitId)` (the union; core logic).
- Modify `src/requirement-profile/resolvers/requirement-form-query.resolver.ts` — add `myOrgUnitForms(organizationUnitId)` query.
- Modify `src/requirement-profile/services/form-submission.service.ts` — add `findMySubmission(userId, id)`.
- Modify `src/requirement-profile/resolvers/form-submission-query.resolver.ts` — add `myFormSubmission(id)` query.
- Create `apps/backend/test/membership-drill-in.spec.ts` — integration test for `formsForUser`.

**Data package (`packages/data`)**
- Modify `src/repositories/membership/membership.graphql` — add `MyMembership` operation.
- Modify `src/repositories/membership/membership.repository.ts` — add `findMineById(id)`.
- Modify `src/repositories/requirementForm/requirement-form.graphql` — add `MyOrgUnitForms` + `MyFormSubmission` operations.
- Modify `src/repositories/requirementForm/requirement-form.repository.ts` — add `findMyOrgUnitForms(organizationUnitId)` + `findMySubmission(id)`.

**Frontend (`apps/frontend`)**
- Create `src/domain/requirement-form/components/submission-view.tsx` — reusable read-only renderer (extracted from admin page).
- Create `src/app/[locale]/(volunteering)/forms/submissions/[submissionId]/page.tsx` — read-only submission view.
- Create `src/domain/memberships/components/membership-detail-header.tsx` — client wrapper around `DetailPageHeader`.
- Create `src/domain/memberships/components/membership-form-card.tsx` — one form card.
- Create `src/app/[locale]/(volunteering)/profile/memberships/[membershipId]/page.tsx` — the drill-in page.
- Modify `src/domain/memberships/components/membership-card.tsx` — wrap the accepted card in a `<Link>`.
- Modify `messages/en.json` + `messages/de.json` — `MembershipDetail` namespace + submission-view keys.

---

### Task 1: Backend — `myMembership(id)` query

Returns the current user's membership by id (ownership-checked), same field shape as `myMemberships`.

**Files:**
- Modify: `apps/backend/src/membership/membership.service.ts`
- Modify: `apps/backend/src/membership/resolvers/membership-query.resolver.ts`

**Interfaces:**
- Consumes: `MembershipEntity` (Drizzle entity), existing `db.query.memberships` relation graph (`organizationUnit`, `roles.role`).
- Produces: GraphQL query `myMembership(id: ID!): Membership` (nullable) returning `{ id, createdAt, organizationUnit { id name logoUrl type{icon} parent{id} organization{name} }, roles { id name } }`.

- [ ] **Step 1: Add the service method**

In `apps/backend/src/membership/membership.service.ts`, mirror `getMyMemberships` (which uses `db.query.memberships.findMany({ where: { userId }, with: { organizationUnit: true, roles: { with: { role: true } } } })`). Add:

```typescript
async getMyMembership(
  userId: string,
  id: string,
): Promise<MembershipEntity | null> {
  return this.db.query.memberships.findFirst({
    where: { id, userId },
    with: {
      organizationUnit: true,
      roles: { with: { role: true } },
    },
  });
}
```

`where: { id, userId }` enforces ownership: a membership row matches only if it belongs to the caller.

- [ ] **Step 2: Add the resolver query**

In `apps/backend/src/membership/resolvers/membership-query.resolver.ts` (which already has `myMemberships` returning `this.membershipMapper.toArray(...)`), add alongside it:

```typescript
@Query(() => Membership, { nullable: true })
async myMembership(
  @Args('id') id: string,
  @Session() session: UserSession,
): Promise<Membership | null> {
  const membership = await this.membershipService.getMyMembership(
    session.user.id,
    id,
  );
  return membership ? this.membershipMapper.toModel(membership) : null;
}
```

`Membership` (the `@ObjectType`) and `MembershipMapper` are already imported in this file (used by `myMemberships`). Confirm `Args` and `Query` are imported from `@nestjs/graphql` (they are).

- [ ] **Step 3: Type-check the backend**

Run: `./node_modules/.bin/tsc --noEmit -p apps/backend/tsconfig.json`
Expected: no errors. If `MembershipEntity` isn't imported in the service, add it (it's already imported there for `getMyMemberships`).

- [ ] **Step 4: Regenerate schema.gql**

Run: `(cd apps/backend && ./node_modules/.bin/nest start)` — watch for the GraphQL schema init; once `apps/backend/src/schema.gql` mtime updates (grep it for `myMembership(`), kill the process (Ctrl-C). Expected: `myMembership(id: ID!): Membership` appears in `schema.gql`.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/membership/membership.service.ts apps/backend/src/membership/resolvers/membership-query.resolver.ts apps/backend/src/schema.gql
git commit --no-verify -m "feat(membership): add myMembership(id) owner-scoped query"
```

---

### Task 2: Backend — `formsForUser` union + `myOrgUnitForms` query (CORE, TDD)

The heart of the feature. Compute, for `(userId, organizationUnitId)`, the union of (org-unit required forms) + (event required forms for the user's in-org event invites) + (the user's submitted forms for the org), deduped by form, each flagged completed.

**Files:**
- Create: `apps/backend/src/requirement-profile/models/my-org-unit-form.model.ts`
- Modify: `apps/backend/src/requirement-profile/services/required-form.service.ts`
- Modify: `apps/backend/src/requirement-profile/resolvers/requirement-form-query.resolver.ts`
- Create test: `apps/backend/test/membership-drill-in.spec.ts`

**Interfaces:**
- Consumes: `RequiredFormService.getRequiredForms({ targetType, targetId })` (returns `{ form: RequirementFormEntity; order: number }[]`); enums `RequiredFormTargetType.{ORGANIZATION_UNIT, EVENT}`; `FormSubmissionStatus.SUBMITTED`; Drizzle tables `organizationUnits`, `eventInvites`, `events`, `formSubmissions`.
- Produces: service method `RequiredFormService.formsForUser(userId, organizationUnitId): Promise<MyOrgUnitFormEntity[]>`; GraphQL query `myOrgUnitForms(organizationUnitId: ID!): [MyOrgUnitForm!]!` where each item is `{ form: RequirementForm, completed: Boolean, submissionId: ID, submittedAt: DateTime }`.

- [ ] **Step 1: Write the failing integration test**

Create `apps/backend/test/membership-drill-in.spec.ts`. It seeds an org, org-unit, a required form on the org-unit, an event in that org-unit with an invite for the user + an event-required form, and one submitted form, then asserts the union. Follow the `organization.service.spec.ts` pattern (Nest `Test.createTestingModule` + `DatabaseModule` + real test DB):

```typescript
import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  type Database,
  DatabaseModule,
  DATABASE_CONNECTION,
} from '../src/database/database.module';
import { RequirementProfileModule } from '../src/requirement-profile/requirement-profile.module';
import { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
import { RequirementFulfillmentStatus } from '../src/requirement-profile/enums';
import { eq } from 'drizzle-orm';
import { ensureTestDatabase } from './setup-test-db';

describe('RequiredFormService.formsForUser', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let service: RequiredFormService;

  // ids seeded in beforeEach
  let orgId: string;
  let orgUnitId: string;
  let userId: string;
  let requiredFormId: string;
  let submittedFormId: string;
  let eventId: string;
  let eventFormId: string;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, RequirementProfileModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);
    service = moduleRef.get(RequiredFormService);
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  // Seed helpers omitted for brevity? NO — include them. Insert real rows:
  beforeEach(async () => {
    // Create org, orgUnit, user, forms, event, invite, and one submission.
    // (Use db.insert into organizations, organization_units, users, requirement_forms,
    //  organization_unit_required_forms, events, event_required_forms, event_invites,
    //  form_submissions.) Assign the outer let-variables. Clean up in afterEach.
    // See "Seed detail" note below this block — implement it fully, do not stub.
  });

  it('returns org-unit required form as not-completed', async () => {
    const forms = await service.formsForUser(userId, orgUnitId);
    const f = forms.find((x) => x.form.id === requiredFormId);
    expect(f).toBeDefined();
    expect(f?.completed).toBe(false);
    expect(f?.submissionId).toBeNull();
  });

  it('returns event-required form (user invited) as not-completed', async () => {
    const forms = await service.formsForUser(userId, orgUnitId);
    const f = forms.find((x) => x.form.id === eventFormId);
    expect(f).toBeDefined();
    expect(f?.completed).toBe(false);
  });

  it('marks a submitted org form as completed with submissionId + submittedAt', async () => {
    const forms = await service.formsForUser(userId, orgUnitId);
    const f = forms.find((x) => x.form.id === submittedFormId);
    expect(f).toBeDefined();
    expect(f?.completed).toBe(true);
    expect(f?.submissionId).toBeTruthy();
    expect(f?.submittedAt).toBeTruthy();
  });

  it('dedupes a form that is both required and submitted into one completed card', async () => {
    // make requiredFormId also submitted by the user, then assert a single completed entry
    const forms = await service.formsForUser(userId, orgUnitId);
    const matches = forms.filter((x) => x.form.id === requiredFormId);
    expect(matches).toHaveLength(1);
    expect(matches[0].completed).toBe(true);
  });
});
```

**Seed detail (implement fully in `beforeEach`, no stubs):** insert rows with generated uuids (use `crypto.randomUUID()`), setting: `organizations.id=orgId`; `organization_units.id=orgUnitId, organizationId=orgId`; `users.id=userId`; two `requirement_forms` rows (`requiredFormId`, `submittedFormId`, `eventFormId`) with `organizationId=orgId`, `slug`/`shareToken` unique, `createdBy`/`updatedBy=userId`; `organization_unit_required_forms { organizationUnitId: orgUnitId, formId: requiredFormId }`; `events.id=eventId, organizationUnitId=orgUnitId`; `event_required_forms { eventId, formId: eventFormId }`; `event_invites { eventId, userId, status: 'INVITED' }`; one `form_submissions { userId, formId: submittedFormId, status: 'SUBMITTED', submittedAt: now }`. In `afterEach`, delete the seeded rows (or truncate these tables) to keep tests isolated. Mirror the insert style used elsewhere in `apps/backend/test/`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `(cd apps/backend && ./node_modules/.bin/bun run test/setup-test-db.ts) && (cd apps/backend && ./node_modules/.bin/bun test test/membership-drill-in.spec.ts)`
Expected: FAIL — `service.formsForUser is not a function`.

- [ ] **Step 3: Create the `MyOrgUnitForm` object type**

Create `apps/backend/src/requirement-profile/models/my-org-unit-form.model.ts`:

```typescript
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { RequirementForm } from './requirement-form.model';

@ObjectType()
export class MyOrgUnitForm {
  @Field(() => RequirementForm)
  form!: RequirementForm;

  @Field(() => Boolean)
  completed!: boolean;

  @Field(() => ID, { nullable: true })
  submissionId?: string | null;

  @Field(() => Date, { nullable: true })
  submittedAt?: Date | null;
}
```

`RequirementForm` already exposes `id`, `name`, `description`, `shareToken` (verified in `requirement-form.model.ts`).

- [ ] **Step 4: Implement `formsForUser` in `RequiredFormService`**

Add to `apps/backend/src/requirement-profile/services/required-form.service.ts` (the class already injects `private db: Database` and imports `RequiredFormTargetType`, `RequirementFormEntity`). Add a result type + method:

```typescript
export type MyOrgUnitFormItem = {
  form: RequirementFormEntity;
  completed: boolean;
  submissionId: string | null;
  submittedAt: Date | null;
};

// inside the class:
async formsForUser(
  userId: string,
  organizationUnitId: string,
): Promise<MyOrgUnitFormItem[]> {
  // 1. resolve the org-unit's organization
  const orgUnit = await this.db.query.organizationUnits.findFirst({
    where: { id: organizationUnitId },
    columns: { organizationId: true },
  });
  if (!orgUnit) return [];
  const organizationId = orgUnit.organizationId;

  // 2. requested: org-unit required forms
  const orgUnitRequired = await this.getRequiredForms({
    targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
    targetId: organizationUnitId,
  });

  // 3. requested: event required forms for events the user is invited to in this org
  const invites = await this.db.query.eventInvites.findMany({
    where: { userId },
    with: { event: { with: { organizationUnit: { columns: { organizationId: true } } } } },
  });
  const inOrgEventIds = invites
    .filter((i) => i.event?.organizationUnit?.organizationId === organizationId)
    .map((i) => i.eventId);
  const eventRequired: Array<{ form: RequirementFormEntity; order: number }> = [];
  for (const eventId of new Set(inOrgEventIds)) {
    const forms = await this.getRequiredForms({
      targetType: RequiredFormTargetType.EVENT,
      targetId: eventId,
    });
    eventRequired.push(...forms);
  }

  // 4. union of requested forms, deduped by formId
  const byForm = new Map<string, MyOrgUnitFormItem>();
  for (const { form } of [...orgUnitRequired, ...eventRequired]) {
    if (!byForm.has(form.id)) {
      byForm.set(form.id, { form, completed: false, submissionId: null, submittedAt: null });
    }
  }

  // 5. completed: user's submitted forms for this org
  const submissions = await this.db.query.formSubmissions.findMany({
    where: { userId, status: FormSubmissionStatus.SUBMITTED },
    with: { form: true },
  });
  for (const submission of submissions) {
    const form = submission.form;
    if (!form || form.organizationId !== organizationId) continue;
    const existing = byForm.get(form.id);
    const completed = {
      form,
      completed: true,
      submissionId: submission.id,
      submittedAt: submission.submittedAt,
    };
    if (existing) {
      byForm.set(form.id, completed); // required + submitted -> completed
    } else {
      byForm.set(form.id, completed); // submitted but not currently required
    }
  }

  // 6. not-completed first, then completed
  const items = [...byForm.values()];
  return items.sort((a, b) => Number(a.completed) - Number(b.completed));
}
```

Ensure imports: `FormSubmissionStatus` (from `../enums`) and `RequirementFormEntity` are available in this file (they already are — used by `getRequiredFormStatuses`).

- [ ] **Step 5: Expose the GraphQL query**

In `apps/backend/src/requirement-profile/resolvers/requirement-form-query.resolver.ts` (verify it exists; if the user-scoped query lives in `form-submission-query.resolver.ts` instead, add it there), add the resolver. Inject `RequiredFormService` (add to constructor if missing — same module, so available):

```typescript
@Query(() => [MyOrgUnitForm])
async myOrgUnitForms(
  @Args('organizationUnitId') organizationUnitId: string,
  @Session() session: UserSession,
): Promise<MyOrgUnitForm[]> {
  const items = await this.requiredFormService.formsForUser(
    session.user.id,
    organizationUnitId,
  );
  return items.map((item) => ({
    form: this.requirementFormMapper.toModel(item.form),
    completed: item.completed,
    submissionId: item.submissionId,
    submittedAt: item.submittedAt,
  }));
}
```

Imports to add at top of the resolver file: `import { MyOrgUnitForm } from '../models/my-org-unit-form.model';`. Ensure `requirementFormMapper` is injected (it is used by other resolvers in this domain; if not present in this specific resolver, inject `RequirementFormMapper` via the constructor and use `toModel`). `RequirementFormMapper` is the `@Mapper({ model: RequirementForm })` class — confirm its name via grep before use.

- [ ] **Step 6: Type-check + run the test**

Run: `./node_modules/.bin/tsc --noEmit -p apps/backend/tsconfig.json`
Expected: no errors.

Run: `(cd apps/backend && ./node_modules/.bin/bun test test/membership-drill-in.spec.ts)`
Expected: PASS (all 4 cases).

- [ ] **Step 7: Regenerate schema.gql + commit**

Run: `(cd apps/backend && ./node_modules/.bin/nest start)`, confirm `myOrgUnitForms(organizationUnitId: ID!): [MyOrgUnitForm!]!` and the `MyOrgUnitForm` type appear in `apps/backend/src/schema.gql`, then kill it.

```bash
git add apps/backend/src/requirement-profile/models/my-org-unit-form.model.ts \
        apps/backend/src/requirement-profile/services/required-form.service.ts \
        apps/backend/src/requirement-profile/resolvers/requirement-form-query.resolver.ts \
        apps/backend/test/membership-drill-in.spec.ts \
        apps/backend/src/schema.gql
git commit --no-verify -m "feat(forms): add myOrgUnitForms union of submitted + requested forms"
```

---

### Task 3: Backend — `myFormSubmission(id)` query (owner-scoped)

Needed so the read-only "View" route can fetch the caller's own submission.

**Files:**
- Modify: `apps/backend/src/requirement-profile/services/form-submission.service.ts`
- Modify: `apps/backend/src/requirement-profile/resolvers/form-submission-query.resolver.ts`

**Interfaces:**
- Consumes: `FormSubmission` `@ObjectType` + its mapper (used by `myFormSubmissions`); Drizzle `formSubmissions` with relations `form`, `values`.
- Produces: `myFormSubmission(id: ID!): FormSubmission` (nullable), returning the submission only when `userId === session.user.id`, including `form` and `values`.

- [ ] **Step 1: Add the service method**

In `form-submission.service.ts` (which already has `findByUserAndForm` and `findAdminSubmission`-style reads), add:

```typescript
async findMySubmission(userId: string, id: string) {
  return this.db.query.formSubmissions.findFirst({
    where: { id, userId },
    with: {
      form: { with: { blockRefs: { with: { block: { with: { fields: true } } } } } },
      values: true,
    },
  });
}
```

`where: { id, userId }` enforces ownership. Mirror the `with` shape used by `findAdminSubmission` so the read-only renderer gets the same `blockRefs → block → fields` graph (confirm against `findAdminSubmission` in this file and adjust to match exactly).

- [ ] **Step 2: Add the resolver query**

In `form-submission-query.resolver.ts` (alongside `myFormSubmissions` / `myFormSubmissionByToken`), add:

```typescript
@Query(() => FormSubmission, { nullable: true })
async myFormSubmission(
  @Args('id') id: string,
  @Session() session: UserSession,
): Promise<FormSubmission | null> {
  const item = await this.formSubmissionService.findMySubmission(session.user.id, id);
  return item ? this.formSubmissionMapper.toModel(item) : null;
}
```

`FormSubmission`, `formSubmissionService`, `formSubmissionMapper`, `Session`, `Query`, `Args` are all already imported/used in this file.

- [ ] **Step 3: Type-check + regenerate schema.gql**

Run: `./node_modules/.bin/tsc --noEmit -p apps/backend/tsconfig.json` → no errors.
Regenerate: `(cd apps/backend && ./node_modules/.bin/nest start)`, confirm `myFormSubmission(id: ID!): FormSubmission` is in `schema.gql`, kill it.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/requirement-profile/services/form-submission.service.ts \
        apps/backend/src/requirement-profile/resolvers/form-submission-query.resolver.ts \
        apps/backend/src/schema.gql
git commit --no-verify -m "feat(forms): add myFormSubmission(id) owner-scoped query"
```

---

### Task 4: Data package — operations, repositories, codegen

Expose the three new queries to the frontend SDK.

**Files:**
- Modify: `packages/data/src/repositories/membership/membership.graphql`
- Modify: `packages/data/src/repositories/membership/membership.repository.ts`
- Modify: `packages/data/src/repositories/requirementForm/requirement-form.graphql`
- Modify: `packages/data/src/repositories/requirementForm/requirement-form.repository.ts`

**Interfaces:**
- Consumes: the regenerated `schema.gql` (queries from Tasks 1–3).
- Produces (consumed by Tasks 5–6): `data.membership.findMineById(id)`, `data.requirementForm.findMyOrgUnitForms(organizationUnitId)`, `data.requirementForm.findMySubmission(id)`, with generated TS types `MyMembershipQuery`, `MyOrgUnitFormsQuery`, `MyFormSubmissionQuery`.

- [ ] **Step 1: Add the membership operation**

Append to `packages/data/src/repositories/membership/membership.graphql` (mirror the existing `MyMemberships` selection exactly):

```graphql
query MyMembership($id: ID!) {
  myMembership(id: $id) {
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

- [ ] **Step 2: Add the membership repository method**

In `packages/data/src/repositories/membership/membership.repository.ts` (alongside `findMine`), add:

```typescript
async findMineById(id: string) {
  const data = await this.sdk.MyMembership({ id });
  return data.myMembership;
}
```

- [ ] **Step 3: Add the requirement-form operations**

Append to `packages/data/src/repositories/requirementForm/requirement-form.graphql`:

```graphql
query MyOrgUnitForms($organizationUnitId: ID!) {
  myOrgUnitForms(organizationUnitId: $organizationUnitId) {
    form {
      id
      name
      description
      shareToken
    }
    completed
    submissionId
    submittedAt
  }
}

query MyFormSubmission($id: ID!) {
  myFormSubmission(id: $id) {
    id
    status
    submittedAt
    form {
      id
      name
      blockRefs {
        fieldOrder
        block {
          id
          fields {
            id
            label
            type
            systemKey
            options { label value }
          }
        }
      }
    }
    values { fieldId value }
  }
}
```

- [ ] **Step 4: Add the requirement-form repository methods**

In `packages/data/src/repositories/requirementForm/requirement-form.repository.ts` (alongside `findMyFormSubmissions`), add:

```typescript
async findMyOrgUnitForms(organizationUnitId: string) {
  const data = await this.sdk.MyOrgUnitForms({ organizationUnitId });
  return data.myOrgUnitForms;
}

async findMySubmission(id: string) {
  const data = await this.sdk.MyFormSubmission({ id });
  return data.myFormSubmission;
}
```

- [ ] **Step 5: Run codegen**

Run: `(cd packages/data && ./node_modules/.bin/graphql-codegen)`
Expected: succeeds; `packages/data/src/generated/graphql.ts` now contains `MyMembershipDocument`, `MyOrgUnitFormsDocument`, `MyFormSubmissionDocument` and their query types.

- [ ] **Step 6: Type-check the data package**

Run: `./node_modules/.bin/tsc --noEmit -p packages/data/tsconfig.json`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/data/src/repositories/membership/membership.graphql \
        packages/data/src/repositories/membership/membership.repository.ts \
        packages/data/src/repositories/requirementForm/requirement-form.graphql \
        packages/data/src/repositories/requirementForm/requirement-form.repository.ts \
        packages/data/src/generated/graphql.ts
git commit --no-verify -m "feat(data): expose myMembership, myOrgUnitForms, myFormSubmission"
```

---

### Task 5: Frontend — extract `SubmissionView` + read-only submission route

The "View" destination for completed cards. Reuses the admin page's field-resolution logic in a shared component.

**Files:**
- Create: `apps/frontend/src/domain/requirement-form/components/submission-view.tsx`
- Create: `apps/frontend/src/app/[locale]/(volunteering)/forms/submissions/[submissionId]/page.tsx`
- Modify: `apps/frontend/messages/en.json` + `messages/de.json`

**Interfaces:**
- Consumes: `data.requirementForm.findMySubmission(id)` (Task 4); `Table`/`TableHeader`/`TableRow`/`TableHead`/`TableBody`/`TableCell` from `@repo/ui`; `getTranslations`, `useFormatter` from next-intl.
- Produces: route `/{locale}/forms/submissions/{submissionId}` rendering the submission read-only.

- [ ] **Step 1: Extract the reusable renderer**

Create `apps/frontend/src/domain/requirement-form/components/submission-view.tsx`. Lift `resolveFieldAnswer` and the table JSX from the admin page (`apps/frontend/src/app/[locale]/admin/[orgUId]/volunteers/form-submission/[submissionId]/page.tsx`, lines ~18–141) verbatim into this server component:

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui';
import { getFormatter, getTranslations } from 'next-intl/server';

type SubmissionField = {
  id: string;
  label: string;
  type: string;
  systemKey?: string | null;
  options?: { label: string; value: string }[] | null;
};

type SubmissionValue = { fieldId: string; value: string };

const resolveFieldAnswer = (
  field: SubmissionField,
  submissionValues: SubmissionValue[],
  profileData: Record<string, unknown>,
  dash: string,
  accepted: string,
  formatDate: (date: Date) => string,
): string => {
  const raw =
    field.systemKey && profileData[field.systemKey] !== undefined
      ? String(profileData[field.systemKey])
      : (submissionValues.find((v) => v.fieldId === field.id)?.value ?? null);
  if (!raw) return dash;
  if (field.type === 'DATE') {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : formatDate(d);
  }
  if (field.type === 'CHECKBOX' || field.type === 'DOCUMENT_ACKNOWLEDGEMENT') {
    return raw === 'true' ? accepted : dash;
  }
  if (field.type === 'MULTI_CHOICE') {
    const options = field.options ?? [];
    return raw
      .split(',')
      .map((v) => options.find((o) => o.value === v)?.label ?? v)
      .join(', ');
  }
  if (field.type === 'STATIC_TEXT') return dash;
  return raw;
};

export const SubmissionView = async ({
  fields,
  submissionValues,
}: {
  fields: SubmissionField[];
  submissionValues: SubmissionValue[];
}) => {
  const t = await getTranslations('MembershipDetail.submission');
  const tCommon = await getTranslations('Common');
  const format = await getFormatter();
  const formatDate = (date: Date) => format.dateTime(date, { dateStyle: 'medium' });

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/2">{t('fieldColumn')}</TableHead>
            <TableHead>{t('answerColumn')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                {t('noFields')}
              </TableCell>
            </TableRow>
          ) : (
            fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell className="font-medium">{field.label}</TableCell>
                <TableCell>
                  {resolveFieldAnswer(
                    field,
                    submissionValues,
                    {},
                    tCommon('dash'),
                    t('accepted'),
                    formatDate,
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
```

Note: `profileData` is empty `{}` here — the volunteer view shows only the form answers, not system profile fields (those are edited via VOLI-943). Confirm `Common.dash` exists; if not, add it (see Step 3).

- [ ] **Step 2: Create the route page**

Create `apps/frontend/src/app/[locale]/(volunteering)/forms/submissions/[submissionId]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MembershipDetailHeader } from '@/domain/memberships/components/membership-detail-header';
import { SubmissionView } from '@/domain/requirement-form/components/submission-view';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';

type Props = {
  params: Promise<{ locale: string; submissionId: string }>;
};

export default async function FormSubmissionPage({ params }: Props) {
  const { locale: rawLocale, submissionId } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const data = await getDataClient();
  const submission = await data.requirementForm.findMySubmission(submissionId);
  if (!submission) notFound();

  const t = await getTranslations('MembershipDetail.submission');

  const fields =
    submission.form?.blockRefs
      ?.slice()
      .sort((a, b) => a.fieldOrder - b.fieldOrder)
      .flatMap((ref) => ref.block.fields ?? []) ?? [];

  return (
    <div className="space-y-6">
      <MembershipDetailHeader />
      <div>
        <h1 className="page-title">{submission.form?.name}</h1>
        <p className="text-muted-foreground mt-1">{t('submittedOn', { date: new Date(submission.submittedAt).toLocaleDateString(locale) })}</p>
      </div>
      <SubmissionView fields={fields} submissionValues={submission.values ?? []} />
    </div>
  );
}
```

`MembershipDetailHeader` is created in Task 6. To keep this task independently compilable, either (a) implement Task 6's header first, or (b) temporarily inline `<DetailPageHeader transparent onBack={...} />` via a tiny client wrapper here. Recommended: do Task 6's header file now as part of this step (it's 15 lines) — but to respect task boundaries, this task creates a minimal local header inline and Task 6 extracts the shared one. **Decision:** create `MembershipDetailHeader` in this task (Step 2b) so both routes share it.

- [ ] **Step 2b: Create the shared header wrapper**

Create `apps/frontend/src/domain/memberships/components/membership-detail-header.tsx`:

```tsx
'use client';

import { DetailPageHeader } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

type MembershipDetailHeaderProps = {
  title?: string;
  logoUrl?: string | null;
};

export const MembershipDetailHeader = ({ title, logoUrl }: MembershipDetailHeaderProps) => {
  const router = useRouter();
  const t = useTranslations('Common');
  return (
    <DetailPageHeader
      title={title}
      onBack={() => router.back()}
      backLabel={t('back')}
      logoUrl={logoUrl}
    />
  );
};
```

- [ ] **Step 3: Add i18n keys**

In `apps/frontend/messages/en.json`, add a top-level `MembershipDetail` namespace (the drill-in page in Task 6 adds the rest; here add the submission subset + ensure `Common.dash`):

```json
"MembershipDetail": {
  "submission": {
    "fieldColumn": "Field",
    "answerColumn": "Answer",
    "noFields": "This form has no fields.",
    "accepted": "Accepted",
    "submittedOn": "Submitted on {date}"
  }
}
```

If `Common.dash` does not exist, add `"dash": "—"`. Add the exact same keys (German) to `apps/frontend/messages/de.json`: `fieldColumn: "Feld"`, `answerColumn: "Antwort"`, `noFields: "Dieses Formular hat keine Felder."`, `accepted: "Akzeptiert"`, `submittedOn: "Eingereicht am {date}"`.

- [ ] **Step 4: Type-check + lint**

Run: `./node_modules/.bin/tsc --noEmit -p apps/frontend/tsconfig.json`
Run: `./node_modules/.bin/biome check apps/frontend/src/domain/requirement-form/components/submission-view.tsx 'apps/frontend/src/app/[locale]/(volunteering)/forms/submissions/[submissionId]/page.tsx' apps/frontend/src/domain/memberships/components/membership-detail-header.tsx`
Expected: no errors. (Manual verification: navigate to `/de/forms/submissions/<id>` for one of your submissions — renders the table read-only.)

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/domain/requirement-form/components/submission-view.tsx \
        'apps/frontend/src/app/[locale]/(volunteering)/forms/submissions/[submissionId]/page.tsx' \
        apps/frontend/src/domain/memberships/components/membership-detail-header.tsx \
        apps/frontend/messages/en.json apps/frontend/messages/de.json
git commit --no-verify -m "feat(profile): volunteer read-only submission view + shared SubmissionView"
```

---

### Task 6: Frontend — the drill-in page + form card

**Files:**
- Create: `apps/frontend/src/domain/memberships/components/membership-form-card.tsx`
- Create: `apps/frontend/src/app/[locale]/(volunteering)/profile/memberships/[membershipId]/page.tsx`
- Modify: `apps/frontend/messages/en.json` + `messages/de.json`

**Interfaces:**
- Consumes: `data.membership.findMineById(id)` + `data.requirementForm.findMyOrgUnitForms(organizationUnitId)` (Task 4); `MembershipStatusBadge` from `@/domain/memberships/components/membership-status-badge`; `MembershipDetailHeader` (Task 5); `Link` from `@/i18n/navigation`; `useFormatter`/`getTranslations`.
- Produces: route `/{locale}/profile/memberships/{membershipId}`.

- [ ] **Step 1: Create the form card component**

Create `apps/frontend/src/domain/memberships/components/membership-form-card.tsx` — a pure presentational server component. The page (Step 2) resolves all translated strings and the href, so the card has no hooks. The action link uses next-intl's `<Link>` (auto-prefixes locale), so `actionHref` is **locale-relative** (no `/de` prefix). `target="_blank"` opens it in a new tab.

```tsx
import { Badge, Card, CardAction, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { FileText } from 'lucide-react';
import { Link } from '@/i18n/navigation';

type MembershipFormCardProps = {
  name: string;
  statusLabel: string;
  completed: boolean;
  description: string;
  actionLabel: string;
  actionHref: string;
};

export const MembershipFormCard = ({
  name,
  statusLabel,
  completed,
  description,
  actionLabel,
  actionHref,
}: MembershipFormCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FileText className="size-4 text-muted-foreground" />
        <span>{name}</span>
      </CardTitle>
      <CardAction>
        <Badge variant={completed ? 'success' : 'alert'}>{statusLabel}</Badge>
      </CardAction>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{description}</p>
      <Link
        href={actionHref}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start"
      >
        {actionLabel}
      </Link>
    </CardContent>
  </Card>
);
```

- [ ] **Step 2: Create the drill-in page**

Create `apps/frontend/src/app/[locale]/(volunteering)/profile/memberships/[membershipId]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { MembershipDetailHeader } from '@/domain/memberships/components/membership-detail-header';
import { MembershipFormCard } from '@/domain/memberships/components/membership-form-card';
import { MembershipStatusBadge } from '@/domain/memberships/components/membership-status-badge';
import { routes } from '@/lib/routes';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';

type Props = { params: Promise<{ locale: string; membershipId: string }> };

export default async function MembershipDetailPage({ params }: Props) {
  const { locale: rawLocale, membershipId } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const data = await getDataClient();
  const membership = await data.membership.findMineById(membershipId);
  if (!membership) notFound();

  const forms = await data.requirementForm.findMyOrgUnitForms(
    membership.organizationUnit.id,
  );

  const t = await getTranslations('MembershipDetail');
  const format = await getFormatter();
  const formatDate = (date: Date | string) =>
    format.dateTime(new Date(date), { dateStyle: 'medium' });

  const orgUnit = membership.organizationUnit;
  const title = orgUnit.parent ? `${orgUnit.organization.name} · ${orgUnit.name}` : orgUnit.organization.name;

  return (
    <div className="space-y-6">
      <MembershipDetailHeader title={title} logoUrl={orgUnit.logoUrl} />

      <section className="space-y-1">
        <MembershipStatusBadge state="accepted" />
        {membership.roles.length > 0 && (
          <p className="text-muted-foreground">
            {t('role')}: {membership.roles.map((r) => r.name).join(', ')}
          </p>
        )}
        <p className="text-muted-foreground">{t('joinedDate', { date: formatDate(membership.createdAt) })}</p>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">{t('forms.title')}</h2>
          <p className="text-muted-foreground text-sm">{t('forms.subtitle')}</p>
        </div>
        {forms.map((item) => (
          <MembershipFormCard
            key={item.form.id}
            name={item.form.name}
            statusLabel={t(item.completed ? 'forms.status.completed' : 'forms.status.notCompleted')}
            completed={item.completed}
            description={
              item.completed
                ? t('forms.completedOn', { date: formatDate(item.submittedAt!) })
                : t('forms.notCompletedPrompt')
            }
            actionLabel={t(item.completed ? 'forms.view' : 'forms.fillIn')}
            actionHref={item.completed ? routes.formSubmission(item.submissionId!) : routes.publicForm(item.form.shareToken)}
          />
        ))}
      </section>
    </div>
  );
}
```

`routes.formSubmission` / `routes.publicForm` are path helpers — see Step 3. `MembershipStatusBadge` already accepts `state="accepted"` (verify it handles `'accepted'`; if its `state` union only has `requested|declined`, extend it to include `'accepted'` — this was done in VOLI-942; confirm via grep). `joinedDate` reuses the existing `MembershipRequest.meta.joinedDate` key — but we're in `MembershipDetail` namespace; add a local `joinedDate` key instead (Step 4) and use `t('joinedDate', ...)`.

- [ ] **Step 3: Add route helpers**

In `apps/frontend/src/lib/routes.ts` (create if absent, else extend), add **locale-relative** path builders (next-intl's `<Link>` prepends the locale, so do NOT include `/${locale}` here — verify by grepping an existing next-intl `<Link>` usage; if the codebase uses plain `next/link` with locale-prefixed paths instead, switch these to include the locale):

```typescript
export const routes = {
  publicForm: (token: string) => `/f/${token}`,
  formSubmission: (submissionId: string) => `/forms/submissions/${submissionId}`,
};
```

If a `routes.ts` already exists with a different shape, merge these in rather than overwriting. Grep for an existing `routes` export first.

- [ ] **Step 4: Add the i18n keys**

Extend the `MembershipDetail` namespace in `apps/frontend/messages/en.json` (merge with Task 5's keys):

```json
"MembershipDetail": {
  "role": "Role",
  "joinedDate": "Joined · {date}",
  "forms": {
    "title": "Your forms",
    "subtitle": "Forms this organisation has asked you to fill in.",
    "status": { "completed": "Completed", "notCompleted": "Not completed" },
    "fillIn": "Fill in form",
    "view": "View",
    "completedOn": "You filled in the form on {date}",
    "notCompletedPrompt": "This organisation has asked you to fill in this form."
  },
  "submission": { /* ...from Task 5... */ }
}
```

Add the matching German keys to `de.json`: `role: "Rolle"`, `joinedDate: "Beigetreten · {date}"`, `forms.title: "Deine Formulare"`, `forms.subtitle: "Formulare, die diese Organisation von dir anfordert."`, `forms.status.completed: "Abgeschlossen"`, `forms.status.notCompleted: "Nicht abgeschlossen"`, `forms.fillIn: "Formular ausfüllen"`, `forms.view: "Ansehen"`, `forms.completedOn: "Du hast das Formular am {date} ausgefüllt."`, `forms.notCompletedPrompt: "Diese Organisation hat dich gebeten, dieses Formular auszufüllen."`

- [ ] **Step 5: Type-check + lint**

Run: `./node_modules/.bin/tsc --noEmit -p apps/frontend/tsconfig.json`
Run: `./node_modules/.bin/biome check .`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/domain/memberships/components/membership-form-card.tsx \
        'apps/frontend/src/app/[locale]/(volunteering)/profile/memberships/[membershipId]/page.tsx' \
        apps/frontend/src/lib/routes.ts apps/frontend/messages/en.json apps/frontend/messages/de.json
git commit --no-verify -m "feat(profile): membership drill-in page with per-form cards"
```

---

### Task 7: Frontend — link the accepted S1 card to the drill-in

The entry-point AC: tapping an accepted membership card opens the detail.

**Files:**
- Modify: `apps/frontend/src/domain/memberships/components/membership-card.tsx`
- Modify: `apps/frontend/src/lib/routes.ts` (add `membershipDetail`)

**Interfaces:**
- Consumes: the accepted `MembershipEntry` (`{ state: 'accepted'; id; organizationName; orgUnit; roles; date }`); existing `LeaveMembershipButton`.
- Produces: the accepted card navigates to `/{locale}/profile/memberships/{id}`.

- [ ] **Step 1: Add the route helper**

In `apps/frontend/src/lib/routes.ts`, add (locale-relative — see Task 6 Step 3 note):

```typescript
membershipDetail: (membershipId: string) => `/profile/memberships/${membershipId}`,
```

- [ ] **Step 2: Make the accepted card navigable via a `detailHref` prop**

`MembershipCard` is a server component; keep it that way (no `useLocale`/`'use client'`). Add an optional `detailHref?: string` prop and, in the **accepted branch only**, wrap the card-title content in a next-intl `<Link>` so tapping the title navigates. Keep `MembershipStatusBadge` (`CardAction`) and `LeaveMembershipButton` (`CardContent`) **outside** the `<Link>` — a `<button>` cannot nest in an `<a>`, and tapping them must not navigate.

In `apps/frontend/src/domain/memberships/components/membership-card.tsx`:

```tsx
import { Link } from '@/i18n/navigation';
// add `detailHref?: string` to the component's props type
// accepted branch — wrap only the title content:
<CardTitle className="flex min-w-0 flex-1 items-center gap-2">
  {detailHref ? (
    <Link href={detailHref} className="flex min-w-0 flex-1 items-center gap-2">
      <OrgUnitAvatar name={orgUnit.name} logoUrl={orgUnit.logoUrl} typeIcon={orgUnit.typeIcon} />
      <span>{organizationName}</span>
      {!orgUnit.isRoot && <span>{orgUnit.name}</span>}
    </Link>
  ) : (
    <>{/* existing non-link title rendering */}</>
  )}
</CardTitle>
```

Leave the rest of the accepted card (status badge, roles, joined date, Leave button) unchanged.

- [ ] **Step 3: Pass `detailHref` from the profile page**

In `apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx`, where accepted `MembershipCard`s are rendered, pass the locale-relative href (import `routes` from `@/lib/routes`):

```tsx
<MembershipCard entry={entry} detailHref={routes.membershipDetail(entry.id)} />
```

- [ ] **Step 4: Type-check + lint + manual verify**

Run: `./node_modules/.bin/tsc --noEmit -p apps/frontend/tsconfig.json`
Run: `./node_modules/.bin/biome check .`
Manual: on `/de/profile`, tap an accepted card's title → navigates to the drill-in; the Leave button still works without navigating.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/domain/memberships/components/membership-card.tsx \
        apps/frontend/src/app/[locale]/(volunteering)/profile/page.tsx \
        apps/frontend/src/lib/routes.ts
git commit --no-verify -m "feat(profile): make accepted membership cards link to the drill-in"
```

---

## Verification (end-to-end, after Task 7)

- Backend type-check + integration test green; `schema.gql` regenerated.
- `packages/data` codegen + type-check green.
- Frontend type-check + biome green.
- Manual flow: `/de/profile` → tap accepted card → drill-in shows Accepted badge, role (if any), `Joined · <date>`, and one card per submitted/requested form; "Fill in form" opens `/de/f/<token>` in a new tab; "View" opens `/de/forms/submissions/<id>` read-only; back returns to profile.

## Open details resolved by the implementer (non-blocking, called out inline)
- `event_invites` status filter (currently all statuses for the user) and whether event-required forms should require a non-declined invite.
- Whether `MembershipStatusBadge` already supports `state="accepted"` (VOLI-942) — extend if not.
- Exact name of `RequirementFormMapper` and whether it's injected into the chosen resolver (Task 2 Step 5).
- Whether `routes.ts` exists; merge helpers rather than overwrite.
