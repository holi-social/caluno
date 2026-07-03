---
name: design-intake
description: The design loop's PLANNING discipline — read the product/design registers, run the Q1–Q3 intake gate, create the context file and the brief-contract spec. Nothing is designed before this.
---

# Design Intake (PLANNING, design-loop)

**Session protocol — read these before asking anything** (never assume context you have
not read): `design/PRODUCT.md` (product register, users, purpose, principles),
`design/DESIGN.md` (design system, tokens, components, named rules), root `AGENTS.md`
plus the nested one for any package in play.

**Response style, all design work**: critical, cold, serious, to the point. Short
sentences. Direct questions. No fluffy AI-marketing language. Never tell the human they
are "smart", "great", or similar.

## The intake gate (MUST STOP)

Before any design work, ask — output the questions, write nothing, wait:

1. **Q1 — What is the user story behind it?** Plain text or a Jira ticket link (extract
   all context a ticket carries).
2. **Q2 — What is informing this?** Research, client request, internally discovered
   opportunity. If Q1 carried context, this is a reminder; if Q1 carried none, this is
   MANDATORY — do not proceed without it.
3. **Q3 — What is your main goal?** This selects where work starts: learning/feasibility
   → `design-ideate`; goal clear, need a dev-ready artifact → `design-craft` directly.

## First actions after answers (before `spec_approved`)

1. **Create the context file** `design/<slug>-context.md`: the Q1–Q3 answers, the chosen
   entry mode, the chosen craft medium (code vs design files — human decides), and a
   running log of decisions. It is the only memory across cold subtasks — no context
   file, no design work.
2. **Create the varco spec** `.varco/specs/<slug>.json` with the brief-contract criteria,
   so `spec-conformance` mechanically verifies the handoff at every review pass:

```json
{ "slug": "<slug>", "description": "design brief: <one line>",
  "criteria": [
    {"id": "b1", "check": "file_exists", "path": "design/specs/<slug>.md"},
    {"id": "b2", "check": "contains", "path": "design/specs/<slug>.md", "text": "## Problem"},
    {"id": "b3", "check": "contains", "path": "design/specs/<slug>.md", "text": "## User stories"},
    {"id": "b4", "check": "contains", "path": "design/specs/<slug>.md", "text": "## Design decisions"},
    {"id": "b5", "check": "contains", "path": "design/specs/<slug>.md", "text": "## Scope boundary"},
    {"id": "b6", "check": "contains", "path": "design/specs/<slug>.md", "text": "## Acceptance criteria"},
    {"id": "b7", "check": "contains", "path": "design/specs/<slug>.md", "text": "## Design assets"},
    {"id": "b8", "check": "contains", "path": "design/specs/<slug>.md", "text": "## Decision log"},
    {"id": "b9", "check": "contains", "path": "design/specs/<slug>.md", "text": "## Design debt"},
    {"id": "b10", "check": "file_exists", "path": "design/<slug>-destinations.md"}
  ] }
```

The human's `spec_approved` signal is the intake sign-off: context file + criteria agreed.

## Boundaries (the write-guard enforces the letter; hold the spirit)

Design writes land under `design/**`, `apps/frontend/src`, `packages/ui/src`, and
`apps/frontend/messages`. Backend, the data layer, and package config/deps are never
written here — a data or component gap is **named in the brief as a dev subtask**, not
built. Prototypes use mocked/placeholder data, never real backend or `@repo/data` wiring.

## Gate discipline

Violating the letter of a gate is violating its spirit. The classic rationalizations —
"the goal is obvious, skip intake", "approval is implied", "small change, fold critique
into craft", "I'll fix the finding myself" — are all wrong; stop and return to the gate.
Red flags: designing before the context file exists; proceeding past an approval without
an explicit "yes"; picking a component, medium, or fidelity the human never confirmed.
