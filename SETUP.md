# CI/CD setup

`.github/workflows/ci-cd.yml` needs some one-time setup before it runs end to end.

1. **`ORG_REPO_PAT` secret** — the pipeline checks out `.ai` and `packages/infra`
   as submodules living in sibling repos (`caluno-ai`, `caluno-infra`). The
   default `GITHUB_TOKEN` only has access to the repo that triggered the
   workflow, so submodule checkout needs a token with read access to all
   three repos. Create a fine-grained PAT (or an org machine-user token) with
   read access to `caluno`, `caluno-ai`, and `caluno-infra`, and add it as a
   secret named `ORG_REPO_PAT` in each of the three repos.

2. **Deploy/registry secrets** — add these as encrypted Actions secrets in
   `caluno` before the build jobs can push images:
   - `SCW_SECRET_KEY`, `SCW_REGISTRY_HOST`, `SCW_REGISTRY_NAMESPACE`
   - Any `TF_VAR_*` values not already set in `packages/infra/terraform.tfvars`

3. **Runner plan limits** — all jobs run on `ubuntu-latest`. The
   `holi-social` org is currently on the GitHub Free plan, which only
   provides standard 2-vCPU/7GB hosted Linux runners; "larger runners" with
   more CPU/RAM need a Team or Enterprise plan.

4. **Environment protection rules** — production Terraform applies should
   require human approval before running. Configure a required-reviewers
   rule on the `production` environment (Settings → Environments →
   production). Until that's set up, `terraform-production-apply` runs
   automatically on every push to `production`.

5. **Image mirror (`mirror-images.yml`)** — mirrors pinned base images
   (`postgres:17`, `hashicorp/terraform:1.15`, `oven/bun:1`) into
   `ghcr.io/holi-social/mirror/*` on a weekly schedule (or on demand via
   `workflow_dispatch`), so CI's Docker pulls aren't subject to Docker Hub's
   availability or anonymous rate limits.
   - **Run it once via `workflow_dispatch` before the first `ci-cd.yml` build**
     — the build jobs pull from the mirror, so it has to exist first.
   - It only refreshes on schedule/dispatch, not on every pull. Bump the tag
     in the matrix and re-run manually if you need a newer upstream version
     sooner.
   - GHCR packages default to private, scoped to the pushing repo, which is
     why `ci-cd.yml` logs into `ghcr.io` before pulling. For friction-free
     local `docker build`, consider setting the three mirror packages to
     public visibility (Settings → Packages) — they're just cached copies of
     public images, nothing proprietary.

6. **Branch protection** — configure required status checks on `main` and
   `production` in all three repos so the jobs above are enforced before merge.
