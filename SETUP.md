# CI/CD setup

Everything runs on GitHub-hosted runners (`ubuntu-latest`).

| File                  | Trigger                      | What it does                                               |
| --------------------- | ---------------------------- | ---------------------------------------------------------- |
| `ci.yml`              | `pull_request` → main/prod   | Full gate, plus the pre-merge-only checks.                  |
| `cd-staging.yml`      | `push` → `main`              | Gate alongside build/push, then deploy to staging.          |
| `cd-production.yml`   | `push` → `production`        | Same, to production, with approval on the apply.            |
| `mirror-images.yml`   | weekly + `workflow_dispatch` | Refreshes the GHCR base-image mirror.                       |
| `reusable-verify.yml` | `workflow_call`              | Lint, type-check, migration drift, tests.                   |
| `reusable-deploy.yml` | `workflow_call`              | Build + push images, Terraform plan/apply, Sentry release.  |

Shared steps live in composite actions: `.github/actions/setup` (Bun + caches +
install), `.github/actions/save-turbo-cache` (prune + upload) and
`.github/actions/docker-auth` (buildx + registry logins).

## Who runs what

| Check                    | PR                               | push to main / production |
| ------------------------ | -------------------------------- | ------------------------- |
| Biome lint/format        | ✅                               | ✅                        |
| TypeScript               | ✅                               | ✅                        |
| Commit lint, AI gates    | ✅                               | ⛔                        |
| Migration drift          | ✅                               | ✅                        |
| Tests (Postgres service) | ✅                               | ✅                        |
| Image build              | ✅ validate only, path-filtered  | ✅ pushed                 |
| Terraform plan           | ✅ when `packages/infra` changed | ✅                        |
| Terraform apply          | ⛔                               | ✅ behind the environment |

The CD gate runs the full suite, including the static checks the pull request
already covered. It runs concurrently with the image builds, which take longer,
so it costs no deploy wall clock — and a branch push is the only place that can
write an Actions cache every pull request can read (see below).

`ci.yml`'s `changes` job classifies the diff against the merge base and skips the
jobs that need a database, an image build, or Terraform when nothing relevant
changed. The `CI` aggregate job treats a skip as a pass, so a filtered-out job
never blocks a merge.

Nothing reaches an environment unless the gate passed: `apply` waits on it, on
the plan, and on both images. Images are pushed even when the gate fails — they
are inert until a plan is applied, and the moving tag (`staging` / `latest`)
tracks the branch head.

## Caching

The repo has a single 10 GB Actions cache quota shared across branches, and
GitHub evicts least-recently-used entries once it is full. Three things use it:

- Bun's install cache (~400 MB, one entry per lockfile).
- Terraform's provider plugin cache, keyed on `.terraform.lock.hcl`.
- Turborepo's `.turbo/cache`, on the jobs that run `turbo` tasks.

**Cache scope is the thing to remember.** An Actions cache written on a
`refs/pull/N/merge` ref is readable *only by that pull request*; only caches
written on a long-lived branch warm everybody. So the Turborepo cache is restored
everywhere but saved only on `push` events, and `prune-turbo-cache.sh` trims it
to a 512 MB budget first — Turborepo never garbage-collects its own filesystem
cache, so restore-then-save would grow it until it evicted the Bun cache. All
`turbo` jobs share one cache scope, since entries are content-addressed by task
hash and separate scopes only stop jobs reusing each other's work.

Docker layers use a `:buildcache-<environment>` tag per image in the Scaleway
registry rather than the Actions cache — `type=gha,mode=max` fills the whole
quota with layers only readable from the branch that wrote them. The tag is per
environment because the frontend bakes `NEXT_PUBLIC_*` in at build time, so the
staging and production images diverge and a shared tag would have each deploy
clobber the other. Deploys write the registry cache; pull requests read both.

Production builds its own images rather than promoting the digest staging
validated — a deliberate trade, since the frontend bakes `NEXT_PUBLIC_API_URL`
and `NEXT_PUBLIC_WEB_URL` into the bundle and one image therefore cannot serve
both environments without moving those to runtime config. A production deploy
pays ~3 minutes to rebuild, and what it ships differs from what staging
exercised only by those baked origins.

Both Dockerfiles copy `package.json` files, install, and *then* copy source, so a
source-only commit reuses the install layer. Keep that order — a `COPY` of source
above the install costs ~2.5 minutes per image build. The `--mount=type=cache`
mounts only help repeat local builds: cache mounts are builder-local, are not
exported by `cache-to`, and CI runners are ephemeral.

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
