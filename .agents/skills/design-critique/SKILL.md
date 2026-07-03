---
name: design-critique
description: The design loop's REVIEWING discipline — fire /impeccable critique on the crafted artifact, get human approval on the finding set, record approved findings so the loop's back-edge drives the repair.
---

# Design Critique (REVIEWING, design-loop)

Take crafted output and harden it. `craft` produces; `critique` judges and repairs — kept
separate so each stays focused. Never fold the critique into crafting.

## Requirement: impeccable

Requires [impeccable](https://github.com/pbakaus/impeccable.git). Determine presence
deterministically — `command -v impeccable || test -d <install path>` — do not eyeball.
Absent → **STOP**, tell the human to install it (`git clone
https://github.com/pbakaus/impeccable.git`). Do not run the critique. Do not improvise a
substitute.

Also requires an artifact. None from craft? Don't stall — ask the human for one directly
(a path, a Figma/Paper/Pencil link, or the code location) and critique that.

## Process

1. **Pre-flight**: assert `design/PRODUCT.md` and `design/DESIGN.md` exist and pass them
   to impeccable explicitly, so it never resolves `product.md`/`design.md` from the wrong
   directory. Missing file = STOP, not a retry.
2. **Fire `/impeccable critique`**, coverage routed deterministically by the artifact
   identifier, not judgment: design-tool artifact (`.pen`/`.fig`/Paper, or any
   `figma.com/…` URL) → Assessment A (LLM design review) only; code artifact →
   Assessment A + B (deterministic markup/DOM check). A missing Assessment B on a
   design-tool artifact is expected, not a failure.
3. **Scope rule**: judge only static UX copy and structure — labels, headings, helper
   text, button wording, tone, hierarchy, states. Ignore dynamic-data placeholders
   (`%Entity%`, `{n} frei`, sample dates) and localization correctness — those are refine
   concerns (dynamic-data and i18n gates), not critique findings.
4. **Present the critique, get approval (before any change).** Summarize findings grouped
   and ranked by severity; state which you would act on and which skip, with reasons.
   **Do not change anything yet.**
5. **Record the approved set in the loop**: file each approved finding with
   `varco finding "<severity>: <finding>"` — the loop's back-edge then drives the repair
   pass with the budget counting it, exactly like a code review cycle. Log skipped
   findings in the context file (recorded, not silently dropped).
6. **Repair on the fix pass** — the approved set only; do not expand scope or act on
   skipped findings.
7. **Present the changes, get approval (after the changes).** Show what changed against
   each approved finding; note anything declined that remains open. On rejection, return
   to the repair with corrections. Then update `design/<slug>-context.md`: findings, what
   changed, what was deliberately left, learnings.

## Anti-patterns

Running without impeccable, or improvising a substitute · stalling when no artifact
exists instead of asking · making changes before the pre-change approval · handing off
without the post-change approval · acting on skipped findings or expanding scope mid-fix
· re-litigating craft decisions (this mode repairs against the critique; it does not
redesign) · flagging placeholder/localization issues that belong to the refine gates.
