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

In the Plausible dashboard, register **custom events** and **custom properties** as needed (see [Plausible: custom props](https://plausible.io/docs/custom-props/introduction)).

### Global custom properties (`init`)

Set on `init` as `customProperties`.

| Property | Value | Notes |
| --- | --- | --- |
| `analytics_app` | `hanseatic_help_volunteer_check_in` | Identifies this app in shared-domain or multi-surface reporting. |

Other `init` behavior:

- **`formSubmissions: true`** — automatic form submission events from the tracker.
- **`transformRequest`** — drops events whose URL is `/admin`, `/admin/*`, `/api/admin`, or `/api/admin/*` (admin UI and admin API are excluded from Plausible).

### Custom events (manual `track`)

#### `volunteer_wizard_action`

Single event for wizard behavior. Emitted for:
- step views (`action_type=view`)
- successful submits (`action_type=submit_success`)
- failed submits (`action_type=submit_error`)

| Property | Description |
| --- | --- |
| `action_type` | `view`, `submit_success`, or `submit_error`. |
| `step_name` | `check_in_intent_selection`, `planned_duration_selection`, `finish_arrival_time_input`, `break_time_range_input`, `volunteer_profile_and_consent`, `thank_you_confirmation`. |
| `check_in_intent` | `starting`, `finishing`, `break`, or `unknown` (before intent is selected). |
| `flow_variant` | `start_flow`, `finish_flow`, `break_flow`, or `unknown_flow`. |
| `session_wizard_id` | Non-PII random UUID for one wizard run, reused across all events in that run. |
| `planned_duration_hours` | **Optional.** Present only on `submit_success` for `planned_duration_selection`. |
| `gdpr_consent_recorded` | **Optional.** Present only on `submit_success` for `volunteer_profile_and_consent`. |
| `error_stage` | **Optional.** Present only on `submit_error` (`create_entry`, `patch_entry_duration`, `patch_entry_arrival`, `patch_entry_break_times`, `patch_entry_profile`). |

All event/property names and enum values use snake_case.  
No PII is tracked (no name, no email, no free-text times).

### Plausible funnel recipe

Use event `volunteer_wizard_action` with `action_type=submit_success`:
1. `step_name=check_in_intent_selection`
2. Branch by `step_name=planned_duration_selection|finish_arrival_time_input|break_time_range_input`
3. `step_name=volunteer_profile_and_consent`
4. `step_name=thank_you_confirmation` (or use `action_type=view` for this final step if you prefer view-based completion)

Apply breakdown by `check_in_intent` to compare start/finish/break conversion paths.

### Diagnostics for failed submits

Filter:
- event: `volunteer_wizard_action`
- `action_type=submit_error`

Break down by `error_stage` to isolate drop-off caused by backend/API failures vs user behavior.
