# CI/CD setup

## Layout

Everything runs on GitHub-hosted runners (`ubuntu-latest`). There are four
entrypoint workflows and two reusable ones:

| File                    | Trigger                       | What it does                                                              |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `ci.yml`                | `pull_request` → main/prod    | The full gate. Everything that only makes sense pre-merge lives here.     |
| `cd-staging.yml`        | `push` → `main`               | Slim pre-deploy gate, then build/push/deploy to staging.                  |
| `cd-production.yml`     | `push` → `production`         | Same, to production, with a human approval on the apply.                  |
| `mirror-images.yml`     | weekly + `workflow_dispatch`  | Refreshes the GHCR base-image mirror.                                     |
| `reusable-verify.yml`   | `workflow_call`               | Lint, type-check, migration drift, tests. One definition, three callers.  |
| `reusable-deploy.yml`   | `workflow_call`               | Build + push both images, Terraform plan, gated apply, Sentry release.    |

Shared step sequences live in composite actions: `.github/actions/setup` (Bun +
Bun/Turborepo caches + install) and `.github/actions/docker-auth` (buildx +
Scaleway and GHCR logins).

### Who runs what

`main` and `production` are protected: nothing reaches them except through a
pull request that passed `ci.yml`. So the post-merge workflows deliberately do
**not** repeat the whole suite.

| Check                        | PR  | push to main / production |
| ---------------------------- | --- | ------------------------- |
| Biome lint/format            | ✅  | ⛔ already required on PR  |
| TypeScript                   | ✅  | ⛔ already required on PR  |
| Commit lint                  | ✅  | ⛔ pre-merge only          |
| AI gate tests                | ✅  | ⛔ pre-merge only          |
| Migration drift              | ✅  | ✅ pre-deploy gate         |
| Tests (Postgres service)     | ✅  | ✅ pre-deploy gate         |
| Image build                  | ✅ validate only, never pushed | ✅ built, tagged, pushed |
| Terraform plan               | ✅ when `packages/infra` changed | ✅ always     |
| Terraform apply              | ⛔  | ✅ behind the environment  |

Path filtering: `ci.yml`'s `changes` job classifies the diff against the merge
base and skips the expensive jobs that cannot be affected — a docs-only PR still
lints and type-checks but does not spin up Postgres or build images. Because
skipped jobs would otherwise leave a required check pending forever, branch
protection should require the single aggregate job named **`CI`**, which fails if
any upstream job failed and tolerates skips.

Caching: Bun's install cache and Turborepo's `.turbo/cache` are restored per job
(with `restore-keys`, so a lockfile bump degrades to a warm start rather than a
cold one). Image layers use two caches — GitHub's Actions cache (`type=gha`,
per-image scope) for fast PR iteration, and a `:buildcache` tag in the Scaleway
registry as the durable cross-branch cache. Only the protected branches *write*
the registry cache; pull requests read it. That way a PR can never poison what
the next real deploy builds from.

## One-time setup

1. **`ORG_REPO_PAT` secret** — the pipeline checks out `.ai` and `packages/infra`
   as submodules living in sibling repos (`caluno-ai`, `caluno-infra`). The
   default `GITHUB_TOKEN` only has access to the repo that triggered the
   workflow, so submodule checkout needs a token with read access to all
   three repos. Create a fine-grained PAT (or an org machine-user token) with
   read access to `caluno`, `caluno-ai`, and `caluno-infra`, and add it as a
   secret named `ORG_REPO_PAT` in each of the three repos.

2. **Deploy/registry secrets and variables** — add these in `caluno` before
   the build and Terraform jobs can run:
   - Secrets (Settings → Secrets and variables → Actions → Secrets):
     `SCW_ACCESS_KEY`, `SCW_SECRET_KEY` — used both for the Scaleway
     provider/registry and, reused as `AWS_ACCESS_KEY_ID`/
     `AWS_SECRET_ACCESS_KEY`, for the S3-compatible Terraform state backend
     (Scaleway Object Storage authenticates via the AWS SDK's credential
     chain, so these must be real process env vars, not just Actions
     context values). Also `SENTRY_AUTH_TOKEN`.
   - Variables (Settings → Secrets and variables → Actions → Variables):
     `SCW_REGISTRY_HOST`, `SCW_REGISTRY_NAMESPACE`, `SCW_DEFAULT_PROJECT_ID`,
     `SCW_DEFAULT_REGION`, `SCW_DEFAULT_ZONE`, `AWS_DEFAULT_REGION`,
     `SENTRY_ORG`, `SENTRY_PROJECT_BACKEND`, `SENTRY_PROJECT_FRONTEND`,
     `NEXT_PUBLIC_SENTRY_DSN` — none of these are sensitive, but the workflow
     must read them via `vars.*` (not `secrets.*`), since GitHub Actions keeps
     the two stores separate.
   - Any `TF_VAR_*` values not already set in `packages/infra/terraform.tfvars`.

   The CD workflows pass `secrets: inherit` to the reusable workflows, so
   repo-level secrets are enough — nothing needs duplicating per environment.

3. **Runners** — all jobs use `runs-on: ubuntu-latest`. The `holi-social` org is
   on the GitHub Free plan, which only provides the standard 2-vCPU/7 GB hosted
   Linux runners; "larger runners" (4/8-core) need Team or Enterprise. If the
   plan changes, the image-build and test jobs are the two worth moving to a
   4-core label first.

4. **Environments** — create `staging` and `production` (Settings →
   Environments). The Terraform apply job runs inside the matching environment,
   which is what produces the deployment record and the environment URL on the
   repo home page. Add a **required reviewers** rule to `production`: that
   approval gate is the only thing standing between a merge into `production`
   and a real `terraform apply`. Without it, prod applies run unattended.

   Deploys are serialized per environment by a workflow-level concurrency group
   (`cd-staging` / `cd-production`) with `cancel-in-progress: false`, so a
   running deploy is never cut in half; a newer push only supersedes a *queued*
   one. Note there is intentionally no job-level concurrency on plan/apply —
   sharing one group between them lets a newer run's plan evict an older run's
   pending apply.

5. **Image mirror (`mirror-images.yml`)** — mirrors pinned base images
   (`postgres:17`, `oven/bun:1`) into `ghcr.io/holi-social/mirror/*` on a weekly
   schedule (or on demand via `workflow_dispatch`), so CI's Docker pulls aren't
   subject to Docker Hub's availability or anonymous rate limits. The copy is
   registry-to-registry via `docker buildx imagetools create` — no local pull,
   all platforms preserved.
   - **Run it once via `workflow_dispatch` before the first CI/CD build** — the
     build jobs and the Dockerfiles' `FROM` lines pull from the mirror, so it has
     to exist first.
   - It only refreshes on schedule/dispatch, not on every pull. Bump the tag
     in the matrix and re-run manually if you need a newer upstream version
     sooner.
   - GHCR packages default to private, scoped to the pushing repo, which is
     why the workflows log into `ghcr.io` before pulling. For friction-free
     local `docker build`, consider setting the mirror packages to public
     visibility (Settings → Packages) — they're just cached copies of public
     images, nothing proprietary.
   - Terraform is no longer mirrored: the workflows install it with
     `hashicorp/setup-terraform` instead of running jobs inside a container. The
     pinned version lives in the `TF_VERSION` env var in `ci.yml` and
     `reusable-deploy.yml`; keep the two in sync.

6. **Branch protection** — on `main` and `production`, require pull requests and
   require the status check named **`CI`** (only that one — see the note on
   skipped jobs above). Do the same in the two submodule repos for their own
   checks.
