# CI/CD setup

Everything runs on GitHub-hosted runners (`ubuntu-latest`).

| File                  | Trigger                      | What it does                                               |
| --------------------- | ---------------------------- | ---------------------------------------------------------- |
| `ci.yml`              | `pull_request` → main/prod   | Full gate, plus the pre-merge-only checks.                  |
| `cd-staging.yml`      | `push` → `main`              | Slim gate, then build/push/deploy to staging.               |
| `cd-production.yml`   | `push` → `production`        | Same, to production, with approval on the apply.            |
| `mirror-images.yml`   | weekly + `workflow_dispatch` | Refreshes the GHCR base-image mirror.                       |
| `reusable-verify.yml` | `workflow_call`              | Lint, type-check, migration drift, tests.                   |
| `reusable-deploy.yml` | `workflow_call`              | Build + push images, Terraform plan/apply, Sentry release.  |

Shared steps live in composite actions: `.github/actions/setup` (Bun + caches +
install) and `.github/actions/docker-auth` (buildx + registry logins).

## Who runs what

`main` and `production` are protected, so every commit on them already passed
`ci.yml` on a pull request. The CD workflows therefore skip the checks the PR
already covered.

| Check                    | PR                               | push to main / production |
| ------------------------ | -------------------------------- | ------------------------- |
| Biome lint/format        | ✅                               | ⛔                        |
| TypeScript               | ✅                               | ⛔                        |
| Commit lint, AI gates    | ✅                               | ⛔                        |
| Migration drift          | ✅                               | ✅                        |
| Tests (Postgres service) | ✅                               | ✅                        |
| Image build              | ✅ validate only                 | ✅ pushed                 |
| Terraform plan           | ✅ when `packages/infra` changed | ✅                        |
| Terraform apply          | ⛔                               | ✅ behind the environment |

`ci.yml`'s `changes` job classifies the diff against the merge base and skips the
jobs that need a database or Terraform when nothing relevant changed. Image
builds are intentionally unfiltered — the two apps share a build context, so
per-app filtering there is more trouble than it saves.

## Caching

The repo has a single 10 GB Actions cache quota shared across branches, and
GitHub evicts least-recently-used entries once it is full. Two things use it:

- Bun's install cache (~400 MB, one entry per lockfile).
- Turborepo's `.turbo/cache` (~70 MB per entry) on the jobs that run `turbo`
  tasks. The key ends in the commit sha, so each run saves a fresh entry and
  `restore-keys` supply the warm start.

Docker layers use a `:buildcache` tag per image in the Scaleway registry, not the
Actions cache — `type=gha,mode=max` filled the whole quota with layers only
readable from the branch that wrote them. Deploys write the registry cache; pull
requests read it.

## One-time setup

1. **`ORG_REPO_PAT` secret** — the pipeline checks out `.ai` and `packages/infra`
   as submodules living in sibling repos (`caluno-ai`, `caluno-infra`). The
   default `GITHUB_TOKEN` only has access to the repo that triggered the
   workflow, so submodule checkout needs a token with read access to all three.
   Create a fine-grained PAT (or an org machine-user token) with read access to
   `caluno`, `caluno-ai`, and `caluno-infra`, and add it as a secret named
   `ORG_REPO_PAT` in each of the three repos.

2. **Deploy/registry secrets and variables** — add these in `caluno`:
   - Secrets: `SCW_ACCESS_KEY`, `SCW_SECRET_KEY`, `SENTRY_AUTH_TOKEN`. The
     Scaleway keys are reused as `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` for
     the S3-compatible Terraform state backend, which authenticates through the
     AWS SDK credential chain and so needs real process env vars.
   - Variables: `SCW_REGISTRY_HOST`, `SCW_REGISTRY_NAMESPACE`,
     `SCW_DEFAULT_PROJECT_ID`, `SCW_DEFAULT_REGION`, `SCW_DEFAULT_ZONE`,
     `AWS_DEFAULT_REGION`, `SENTRY_ORG`, `SENTRY_PROJECT_BACKEND`,
     `SENTRY_PROJECT_FRONTEND`, `NEXT_PUBLIC_SENTRY_DSN`. These must be read via
     `vars.*`, not `secrets.*`.
   - Any `TF_VAR_*` values not already in `packages/infra/terraform.tfvars`.

   The CD workflows pass `secrets: inherit`, so repo-level secrets are enough.

3. **Runners** — `ubuntu-latest` everywhere. `holi-social` is on the Free plan,
   which only provides standard 2-vCPU/7 GB Linux runners; larger runners need
   Team or Enterprise.

4. **Environments** — create `staging` and `production` (Settings →
   Environments), and add a **required reviewers** rule to `production`: that
   approval is what holds the production `terraform apply` until a human accepts
   it. Deploys are serialized per environment by a workflow-level concurrency
   group with `cancel-in-progress: false`.

5. **Image mirror (`mirror-images.yml`)** — mirrors `postgres:17` and
   `oven/bun:1` into `ghcr.io/holi-social/mirror/*` weekly, so CI's pulls aren't
   subject to Docker Hub rate limits.
   - **Run it once via `workflow_dispatch` before the first CI/CD build** — the
     Dockerfiles' `FROM` lines pull from the mirror.
   - Bump a tag in the matrix and re-run manually for a newer upstream image.
   - GHCR packages default to private, which is why the workflows log into
     `ghcr.io` first. Making the mirror packages public would remove that step
     for local builds.
   - Terraform is installed with `hashicorp/setup-terraform`, so it is not
     mirrored. The pinned version lives in `TF_VERSION` in `ci.yml` and
     `reusable-deploy.yml` — keep the two in sync.

6. **Branch protection** — on `main` and `production`, require pull requests and
   require the status check named **`CI`**. That job aggregates the rest, so
   path-filtered skips don't leave a merge blocked. Do the same in the submodule
   repos for their own checks.
