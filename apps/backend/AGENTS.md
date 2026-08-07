# Caluno Backend GraphQL API

The backend api for securely managing volunteers and shifts in multi-tiered organizations.

## Commands
- `bun run dev` - Start NestJS development server
- `bun bootstrap` (from repo root) - Wipe local Postgres volume, migrate, seed permissions, load Playground fixtures, then start all dev servers
- `bun run db:fixtures` - Load Playground dev fixtures only (run after migrate + seed)
- `bun run build` - Build a production bundle
- `bun run lint` - Lint with Biome
- `bun run format` - Format with Biome
- `bun run check-types` - Check for type errors
- `bun run test` - Jest unit tests (`src/**/*.spec.ts`; pattern: `src/notification/notification.spec.ts`)
- `bun test apps/backend/test/` - Bun integration tests; creates an isolated `${POSTGRES_DB}_test_<pid>_<id>` database per run, migrates/seeds, then drops it when the process exits
- `bun run --cwd apps/backend test:integration` - Same as `bun test test/` from `apps/backend`
- `bun run db:generate` - Generate database migrations based on schema changes
- `bun run db:migrate` - Run drizzle database migrations

## Testing

### Test runners
The backend has two test suites:

1. **Unit tests** — Jest, files under `src/**/*.spec.ts`.
   - Use for pure business logic, event handlers, and utilities that do not touch the database.
   - Mock external collaborators (services, repositories, event emitters).
   - Run with `bun run test`.

2. **Integration tests** — `bun:test`, files under `test/*.integration.spec.ts`.
   - Use for anything that depends on actual SQL queries, transactions, GraphQL resolvers, auth guards, or multi-tenancy scoping.
   - They spin up the real NestJS app and connect to a PostgreSQL database.
   - The preload script provisions a fresh isolated database (create → migrate → seed permissions) in a global `beforeAll` before any integration spec runs, then drops it in global `afterAll` when the process exits.
   - Run with `bun test apps/backend/test/` (or `bun test` from `apps/backend`).

### Writing integration tests

Use the shared test context and factories. Do not duplicate setup boilerplate.

```typescript
import { beforeAll, describe, expect, it, mock, setDefaultTimeout } from 'bun:test';
import type { INestApplication } from '@nestjs/common';
import type { Database } from '../src/database/database.module';
import { applyBunAuthMocks } from './helpers/auth-mocks';
import { getGraphqlTestContext } from './helpers/graphql-test-context';
import { createShift, createShiftInstance, createUser } from './factories';

applyBunAuthMocks(mock.module);
setDefaultTimeout(20_000);

describe('Shift feature', () => {
  let app: INestApplication;
  let db: Database;
  let organizationUnitId: string;

  beforeAll(async () => {
    const context = await getGraphqlTestContext();
    app = context.app;
    db = context.db;
    organizationUnitId = context.organizationUnitId;
  });

  it('does something useful', async () => {
    const user = await createUser(db);
    const shift = await createShift(db, { organizationUnitId });
    const instance = await createShiftInstance(db, shift.id);
    // act + assert
  });
});
```

### Factory rules

Factories live in `test/factories/`, all inserting directly into the database
(mirroring what the corresponding service method persists) rather than going
through GraphQL — this keeps test setup decoupled from the resolvers/services
the tests actually exercise:

- **`createUser(db, overrides?)`** — inserts into `users` directly.
- **`createShift(db, options)`** — inserts into `shifts` (plus expanded `shiftInstances`) directly.
- **`createShiftInstance(db, shiftId, overrides?)`** — inserts into `shiftInstances` directly for cases that need extra instances beyond the ones created by `createShift`.
- **`createEvent(db, options)`** — inserts into `events` directly.
- **`createMembershipRequest(db, { userId, organizationUnitId, metadata? })`** — inserts into `membershipRequests` directly.
- **`cancelShiftInstance(db, instanceId)`** — helper to set `isCancelled = true`.

Guidelines:
- Always pass `organizationUnitId` from the test context; never hard-code one.
- Use `crypto.randomUUID()` in names/emails to avoid collisions when tests run against the same test DB.

### What to test

- **Multi-tenancy:** any query/mutation that takes an `organizationUnitId` must reject or hide cross-org data. Add integration tests for scoping.
- **Soft deletes:** queries that should exclude `isDeleted` records.
- **Permissions:** mutations guarded by `@Permissions()` should return `ForbiddenGraphQLError` when the caller lacks access.
- **Business invariants:** capacity checks, invite deduplication, membership request approval scoping, etc.
- **Error shapes:** use `graphqlRequest` (not `graphqlRequestRequiringData`) and assert on `response.errors[0].message` when testing error paths.

### Running integration tests locally

```bash
# Start Postgres (only needed once)
bun run db:up

# Run integration tests (creates and drops an isolated test database automatically)
bun test apps/backend/test/
```

