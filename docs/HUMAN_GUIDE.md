# Human Guide — AI pipeline (for the team)

What you'll see and what's expected of you when AI-built changes reach you. The pipeline itself is varco (see `.varco/README.md`); you don't need to read it to review PRs.

## What actually enforces this (and what doesn't)
Real enforcement is **CI on a protected `main`**, where the agent has no write access. Local guards are pre-flight that the agent's shell can bypass; CI is the wall. For that to hold, the GitLab project must be configured (one-time, by a maintainer):

- **Protect `main`**: no direct push; changes land only via Merge Request.
- **Require ≥1 approval** on MRs from someone other than the author — an agent's token cannot approve its own MR. This is the one human gate.
- **"Pipelines must succeed"** + **"All threads resolved"** before merge.
- Keep the `quality`, `ai_gate_tests`, and `sast_gate` CI jobs (in `.gitlab-ci.yml`) as required checks.
- **SAST** (`semgrep-sast`) scans TS/JS on MR pipelines targeting `main`/`production`. **`sast_gate` fails the pipeline on Critical/High findings** — the MR cannot merge until they are gone from that branch's scan (fix in this MR, revert the introducing commit, or suppress via `.gitlab/sast-ruleset.toml` with justification). **`sast_mr_summary`** posts/updates a markdown table on the MR (also printed in the job log). **`sast_medium_issues`** opens deduped GitLab issues for Medium findings. Both API jobs need CI/CD variable **`SAST_ISSUES_TOKEN`** (name is fixed in scripts; unrelated to bot display name). **Two steps:** (1) **Settings → Access tokens** → create token named **`SAST`**, Developer+, **`api`** scope, copy the secret once; (2) **Settings → CI/CD → Variables** → Key `SAST_ISSUES_TOKEN`, Value = paste secret. The bot’s `@project_*_bot_*` username is auto-generated and cannot be renamed; the token **name** sets the author **display name** in the UI. To rebrand: revoke old token, create `SAST`, paste new secret into the same CI variable. Uncheck **Protected** for feature-branch MRs.

Without those settings there is no enforcement — just the honour system. With them, the agent genuinely cannot merge unreviewed or lint-failing code.

## What you can rely on (per MR)
- Every change passed: an approved spec, a security review (with one-hop call-path tracing), a spec-conformance check, and `bun run lint` + `bun run check-types` in CI. Backend integration/e2e run in CI against Postgres. GitLab SAST scans TS/JS; **Critical/High findings block merge** via `sast_gate`; Medium findings get auto-filed issues.
- A human approved the MR — no AI change reaches `main` without it.
- Tests are written BEFORE implementation and frozen; the agent cannot edit them to pass
- One commit per subtask; diffs stay commit-sized (~200-400 lines)

## What you'll see in PRs
- The PR description contains the acceptance criteria and the out-of-scope list: that IS the contract, review the diff against it
- Commit bodies carry `Decision:` trailers explaining non-obvious choices. Greppable: `git log --format='%(trailers:key=Decision,valueonly)'`
- A decision that changes a standing rule also updates the file that owns it, in the same commit: an **architectural** invariant → the owning `AGENTS.md`; a **domain term's** meaning → `docs/GLOSSARY.md`. So those files staying truthful is part of the contract.
- Acceptance criteria tagged `#test` in the ticket have generated e2e tests; untagged ones deliberately don't

## The design pipeline (design → code)
Designers have their own pipeline under `design/` (`DESIGN_PRODUCT_PIPELINE.md`), running ideation → craft → critique → refine. It produces a **brief** at `design/specs/<slug>.md`; the dev pipeline picks it up with the fromdesign loop (`varco start <slug> --loop fromdesign-loop`). The brief is the only handoff — it carries the problem, user stories, design decisions, acceptance criteria, the `@repo/ui` components used, and design debt.

What this means for you:
- **Design branches touch the frontend only.** In the `design` write context the agent may write `apps/frontend/src`, `packages/ui/src`, and `apps/frontend/messages/*.json` (translations). The backend (`apps/backend`), the data layer (`packages/data`), and package config/deps are blocked — a data or backend need is named in the brief as a dev subtask, never built by design.
- **Designers push, they don't merge.** The design git role is push-but-not-merge, so every design change reaches you on an MR. That review — plus CI — is the real safety; the write boundary only limits *which files* design can touch, not whether a change is correct. A design-phase write can still break the app on its branch, and review is what catches it.
- **Prototypes use mocked/placeholder data**; real backend/data wiring is dev work, scoped from the brief.

## What you'll see in the repo
| Path | What | You |
|------|------|-----|
| `.varco/` (README, manifests, specs, config), `docs/GLOSSARY.md`, `docs/HUMAN_GUIDE.md`, `scripts/`, `design/` (pipeline, `DESIGN.md`, `PRODUCT.md`, briefs), `AGENTS.md` (root + per package), `.agents/skills/` | shared, versioned | edit via normal PRs; PM owns GLOSSARY meanings, design owns `DESIGN.md`/`PRODUCT.md` |
| `.varco/state/` (task state, event log, transcripts), `design/.mode` | local transient state, gitignored | ignore; never hand-edit |

## Per-developer setup
**If you only review MRs, you need none of this** — all enforcement is on the GitLab side (branch protection above), and local plain `git commit` works normally. If you also *run* an agent: it requires `git`, `bun`, and `jq` on PATH, with **nothing to install**. Claude Code works automatically (committed `.claude/settings.json`); Kimi, Cursor and Zed users follow the one-time per-tool steps in [`scripts/adapters/README.md`](../scripts/adapters/README.md). The local guard is optional — CI is the wall.

## Conventions that involve you
- Writing tickets: use `docs/GLOSSARY.md` terms; tag acceptance criteria needing e2e with `#test`
- `varco …` commands in any AI artifacts are agent/pipeline syntax: ignore them
- If something under `.varco/` looks wrong, tell the developer, don't edit it
