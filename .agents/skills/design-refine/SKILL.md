---
name: design-refine
description: The design loop's handoff discipline — run the seven quality gates one at a time (mechanical check + human adjudication each), populate the brief gate by gate, deflected changes become Design Debt. spec-conformance verifies the brief skeleton mechanically.
---

# Design Refine (REVIEWING → DELIVERING, design-loop)

Prepare crafted work for handoff: run every quality gate, repair or log what they
surface, and produce the dev-oriented brief at `design/specs/<slug>.md` — the artifact
the dev pipeline's `fromdesign-loop` consumes. Requires the context file.

**Create `design/specs/<slug>.md` immediately — before running any gate.** Populate the
static sections from the context file (Problem, User stories, Design decisions, Scope
boundary, Design assets, Discussion artifacts, Decision log); leave Acceptance criteria,
Design debt, and Dependencies as shells filled per gate. The brief is a living document —
update it after every gate, not at the end. (`spec-conformance` verifies the section
skeleton mechanically on every review pass, from the criteria `design-intake` created.)

## The gates — in order, each its own cold task

Per gate: **perform the mechanical check → report findings → suggest changes → human
adjudicates → approved changes go to the design, deflected changes go to Design Debt →
ACs and dependency subtasks go to the brief → ask permission for the next gate.** Never
decide "good enough" alone. Each gate runs self-contained (context file + only the
relevant `DESIGN.md`/`PRODUCT.md` sections); the context file is the memory between gates.

1. **Design system** (judgment — deliberately no mechanical pre-check while the DS
   matures): designs use existing components and variables. Close to a DS component →
   suggest the replacement; no DS fit → suggest a shadcn/ui component; neither → a
   subtask in the brief to build a custom component. Hardcoded values → bind to a
   semantic variable.
2. **Accessibility**: mechanical violations first (contrast pairs below AA,
   missing/invisible focus, keyboard-unreachable nodes — axe for code), then the DS-level
   issues a script can't catch. Flag both; fix task-level, log DS-level.
3. **Loose ends**: read `design/<slug>-destinations.md` — every `Destination = none` row
   is a loose end; list each with where it should lead; confirm. The sidecar is the
   source of truth — do not re-scan the design.
4. **Edge cases**: cross-reference the enumerated states against the brief's acceptance
   criteria; every state without an AC is a gap (an AC always, a design not necessarily).
   Judge coverage beyond the mechanical list: partial data, long/short strings.
5. **Validation** (conditional): the design submits data and no Validation section exists
   → flag, suggest the right validations, confirm. Submits nothing → N/A.
6. **Dynamic data**: extract every placeholder token (`{n} frei`, `%Entity%`, `xxx`) and
   find the ones with no resolved source; source not in the codebase → a subtask in the
   brief for that data feature. **Zero placeholders is a flag, not a pass**: read the
   artifact for faked dynamic data (hardcoded counts, dates, names where a real value
   belongs) — a dynamic page with no placeholders almost always means invented data.
7. **i18n** (code medium; design-file media N/A): every visible string is a translation
   key present in **both** `de.json` and `en.json`, German-first (`design/PRODUCT.md`),
   named per `apps/frontend/AGENTS.md`. Check by grep + catalog diff. `en` is the
   technical fallback and must be populated — never left to fall back to a key name.

Gate findings that need a repair pass: file them with `varco finding "<gate>: <finding>"`
so the loop's back-edge carries the fix like any review cycle.

## Closing the handoff

Final pass on the brief: all sections populated, placeholders resolved, readable
end-to-end for the dev pipeline. Jira task in context → update it via the Jira MCP with
the spec link, status **Design review**; no task → ask the human where to create one.
The loop then stops at DELIVERING — the human's `human_mr_approved` is the handoff
approval; the brief is the only thing that crosses the seam.

## Anti-patterns

Starting without the context file · writing the brief only after the gates (create it
before gate 1) · deciding a component substitution alone · running gates in one window
instead of separate cold tasks · eyeballing a mechanical check (grep, catalog diff,
sidecar read) · re-scanning the design instead of reading the sidecar · treating zero
placeholders as a pass · logging trivia to the decision log (flow- and component-level
decisions only) · skipping the ticket update after the brief is written.
