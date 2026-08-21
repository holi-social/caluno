# CI/CD setup

The workflows in `.github/workflows/` (`ci-branch.yml`, `ci-pull-request.yml`, `cd-staging.yml`, `cd-release.yml`, `cd-production.yml`) need some one-time setup before they run end to end.

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
     context values).
   - Variables (Settings → Secrets and variables → Actions → Variables):
     `SCW_REGISTRY_HOST`, `SCW_REGISTRY_NAMESPACE`, `SCW_DEFAULT_PROJECT_ID`,
     `SCW_DEFAULT_REGION`, `SCW_DEFAULT_ZONE`, `AWS_DEFAULT_REGION` — none of
     these are sensitive, but the workflow must read them via `vars.*` (not
     `secrets.*`), since GitHub Actions keeps the two stores separate.
   - Any `TF_VAR_*` values not already set in `packages/infra/terraform.tfvars`

3. **Runner plan limits** — all jobs run on `ubuntu-latest`. The
   `holi-social` org is currently on the GitHub Free plan, which only
   provides standard 2-vCPU/7GB hosted Linux runners; "larger runners" with
   more CPU/RAM need a Team or Enterprise plan.

4. **Environment protection rules** — production Terraform applies should
   require human approval before running. Configure a required-reviewers
   rule on the `production` environment (Settings → Environments →
   production). Until that's set up, `terraform-production-apply` runs
   automatically on every push to `production`. The `staging` and `release`
   environments have no required reviewers: applies run automatically on
   push to `main` and `release` respectively.

5. **Image mirror (`mirror-images.yml`)** — mirrors pinned base images
   (`postgres:17`, `hashicorp/terraform:1.15`, `oven/bun:1`) into
   `ghcr.io/holi-social/mirror/*` on a weekly schedule (or on demand via
   `workflow_dispatch`), so CI's Docker pulls aren't subject to Docker Hub's
   availability or anonymous rate limits.
   - **Run it once via `workflow_dispatch` before the first CI/CD build**
     — the build jobs pull from the mirror, so it has to exist first.
   - It only refreshes on schedule/dispatch, not on every pull. Bump the tag
     in the matrix and re-run manually if you need a newer upstream version
     sooner.
   - GHCR packages default to private, scoped to the pushing repo, which is
     why the workflows log into `ghcr.io` before pulling. For friction-free
     local `docker build`, consider setting the three mirror packages to
     public visibility (Settings → Packages) — they're just cached copies of
     public images, nothing proprietary.

6. **Branch protection** — configure required status checks on `main`,
   `release`, and `production` in all three repos so the jobs above are
   enforced before merge.

7. **Release environment (one-time)** — before the first push to `release`
   can apply:
   - Create and push git branch `release` (typically from `main`).
   - Create Scaleway Secret Manager secret `caluno-release-posthog-api-key`
     (same shape as `caluno-staging-posthog-api-key`). Terraform reads it;
     it does not create it.
   - After the first successful apply, add DNS:
     - `release.app.caluno.org` → frontend container domain
     - `release.api.caluno.org` → backend container domain
     - `release.mailbox.caluno.org` A record → Terraform output `mailpit_ip`
   - Confirm GitHub Environment `release` exists (created on first workflow
     use) with no required reviewers.
