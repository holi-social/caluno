# Clippy

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

## AI pipeline: varco (mandatory for agent sessions)

Development runs through the [varco](https://github.com/) statechart CLI. Everything it
owns lives under `.varco/` — loops, specs, config, state. **The primary mode: a human
drives `varco` (guided mode) and varco dispatches the coding agent** — see
[`.varco/README.md`](.varco/README.md) for the flow. The rules below exist for the other
case: when a human opens YOU, an interactive agent session, in this repo. Then:

- Run `varco status` first. If a task is active, your job is to advance THAT task —
  `varco preview` shows the next transition and its guard, `varco apply` advances
  (`varco run` drives until a human is needed). If `apply` reports a back-edge, fix the
  listed findings and apply again.
- When the loop prints SUSPENDED: **STOP.** Tell the human exactly what is awaited and
  the command that grants it. You cannot and must not grant it yourself.
- Never edit `.varco/state/`, `.varco/config.json`, `*.pub`, or `*.key` (the write-guard
  blocks these). Treat `.varco/specs/<slug>.json` as the contract — change it only when
  the human asks, before `spec_approved`.
- **No active varco task? You're unconstrained** — quick experiments, answers, and
  one-off edits are fine (only `.varco/state`, `.varco/config.json`, and key material stay
  off-limits, always). But anything that will become a merge request belongs in a varco
  task — and **while a task is active, its phase binds you**: source writes only in the
  write phase (IMPLEMENTING); the write-guard enforces it.

Skills carry the project's working discipline — the loop pipes them in; consult them by
name under `.agents/skills/` (clippy-tdd, grounding, scope-guard, commit-convention,
decision-routing, glossary-protocol, security-rubric, migration-safety, anti-patterns).

- **Code context**: this file plus the nested `AGENTS.md` in the package you're editing
  (`apps/frontend`, `apps/backend`, `packages/data`, `packages/ui`) — loaded by
  proximity. One fact lives in exactly one AGENTS.md, the deepest that contains it;
  parents never restate children.
- **Domain language**: `docs/GLOSSARY.md` — grep it for ticket nouns. Precedence:
  GLOSSARY wins on domain meaning, AGENTS.md wins on architecture, code wins on facts.
- **Design pipeline**: runs as `design-loop` (`varco start <slug> --loop design-loop`);
  overview in `design/DESIGN_PRODUCT_PIPELINE.md`, disciplines in the `design-*` skills.
  It produces briefs at `design/specs/<slug>.md`, consumed by `fromdesign-loop`. The
  write-guard fences design-loop tasks to the frontend + `design/` blast radius.
- **Enforcement**: CI on a protected `main` (required checks + human MR approval) is the
  only wall — see `docs/HUMAN_GUIDE.md`. The sole local guard is an optional write-phase
  hook (`.claude/settings.json` for Claude Code; other tools: `scripts/adapters/`).
- **Decisions**: every decision gets a `Decision:` commit trailer; architectural
  invariants also update the owning `AGENTS.md`, domain meanings also update
  `docs/GLOSSARY.md` (see the decision-routing skill).
