---
name: design-craft
description: The design loop's IMPLEMENTING discipline — high-fidelity, dev-ready design on the real design system: full state matrix, parametric placeholders, keys-not-literals, subtask economy, destinations sidecar.
---

# Design Craft (IMPLEMENTING, design-loop)

Produce high-fidelity, dev-ready design on the real design system. Cover the **full state
matrix**, not the happy path. Requires the context file; do not craft without it.

## Medium (chosen at intake, recorded in the context file)

- **Code** — real `@repo/ui` (shadcn + Tailwind) components, token-bound per
  `design/DESIGN.md`. Own branch, never `main`. Frontend blast radius only (the
  write-guard enforces it): `apps/frontend/src`, `packages/ui/src`,
  `apps/frontend/messages` — never backend, data layer, or package config/deps.
  Prototypes use mocked/placeholder data; a backend/data need is named in the brief.
- **Design files** — Figma / Paper / Pencil, referencing the real design system.

## Process

1. Read the context file; formulate the design task. Ask for missing info before starting.
2. Audit the design system: do `@repo/ui` components cover the need? Gap → component
   creation goes in the plan for human approval. Prefer importing from shadcn/ui;
   insufficient → propose modifications on the shadcn base. New components follow the
   procedure in `packages/ui/AGENTS.md` (shadcn CLI, co-located story, export from
   index) — never hand-rolled.
3. **Write a screen-by-screen plan, get approval.** The plan must:
   - Cover every state per screen: default, loading, empty, error, edge data (long
     names, zero/many items, missing media).
   - Treat **states as templates, not per-screen designs** — loading/empty/error are one
     pattern, designed once and inherited; redesigning a state per screen is the bug.
   - Use **parametric placeholders first** (`{n} frei`, `{N} von {M}`, `{Wd}, {D}.
     {Month}`) over invented values. Writing the placeholder is a design act: it forces
     the data model and exposes whether each field exists, is derived, or implies a new
     feature. The refine dynamic-data gate audits against these.
   - Author **copy as translation keys, not literals** (code medium): keys in
     `apps/frontend/messages/de.json` + `en.json`, German-first (`design/PRODUCT.md`),
     naming per `apps/frontend/AGENTS.md`. The designer owns these strings.
   - Finish one screen's states before the next; one subtask ≤ one screen, ideally one
     state of one screen.
4. **Perform each subtask as a separate, cold task** (context economy): read in first
   (context file + plan entry + only the relevant `DESIGN.md`/`PRODUCT.md` sections);
   stay in scope (no "while I'm here"); the context file is the only memory between
   subtasks; hand back small (the diff + one-line learnings).
5. **Verify every subtask with the human before proceeding.** Then update the context
   file so learnings carry forward.
6. After all subtasks: verify design-system consistency across screens, finalize the
   context file, and write the **destinations sidecar**.

## The destinations sidecar (`design/<slug>-destinations.md`)

One row per interactive element (link, button, tappable card, tab) across every crafted
screen: `Element` (label + screen) / `Type` (link/button/submit) / `Destination` (route,
action, external URL, or `none`). An unknown destination is recorded as `none` — never
omitted, never blank. Every `none` is a loose end the refine gates resolve. Enumerating
destinations is a design act: it exposes flows that don't yet have a target.

## Gates before handing to critique

State matrix complete · accessibility floor (keyboard reachable, visible focus, WCAG AA
contrast, ≥44px touch targets) · dark mode via token roles · responsive at mobile
(primary) and desktop incl. the `.page-title` bump · **only semantic OKLCH tokens** (no
`#000`/`#fff`/hex; rounding/shadow per `DESIGN.md` tiers) · real-length content, no lorem
· copy is keys in both catalogs (code medium).

**Deterministic checks (code medium — run them, don't eyeball):** grep the diff for hex
colors (zero matches); radius/shadow classes within the `DESIGN.md` tier set; contrast
computed per token pair (≥4.5:1 body, ≥3:1 large/non-text); axe-core zero
serious/critical on focus/keyboard rules; grep for literal UI strings in JSX (zero — and
every key in both `de.json`/`en.json`); `git rev-parse --abbrev-ref HEAD` ≠ main;
`bun run format` before handoff (courtesy pass — CI is the wall).

## Anti-patterns

Happy-path-only design · iterating a subtask without human verification · inventing
components instead of `@repo/ui`/shadcn · hardcoded brand values · light-mode/desktop-only
checks · lorem ipsum · proceeding past approval gates · violating `DESIGN.md` Don'ts
(nested cards, colored side-stripes, a second accent hue) · omitting a sidecar element or
leaving a destination blank instead of `none`.
