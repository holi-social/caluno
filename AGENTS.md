# Clippy

A multi-tenant project for managing volunteers and shifts in organisations.

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

## AI pipeline (mandatory for agent sessions)
The development pipeline lives in `.ai/`. **Humans start at [`.ai/README.md`](.ai/README.md)** (operator's guide: flow, commands, how to drive it). Agents read `.ai/PIPELINE.md` at the start of every session — it defines the phases (plan/write/read-only), the `>>` commands, the gates, and the verification agents. Bootstrap a session with `.ai/scripts/bootstrap.sh` (phase, current task, skills index).

- **Code context**: this file plus the nested `AGENTS.md` in the package you're editing (`apps/frontend`, `apps/backend`, `packages/data`, `packages/ui`) — loaded by proximity. One fact lives in exactly one AGENTS.md, the deepest that contains it; parents never restate children.
- **Domain language**: `.ai/GLOSSARY.md` — grep it for ticket nouns. Precedence: GLOSSARY wins on domain meaning, AGENTS.md wins on architecture, code wins on facts.
- **Enforcement**: CI on a protected `main` (required checks + human MR approval) is the only wall — see `.ai/HUMAN_GUIDE.md`. The sole local guard is an optional write-phase hook (`.claude/settings.json` for Claude Code, `.ai/adapters/kimi.config.toml` for Kimi); nothing to install locally.
- **Decisions**: every decision gets a `Decision:` commit trailer; architectural invariants also update the owning `AGENTS.md`, domain meanings also update `.ai/GLOSSARY.md`.
