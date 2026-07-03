# Clippy — Design & Product Pipeline

The front of the product cycle — **ideation → design → critique → refinement** — producing
design briefs that are ready to enter the dev pipeline. It runs as a **varco loop**:

```sh
varco start <slug> --loop design-loop
varco        # guided mode asks at every decision
```

```
PLANNING      intake (Q1–Q3 → context file) + optional ideate     skill: design-intake, design-ideate
   │  spec_approved = the human signs off intake + the brief-contract criteria
IMPLEMENTING  craft: dev-ready design on the real design system    skill: design-craft
REVIEWING     critique (/impeccable) + the seven refine gates      skill: design-critique, design-refine
   │  approved findings → `varco finding` → the back-edge carries each repair cycle
   │  spec-conformance mechanically verifies the brief skeleton (design/specs/<slug>.md)
QUALITY       bun lint + types (code medium; trivial otherwise)
DELIVERING    the HANDOFF gate — human approval releases the brief
```

The four working disciplines live as skills under `.agents/skills/` (`design-intake`,
`design-ideate`, `design-craft`, `design-critique`, `design-refine`) — the loop pipes
them in; each holds its mode's full process, gates, and anti-patterns. Modes are not
strictly sequential: enter where the goal lands (Q3 at intake decides); refine is
mandatory before any handoff.

**Where this feeds**: the brief lands at `design/specs/<slug>.md`; the dev pipeline picks
it up with `varco start <slug> --loop fromdesign-loop`. This pipeline stops at the brief —
it does not implement.

**Owned registers** (read at every session start, never restated elsewhere):
`design/PRODUCT.md` (product, users, purpose) and `design/DESIGN.md` (design system,
tokens, named rules).

---

## Enforcement & Write Boundary

**Honest version.** The gates in this pipeline are *session discipline*, not structural
enforcement — no CI job fails on a hardcoded token or a low-contrast pair; the gates
catch those by an agent running the checks and a human adjudicating. The real wall is
**review-before-merge**: the design role is push-but-not-merge, so design code always
reaches a human on a merge request, and dev CI on protected `main` is the structural gate
the work meets when it lands. The write boundary limits *blast radius*, not *safety*.
Real design-side guards (a `design:check` script, stylelint `no-hex`, axe in CI) are
future work; none exist yet. Do not claim a guarantee the pipeline does not mechanically
enforce.

**Write boundary.** The write-guard (`scripts/guard-write.sh`) fences **design-loop
tasks** in the write phase to exactly this blast radius (a dev-loop task has no such
fence; with no varco task active, sessions are unconstrained):

| Allowed in a design-loop write phase | Not allowed (dev-loop territory) |
|---|---|
| `design/**` (briefs, context files, sidecars) | `apps/backend/**` (backend + migrations) |
| `apps/frontend/src/**` | `packages/data/**` (data layer) |
| `packages/ui/src/**` components + co-located stories | package config & deps (`package.json`, tsconfig) |
| `apps/frontend/messages/*.json` (translation catalogs) | |

The whole frontend is fair game; backend and data are not. Prototypes use
mocked/placeholder data, never real backend or `@repo/data` wiring — a data need is named
in the brief as a dev subtask, a missing component the same way. The two pipelines couple
at one seam: the brief.

## Tone and Voice

Critical, cold, serious, to the point. Never tell the human they are "smart", "great", or
similar. Short sentences. Direct, clear questions. No fluffy AI-marketing language.
