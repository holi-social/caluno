# Hanseatic Help — volunteer check-in (prototype)

Next.js app for a short volunteer check-in flow (start / finish / manual times → optional profile → thank-you). Built for experiments around Hanseatic Help–style volunteering.

## Requirements

- [Bun](https://bun.sh/) (scripts use `bun --bun` for Next)

## Setup

From the monorepo root, install dependencies (workspace-aware):

```bash
bun install
```

Copy environment variables and adjust as needed:

```bash
cp apps/prototypes/hanseatic-help-experiment/.env.example apps/prototypes/hanseatic-help-experiment/.env
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DB_*` | PostgreSQL connection (used when persistence is Postgres; see below) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin UI login |
| `ADMIN_SESSION_SECRET` | Secret for encrypted admin session cookies |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible site domain; omit to disable analytics |
| `HELP_EXPERIMENT_STORAGE` | Optional: `json` or `postgres` / `pg` to force storage backend |

### Local data storage

By default in development, entries are stored as JSON under `data/` (no database required). In production, the app uses Postgres unless you set `HELP_EXPERIMENT_STORAGE=json`.

To use Postgres locally:

```bash
HELP_EXPERIMENT_STORAGE=postgres
```

Then run migrations from this app directory:

```bash
cd apps/prototypes/hanseatic-help-experiment
bun run db:migrate
```

Schema and migrations live in `src/db/`.

## Scripts

Run from `apps/prototypes/hanseatic-help-experiment/`:

| Script | Description |
| --- | --- |
| `bun run dev` | Next dev server on **port 3001** |
| `bun run build` / `bun run start` | Production build and server |
| `bun run check-types` | TypeScript |
| `bun run lint` / `bun run format` | Biome |
| `bun run db:generate` / `db:migrate` / `db:push` / `db:studio` | Drizzle |

## App structure

- **`src/app/page.tsx`** — Client wizard: form steps and API calls to `/api/entries`.
- **`src/components/steps/`** — UI for each step.
- **`src/app/admin/`** — Password-protected admin UI (session via iron-session).
- **`src/components/plausible-analytics.tsx`** — Plausible `init` (dynamic import, admin URLs filtered); global custom properties below.
- **`src/lib/volunteer-wizard-plausible.ts`** — Wizard custom events and per-event props (see [Analytics](#analytics)).

## Docker

The `Dockerfile` in this folder expects a **monorepo build context** (repo root): it copies `apps/`, `packages/`, lockfile, and builds this app. Use it from the repository root per the paths in the Dockerfile.

## Analytics

Uses [`@plausible-analytics/tracker`](https://www.npmjs.com/package/@plausible-analytics/tracker). `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` must match the domain configured in Plausible. Localhost sends events when `NODE_ENV === 'development'` (`captureOnLocalhost`).

Implementation: `src/components/plausible-analytics.tsx` (`init`) and `src/lib/volunteer-wizard-plausible.ts` (`track`).

In the Plausible dashboard, add **custom events** and **custom properties** (see [Plausible: custom props](https://plausible.io/docs/custom-props/introduction)) so goals and breakdowns include the names below.

### Global custom properties (`init`)

These are attached via `customProperties` on `init` and apply to **automatic** events (for example pageviews) together with anything the tracker merges them into.

| Property | Value | Notes |
| --- | --- | --- |
| `analytics_app` | `hanseatic_help_volunteer_check_in` | Identifies this app in shared-domain or multi-surface reporting. |

Other `init` behavior:

- **`formSubmissions: true`** — automatic form submission events from the tracker.
- **`transformRequest`** — drops events whose URL is `/admin`, `/admin/*`, `/api/admin`, or `/api/admin/*` (admin UI and admin API are excluded from Plausible).

### Custom events (manual `track`)

#### `VolunteerCheckInWizardStepViewed`

Fires when the wizard step changes (including the first screen). One row per navigation to a step.

| Property | Description |
| --- | --- |
| `wizard_step_id` | `form-1`, `form-2-1`, `form-2-2`, `form-2-3`, `form-3`, or `form-4`. |
| `wizard_step_name` | English label for reporting (see mapping below). |

#### `VolunteerCheckInWizardStepCompleted`

Fires after a successful API write and before advancing to the next step. **No PII** (no name, email, or free-text times).

| Property | Description |
| --- | --- |
| `completed_step_id` | Step the user finished (`form-1` … `form-3`). |
| `completed_step_name` | English label for `completed_step_id`. |
| `next_step_id` | Next wizard step. |
| `next_step_name` | English label for `next_step_id`. |
| `check_in_intent` | **Optional.** `starting`, `finishing`, or `break`. Set when leaving `form-1`, `form-2-1` / `form-2-2` / `form-2-3`, or `form-3` (from current flow context). |
| `planned_duration_hours` | **Optional.** Integer hours when completing `form-2-1` (starting flow). |
| `gdpr_consent_recorded` | **Optional.** `true` or `false` when completing `form-3` (consent checkbox only, not identity). |

### `wizard_step_id` → `wizard_step_name` (reference)

| `wizard_step_id` | `wizard_step_name` |
| --- | --- |
| `form-1` | Check-in type (start, finish, or manual times) |
| `form-2-1` | Planned volunteering duration |
| `form-2-2` | Arrival time when finishing |
| `form-2-3` | Manual start and end times |
| `form-3` | Volunteer name, email, and consent |
| `form-4` | Thank-you confirmation |