Integration tests connect to the `postgres` maintenance database to create/drop an isolated `${POSTGRES_DB}_test_<pid>_<id>` database, so the Postgres user needs CREATEDB privileges (the default `postgres` superuser has this).

### Playground fixtures (`bun bootstrap`)

`bun bootstrap` resets the **development** database (not `_test`) via `docker compose down -v`, then migrates, seeds permissions, and loads [`src/database/fixtures.ts`](src/database/fixtures.ts). Refuses to run unless `DB_HOST` is `localhost`, `127.0.0.1`, or `postgres`.

The same fixture script is used for staging via `bun run db:fixtures:staging`.

| Account | Role / status |
|---|---|
| `testing+admin@caluno.org` | Owner |
| `testing+supervisor@caluno.org` | Supervisor |
| `testing+demo@caluno.org` | Member (demo account) |
| `testing+001@` … `testing+010@caluno.org` | Member |
| `testing+pending01@`, `testing+pending02@caluno.org` | Pending membership request |
| `testing+rejected01@caluno.org` | Rejected membership request |

Password for all fixture accounts: `abcd1234` (override with `FIXTURE_PASSWORD`). Organization: **Playground**. Shifts (weekly, Europe/Berlin): Community Support (Mon 08:00–12:00), Food Distribution (Wed 12:00–16:00), Event Assistance (Fri 16:00–20:00). Requirement form: Personal Information — block with required First name and Last name fields.

## Tech Stack
- **NestJS 11** primary web framework
- **TypeScript** with strict mode
- **GraphQL** Apollo Server using Code-First approach
- **Drizzle ORM** for database management (PostgreSQL)
- **Better Auth** authentication framework
- **Biome** for linting and formatting (not ESLint/Prettier)

## Multi-Tenancy — CRITICAL
1. **NEVER** accept `orgId` / `organizationUnitId` from GraphQL arguments for auth decisions — always from `ctx.organizationUnitId` (derived from the `x-organization-unit-id` header, validated by the guard)
2. **ALL** DB queries must be scoped by `organizationId` or `organizationUnitId`
3. **NEVER** return cross-org data, including from field resolvers
4. Permission checks via `authService.hasRequiredPermissions` (inherits through the org unit hierarchy) — never raw DB lookups
5. All mutations carry `@Permissions()` — no unguarded writes. Input validation via class-validator on all `@InputType()` classes

## Project Structure
```
src/
├── auth        # Authorization - role based permissions
├── database    # Drizzle config, schema and migrations
├── graphql     # Custom graphQL extensions
├── shared      # Shared generic code
├── utils       # Shared generic code
test/
```
Domain modules (`organization`, `membership`, `user`, `shift`, `time-tracking`, `requirement-profile`, `notification`) are self-contained NestJS modules:
```
domain/
├── domain.module.ts
├── schemas/      # Drizzle table definitions
├── models/       # GraphQL @ObjectType classes
├── inputs/       # GraphQL @InputType classes
├── resolvers/    # *-query / *-mutation / *-field resolvers + loader.ts
├── services/     # Business logic
├── mappers/      # Drizzle entity -> GraphQL model (*.mapper.ts)
└── enums/
```

## Patterns
- GraphQL schema is code-first via decorators. `src/schema.gql` is auto-generated — never edit it manually.
- GraphQL context shape: `{ req, locale, user?, organizationUnitId?, loaders? }` (`graphql/graphql.context.ts`). `locale` is request metadata, not a GraphQL arg. For authenticated users it is read from `users.locale`; when that is absent it is detected from `Accept-Language` → `x-locale` → `en` and persisted to `users.locale`. For anonymous users it is resolved from `x-locale` → `Accept-Language` → `en` without persistence. In resolvers: `@Session() session`, `@Context() ctx`.
- Resolvers: `@Permissions(PERMISSIONS.X)` guard on the method; queries/mutations/field-resolvers in separate files per domain.
- N+1 prevention is mandatory for field resolvers: `@RegisterLoader()` + `@Injectable({ scope: Scope.REQUEST })` DataLoader classes, injected via `@Loader(ChildLoader)`. Never query per-parent in a `@ResolveField`.
- Mappers extend `BaseMapper`: `toModel()`, `toModelOrThrow()`, `toArray()`.
- Errors: throw `ForbiddenGraphQLError` / `NotFoundGraphQLError` / `BadRequestGraphQLError` / `ConflictGraphQLError` from `graphql/errors` — never raw exceptions.
- GraphQL InputType Field defined with { nullable: true } need to be typed as optional and nullable: `fieldname?: type | null`
- **File bytes never go through GraphQL.** Uploads use REST storage endpoints; GraphQL only links `fileId` to domain entities.

