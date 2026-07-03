# varco in this repo — the pipeline as loops + skills

The team's development pipeline (formerly `.ai/PIPELINE.md`, now removed), run by the
varco statechart kernel:
the loop logic (phases, STOPs, the one 3-cycle budget, back-edges, escalation) is now the
tool's job; the project-specific knowledge is modular skills under `.agents/skills/`.

## Command mapping

| legacy `>>` command | varco equivalent |
|---|---|
| `>>jira` / `>>specify` | `varco start <slug> --loop feature-loop` → PLANNING (use `grilling` + `spec-writing` + `glossary-protocol` skills) → the human's "yes" = `varco signal spec_approved` |
| `>>fromdesign` | same, `--loop fromdesign-loop` (the `design-bridge` skill reads `design/specs/<slug>.md` first) |
| `>>implement` | IMPLEMENTING (skills: `clippy-tdd`, `grounding`, `scope-guard`) |
| `>>review` | REVIEWING — `spec-conformance` + `security-review` plug-ins run; apply the `security-rubric` (+ `migration-safety` when a migration is in the diff) |
| `>>quality` | QUALITY — the `quality-gate` plug-in runs `bun run lint && bun run check-types` from `.varco/config.json`; when the backend changed, also run `bun --cwd apps/backend test:e2e` (Postgres up; infra failure ≠ defect, no budget spent — ENV-HALT covers this) |
| `>>deliver` | DELIVERING → the loop SUSPENDS. **The real gate is unchanged: a human approves the MR on GitLab (protected `main`, ≥1 approval).** `varco signal human_mr_approved` records it locally, then `varco apply` → DELIVERED |
| `>>refactor` | `--loop refactor-loop` (no spec; no spec-conformance) |
| hotfix / known-cause bug | `--loop hotfix-loop` (implement → quality → deliver, budget 2) |
| design work (was the `.ai/design` modes) | `--loop design-loop` — intake+ideate at PLANNING, craft at IMPLEMENTING, critique + the seven refine gates at REVIEWING (findings drive repair cycles), handoff brief at the gate |
| `>>status` / `>>next` | `varco status` / `varco preview` |
| `>>retro` | loop events are in `.varco/state/events.log` (JSONL) — same grouping the old metrics log served |
| 3× retry stop | the manifest `budget` (3) → ESCALATED, never a silent 4th cycle |

Phases map 1:1: `plan` / `write` / `read-only` is varco's `phase` field, derived from the
state — enforced by the session write-guard (`scripts/guard-write.sh`), which reads the
active task's phase. **No active task = no constraints** (casual sessions are free; only
varco state/config/keys are always protected). Design-loop tasks are additionally fenced
to the frontend + `design/` blast radius.

## Daily flow (you drive, varco dispatches the agent)

```sh
varco start voli-XXX --loop feature-loop
varco                            # guided mode: it asks at every decision —
                                 #   approve the spec (view it first if you want),
                                 #   IMPLEMENTING dispatches the agent (claude, from the config),
                                 #   REVIEWING dispatches an independent read-only review,
                                 #   QUALITY runs lint + types,
                                 #   findings pause for you before each fix cycle,
                                 #   the merge gate waits for GitLab's MR approval →
                                 #   answer [a] once the MR is approved, and it delivers.
varco domain && varco promote --all   # ratify any harvested facts (optional)
```

Prefer explicit commands? `varco run` / `varco signal …` / `varco apply` do exactly the
same, one step at a time. Quitting guided mode is always safe — state is durable.

Specs are two artifacts in `.varco/specs/`: `<slug>.md` (the PRD prose) and `<slug>.json` (machine-checkable criteria the `spec-conformance` verifier
enforces every review pass — the new part).

## Where everything lives now (`.ai/` is gone)

| Asset | Home |
|-------|------|
| Domain language | `docs/GLOSSARY.md` (PM owns meanings; `[dev]` lines are dev-owned) |
| Enforcement setup (GitLab branch protection — still the one real wall) | `docs/HUMAN_GUIDE.md` |
| Design pipeline (briefs, modes, design system files) | `design/` |
| CI scripts (commit-lint, SAST gates, hooks) + the session write-guard | `scripts/` (tests: `scripts/__tests__/gates.test.sh`) |
| Host adapter setup (Claude Code / Kimi / Cursor / Zed) | `scripts/adapters/` |
| Working discipline (TDD, grounding, scope guard, conventions, rubrics) | `.agents/skills/` |

The inviolable rules survive intact: the MR gate is GitLab's (Tier A); frozen tests live
in `clippy-tdd`; never-guess lives in `grounding`; phase discipline is the kernel's plus
the write-guard.

## Notes

- `.varco/config.json` is committed here (force-added past the default ignore): it holds
  only the shared quality command, so the gate is identical for everyone.
- The `agent` block dispatches implementation to **claude** headless; the `review` block
  runs an independent read-only reviewer with the security-rubric / migration-safety /
  code-smells skills injected. **Kimi users**: change `"backend"` to `"kimi"` in a personal
  copy and point `VARCO_CONFIG` at it (the committed config stays the team default).
- Skill index: `varco skills` (project skills + the stock library: `tdd`, `grilling`,
  `spec-writing`, `diagnosing-bugs`, `code-smells`).
