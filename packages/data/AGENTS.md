# Data access library for use in frontend

A data wrapper around the GraphQL api. All queries and mutations in the frontend go via this package. The front does use the GraphQL api directly.

## Commands

- `bun run check-types` - Check for any typescript compile errors
- `bun run codegen` - Generates Typescript interfacing code for *.graphql queries and mutations

## Project Structure

src/
├── repositories  # Domain based repositories to query and mutate data in RSC and Server Actions
└── react         # Tanstack Query hooks to query and mutate data in client components


## Patterns

- Repositories 'wrap' the GraphQL queries and mutations (*.graphql)
- GraphQL queries and mutations (*.graphql) are co-located with the repositories that use them.
