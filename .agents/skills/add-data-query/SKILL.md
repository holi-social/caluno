---
name: add-data-query
description: How to add a GraphQL query/mutation to the @repo/data package so it reaches the frontend (codegen + repository + Tanstack hook). Use when a spec requires new data to flow from the backend GraphQL API to apps/frontend.
metadata:
  type: workflow
---

# Adding a query/mutation to @repo/data

1. Write the `.graphql` file co-located in `repositories/<domain>/`.
2. `bun run codegen` — regenerates `src/generated/graphql.ts` (NEVER edit generated output).
3. Add the method to the domain repository class using the generated SDK function.
4. New domain: expose the repository on the DataClient.
5. Client components needing it: add the Tanstack Query hook in `src/react`.
6. Frontend consumes via `getDataClient(orgUId)` only — never raw GraphQL in apps/frontend.
