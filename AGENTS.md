# Clippy

A multi-tenant project for managing volunteers and shifts in organisations.

## Monorepo structure
This is a mono-repo project powered by TurboRepo.

src/
├── apps                    # Entrypoints, each exposes an app or service
│   ├── backend             # Backend graphQL api service - NestJS, Postgres
│   └── frontend            # Main web app - NextJS
└── packages                # Shared code that's imported by the apps and services
    ├── data                # Shared data library - graphQL qeries and mutations
    ├── infra               # Terraform config for deploying the services and apps 
    ├── typescript-config   # Shared typescript config
    └── ui                  # Share react components and styles - shadcn, tailwind, storybook

Primary flow of data: frontend → @repo/data → backend → database 

## Root Commands

Use `bun` - never use npm or yarn.

- `bun run dev` - Starts backend, frontend and storbook dev servers
- `bun run lint` - Lints all packges
- `bun run format` - Formats all packages
- `bun run check-types` - Checks for type errors in all packages
- `bun run db:migrate` - Migrates database schema
