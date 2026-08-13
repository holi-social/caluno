# Caluno

A multi-tenant project for managing volunteers and shifts in organizations.

## Monorepo structure
Mono-repo powered by TurboRepo.
```
├── apps                    # Entrypoints, each exposes an app or service
│   ├── backend             # Backend graphQL api service - NestJS, Postgres
│   └── frontend            # Main web app - NextJS (includes the backoffice at /admin/[orgUId])
└── packages                # Shared code imported by the apps and services
    ├── data                # Shared data library - graphQL queries and mutations
    ├── infra               # Terraform config for deploying the services and apps
    ├── typescript-config   # Shared typescript config
    └── ui                  # Shared react components and styles - shadcn, tailwind, storybook
```
Primary flow of data: frontend → @repo/data → backend → database. There is no separate backoffice app — the backoffice lives in the frontend under `(dashboard)/[orgUId]` (`/admin` routes).

## Root Commands
Use `bun` - never npm or yarn.
- `bun run dev` - Starts backend, frontend and storybook dev servers
- `bun run lint` - Lints all packages
- `bun run format` - Formats all packages
- `bun run check-types` - Checks for type errors in all packages
- `bun run db:migrate` - Migrates database schema
- `bun run db:up` / `bun run db:down` - Start/stop local Postgres
- `bun run codegen` - Regenerate GraphQL types (schema + *.graphql)