## Storage (REST)
Authenticated file uploads use presigned PUT to Scaleway Object Storage (MinIO locally). Module: `src/storage/`.

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /storage/uploads/presign` | Session + purpose-specific `@Permissions()` | Mint presigned PUT URL; creates `files` row (`pending`) |
| `POST /storage/uploads/:fileId/complete` | Session (owner) | HEAD-verify object; set `uploaded` |
| `POST /storage/objects/:fileId/presign-download` | Session + owner or `requirement-profile:view` | Presigned GET for private files |

Env: `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`. Local dev: MinIO via root `docker-compose` (`:9000` API).

`StorageModule` applies `express.json()` middleware scoped to `/storage/*` because `main.ts` disables the global body parser for Better Auth.

## i18n
`AppI18nModule` wraps `nestjs-i18n` with catalogs at `src/i18n/locales/{locale}/*.json`. `AppI18nService.translate(locale, key)` and `createTranslator(locale, namespace)` are namespace-agnostic. `UserLocaleService` resolves locale via `UserService.resolveLocale` (stored user locale, request headers, fallback `en`). Transactional emails use namespace `email` via `createEmailTemplateContext()` in `notification/email/`; pure template functions take `{ t, formatDateTime, formatDate, formatTime, formatList }`. Date/time formatting uses `Europe/Berlin` and ICU regional tags `en-DE` / `de-DE` so English copy still follows German date order and 24h time. Auth callbacks forward Better Auth `request` headers; the frontend auth client sends `x-locale` from the `caluno.locale` cookie.

## Drizzle
Database schema in `src/database/schema.ts` (re-exports domain schemas; relations in `database/schema.relations.ts`).
- Use the shared column helpers: `...idColumn`, `...timestampColumns` from `database/database-columns`
- DB is `snake_case`; Drizzle auto-converts to `camelCase` (`casing: 'snake_case'`)
- Soft deletes via `deletedAt` timestamp — no hard deletes on important records
- Export entity types: `$inferSelect` / `$inferInsert`

### Querying: Relational Query v2 by default
For fetching entities and their relations, use Relational Query v2:
```typescript
const users = await db.query.users.findMany({ where: { id: 1 } });
```
Do **not** use Query v1 (`db._query…findMany({ where: (t,{eq}) => … })`).

`select().innerJoin()` is the accepted pattern **only** for aggregations and multi-table projections that RQ v2 can't express — counts, custom column projections, permission joins (see `auth.service.ts`, `organization.service.ts`, `membership.service.ts`). For plain entity/relation fetching, RQ v2 wins. When in doubt, RQ v2.

## Known constraints (decision-log extracts — architectural, must stay)
Update this section when a decision changes one of these (pipeline Decision routing). Each carries the decision that set it:
- **`UserProfile.data` is `@Field(() => GraphQLJSON)`**, not `String`. graphql-js v16 throws serializing an object as a String; returning it as String silently yielded `null`. (VOLI-592)
- **`FormSubmissionStatus` is `SUBMITTED` / `REJECTED` only** (no DRAFT/APPROVED). Gating logic keys off these two. (form-submission-status-simplification)
- **No `forwardRef` in `apps/backend`**. Module dependencies must form a DAG. Cycles are broken by extracting lower-level data modules (`OrganizationUnitDataModule`) or by moving cross-domain GraphQL field resolution into the higher-level module (`EventModule` owns the `Shift.event` field).
- **`OrganizationUnitDataModule`** sits below `AuthModule` in the dependency graph. `AuthService` uses `OrganizationUnitDataService` for ancestor-unit lookups and org resolution, so `AuthModule` does not depend on `OrganizationModule`.
- **Shift vs event participation are separate vocabularies — do not unify them.** `ShiftInstance` exposes only the raw `myInviteStatus` (nullable `ShiftInviteStatus`); there is no coarse `myJoinStatus`. The volunteer CTA is derived client-side from `myInviteStatus` + `OrganizationUnit.myMembershipState` (two orthogonal facts). Events are a lower-commitment "following" shortlist, so `Event.isFollowing` is a boolean — deliberately not shift-invite vocabulary; org membership state is read separately. Retiring the old ambiguous `myJoinStatus` projection is the reason for this split. (volunteer-shift-invite-response / VOLI-839)
- **`InviteStatus` (in `apps/frontend/src/domain/shift/invite-status-display.ts`) intentionally shares admin-invite vocabulary between shift and event.** `ShiftInviteStatus` and `EventInviteStatus` already mirror each other (`Invited`/`Accepted`/`SelfJoined`/`VolunteerRejected`/`Cancelled`/`AdminRejected`); `toInviteDisplayState()` maps both to the same `ShiftVolunteeringDisplayState` for admin UI (invite sheets, event/shift detail). This is a different axis from the follow vocabulary above (`isFollowing`/`myInviteStatus`), which stays unshared — this entry only covers the admin-invite enums. (event-invite-status-display / VOLI-1028)
- **Admin event uninvite cascades to event-linked shifts.** Setting an event invite to `ADMIN_REJECTED` also sets active shift + shift-instance invites for that user on shifts with the same `eventId` to `ADMIN_REJECTED` (via `ShiftService.adminRejectInvitesForEventUser`). No notification is sent. Re-invite does not reverse the cascade. (VOLI-997)
