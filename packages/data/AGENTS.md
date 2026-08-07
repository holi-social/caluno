# Data access library for use in frontend

A data wrapper around the GraphQL api. All queries and mutations in the frontend go via this package. The frontend does NOT use the GraphQL api directly.

## Commands
- `bun run check-types` - Check for any typescript compile errors
- `bun run codegen` - Generates Typescript interfacing code for *.graphql queries and mutations

## Project Structure
```
src/
├── repositories  # Domain based repositories to query and mutate data in RSC and Server Actions
├── react         # Tanstack Query hooks to query and mutate data in client components
├── generated     # codegen output (graphql.ts) — auto-generated, NEVER edit manually
└── errors        # DataError, ForbiddenDataError
```

## Patterns
- Repositories 'wrap' the GraphQL queries and mutations (*.graphql)
- GraphQL queries and mutations (*.graphql) are co-located with the repositories that use them
- Locale is request metadata: pass `locale` to `createDataClient` / `DataProvider`; `@repo/data` maps it to the `x-locale` header. The Better Auth client also sends `x-locale` from the `caluno.locale` cookie (with a pathname fallback) on every auth request.
- Adding a query/mutation: see skill `.agents/skills/add-data-query`
