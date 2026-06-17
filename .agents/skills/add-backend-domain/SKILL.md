---
name: add-backend-domain
description: How to add a new backend domain module or entity-with-resolvers in apps/backend (NestJS + GraphQL code-first + Drizzle). Use when a spec adds a new backend domain, a new entity with resolvers, or new mutations/queries on the GraphQL API.
metadata:
  type: workflow
---

# Adding a backend domain (apps/backend)

1. Module: `src/<domain>/<domain>.module.ts`, register in `app.module.ts` (watch for circular deps — `forwardRef` decisions go in the decision log / `apps/backend/AGENTS.md` known constraints).
2. Schema: `<domain>/schemas/` with `...idColumn`, `...timestampColumns`; export from `database/schema.ts`; relations in `schema.relations.ts`; then run the `drizzle-migration` skill.
3. Model (`@ObjectType`), inputs (`@InputType` + class-validator), mapper (`extends BaseMapper`, file `*.mapper.ts`).
4. Service: business logic; ALL queries org-scoped (Multi-Tenancy CRITICAL rules in `apps/backend/AGENTS.md`).
5. Resolvers: separate query/mutation/field files; `@Permissions()` on every mutation; field resolvers use the DataLoader pattern (`@RegisterLoader()`, request scope) — never per-parent queries.
6. Errors from `graphql/errors` only.
