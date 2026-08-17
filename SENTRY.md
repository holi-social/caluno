# Sentry Observability Runbook

Error reporting and performance tracing for Caluno. Shared configuration lives in
`packages/observability` (`@repo/observability`) and is consumed by both apps.

## What runs where

- **Sentry SaaS, EU-hosted** (data residency: EU). One organization, two projects:
  - `caluno-frontend` — Next.js app (`apps/frontend`), via `@sentry/nextjs`
  - `caluno-backend` — NestJS API (`apps/backend`), via `@sentry/nestjs`
- **Environments**: `development`, `staging`, `production` (resolved in
  `packages/observability/src/environments.ts`; explicit env var wins, otherwise
  derived from `NODE_ENV`).
- Frontend client events are tunnelled through `/sentry-tunnel` (Next.js rewrite)
  to bypass ad blockers.
- Frontend → backend distributed tracing: `sentry-trace`/`baggage` headers are
  attached to requests matching `TRACE_PROPAGATION_TARGETS`
  (`packages/observability/src/trace.ts`).

## Local testing

The SDK is **fully disabled without a DSN** (`enabled: Boolean(dsn)` in
`buildBaseOptions`), so local dev is Sentry-free by default.

To test end-to-end:

1. Create a personal test project in Sentry (or reuse a sandbox) and copy its DSN.
2. Frontend: set `NEXT_PUBLIC_SENTRY_DSN` in `apps/frontend/.env.local`.
   Backend: set `SENTRY_DSN` in `apps/backend/.env`.
3. Trigger a test error:
   - Frontend: add a temporary button that throws on click.
   - Backend: add a temporary `throw new Error(...)` in a resolver.
4. Confirm the event appears in the test project, then **remove the test code**
   and unset the DSN before committing.

## How releases work

- The release name is the git SHA: `$CI_COMMIT_SHA`.
- The release is **created during the Docker build**: `sentry-cli` uploads source
  maps inside the image build (BuildKit secret `sentry_auth_token`), and the source
  maps are deleted from the image afterwards — they never ship to production.
- After deploy, the `sentry:finalize-staging` / `sentry:finalize-production` CI
  jobs run `sentry-cli releases set-commits --auto` (associates commits, enables
  suspect commits) and `sentry-cli releases finalize`.
- `SENTRY_RELEASE` must **also be set at runtime** (deployment environment) so
  events carry the release tag. Wiring it via Terraform in `packages/infra` is a
  paired follow-up — until then events may lack release tags.

## Environment variables

| Variable | Where set | Public vs secret |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | GitLab CI/CD variable (build arg); local `.env` for testing | **Public by design** — ships in the client bundle |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | GitLab CI (staging/production) | Public |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | Optional, local `.env` / CI | Public |
| `NEXT_PUBLIC_SENTRY_REPLAY_ENABLED` | Optional, local `.env` / runtime env | Public |
| `SENTRY_DSN` | Runtime env (backend; frontend server runtime, falls back to `NEXT_PUBLIC_SENTRY_DSN`) | Server-side only (not secret, but never exposed to the client) |
| `SENTRY_ENVIRONMENT` | Runtime env | Server-side only |
| `SENTRY_RELEASE` | CI build arg + runtime env | Not secret |
| `SENTRY_TRACES_SAMPLE_RATE` | Optional, runtime env | Server-side only |
| `SENTRY_ORG` | GitLab CI/CD variable | Not secret |
| `SENTRY_PROJECT_FRONTEND` | GitLab CI/CD variable | Not secret |
| `SENTRY_PROJECT_BACKEND` | GitLab CI/CD variable | Not secret |
| `SENTRY_AUTH_TOKEN` | GitLab CI/CD variable (**masked**) — the only place it exists | **Secret** — never commit, never set locally |

## Sampling knobs

All sampling logic lives in `@repo/observability`
(`packages/observability/src/sampling.ts`):

- Per-environment default trace sample rates: development `1.0`, staging `0.5`,
  production `0.1`.
- `*_TRACES_SAMPLE_RATE` (`NEXT_PUBLIC_…` for the browser, plain for server
  runtimes) overrides the default; must be a number in `0..1`, invalid values are
  ignored.
- Health-check and noise transactions (`/api/health`, `healthz`, `readiness`,
  `favicon.ico`) are always dropped (sample rate `0`).
- Browser noise (ResizeObserver loops, aborted fetches, extension errors) is
  dropped via `ignoreErrors` (`src/ignore-errors.ts`); expected GraphQL error
  codes (`FORBIDDEN`, `NOT_FOUND`, …) are filtered out and never create issues.

## Alert triage flow

1. New issue in **production** → check the **release** and **environment** tags
   first (is it new in this release? staging-only noise?).
2. Read the stack trace — source maps are uploaded per release, so traces are
   mapped to original TypeScript.
3. Open the **trace view** to correlate frontend spans with the backend
   transaction (distributed tracing via the propagated headers).
4. Assign per the issue **ownership rules** configured in Sentry.

## Adding context in new code

- **Backend**: inject `ObservabilityService` (from `shared/observability`) —
  never import `@sentry/nestjs` directly in domain code. Available:
  `setUser({ id })`, `captureException(error)`, `startSpan(...)`,
  `withIsolationScope(...)`.
- **Frontend**: `Sentry.setUser({ id })` from `@sentry/nextjs`.
- **User context is the id only — never email or name.** `sendDefaultPii` is
  `false` and `beforeSend` scrubs auth/cookie headers and strips the user object
  down to the id (`packages/observability/src/scrub.ts`).

## Manual Sentry-side setup checklist

Not config-as-code — done once in the Sentry UI:

- [ ] Create the Sentry organization with **EU data residency**.
- [ ] Create the two projects: `caluno-frontend` (Next.js), `caluno-backend`
      (NestJS/Node).
- [ ] Alert rules: new issue in `production`; error-rate spike.
- [ ] Per-app dashboards: error rate, p95, throughput, crash-free rate; plus a
      shared release-health view.
- [ ] Issue ownership rules (path-based code owners).
- [ ] Link the **GitLab repository integration** — required for
      `set-commits --auto` to resolve commits.
- [ ] Create GitLab CI/CD variables: `SENTRY_AUTH_TOKEN` (**masked**),
      `SENTRY_ORG`, `SENTRY_PROJECT_FRONTEND`, `SENTRY_PROJECT_BACKEND`,
      `NEXT_PUBLIC_SENTRY_DSN`.

## Session Replay

Off by default. Set `NEXT_PUBLIC_SENTRY_REPLAY_ENABLED=true` to enable; the
integration is configured with `maskAllText`, `maskAllInputs`, and
`blockAllMedia`, so no user content is captured. Sample rates: 10% of sessions,
100% of sessions with an error (only sampled when replay is enabled).
