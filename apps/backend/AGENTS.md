# Clippy Backend GraphQL API

The backend api for securely managing volunteers and shifts in multi-tiered organizations.

## Commands
- `bun run dev` - Start NestJS development server
- `bun run build` - Build a production bundle
- `bun run lint` - Lint with Biome
- `bun run format` - Format with Biome
- `bun run check-types` - Check for type errors
- `bun run test` - Jest unit tests (`src/**/*.spec.ts`; pattern: `src/notification/notification.spec.ts`)
- `bun test apps/backend/test/` - Bun integration tests (`test/*.integration.spec.ts`, `bun:test` API; need a migrated Postgres — `bun run db:up && bun run db:migrate`)
- `bun run --cwd apps/backend test:integration` - Drops/creates `clippy_test`, migrates it, and runs integration tests against the isolated test DB
- `bun run db:generate` - Generate database migrations based on schema changes
- `bun run db:migrate` - Run drizzle database migrations

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
- GraphQL context shape: `{ req, user?, organizationUnitId?, loaders? }` (`graphql/graphql.context.ts`). In resolvers: `@Session() session`, `@Context() ctx`.
- Resolvers: `@Permissions(PERMISSIONS.X)` guard on the method; queries/mutations/field-resolvers in separate files per domain.
- N+1 prevention is mandatory for field resolvers: `@RegisterLoader()` + `@Injectable({ scope: Scope.REQUEST })` DataLoader classes, injected via `@Loader(ChildLoader)`. Never query per-parent in a `@ResolveField`.
- Mappers extend `BaseMapper`: `toModel()`, `toModelOrThrow()`, `toArray()`.
- Errors: throw `ForbiddenGraphQLError` / `NotFoundGraphQLError` / `BadRequestGraphQLError` / `ConflictGraphQLError` from `graphql/errors` — never raw exceptions.

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
- **`FormSubmissionService` ↔ `MembershipService` circular dependency**: both inject each other; `forwardRef()` must stay on BOTH sides or DI breaks. (VOLI-592)
- **`UserProfile.data` is `@Field(() => GraphQLJSON)`**, not `String`. graphql-js v16 throws serializing an object as a String; returning it as String silently yielded `null`. (VOLI-592)
- **`FormSubmissionStatus` is `SUBMITTED` / `REJECTED` only** (no DRAFT/APPROVED). Gating logic keys off these two. (form-submission-status-simplification)
