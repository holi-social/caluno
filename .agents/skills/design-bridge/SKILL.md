---
name: design-bridge
description: The design->code entry point (was >>fromdesign) — a design brief exists at design/specs/<slug>.md; treat it as primary input, don't re-derive what it settled. Use at PLANNING in the fromdesign loop.
---

# Design Bridge (design → code)

Entry point when a design brief exists at `design/specs/<slug>.md` — the design
pipeline's handoff (problem, user stories, design decisions, acceptance criteria,
`@repo/ui` assets, design debt).

- **Read the brief first and treat it as primary input** — do NOT re-derive what it
  already settled.
- If the design pipeline left a **frontend prototype branch**, read it as *reference*,
  never as the deliverable.
- Then run the normal spec flow **seeded from the brief** (glossary grep on its nouns,
  scope check, acceptance criteria carried over — `#test` tags included), and write the
  dev spec after approval per the `spec-writing` skill.

The brief's design decisions are settled inputs; a conflict between the brief and what
implementation reveals is a STOP-and-surface, not a silent re-decision.
