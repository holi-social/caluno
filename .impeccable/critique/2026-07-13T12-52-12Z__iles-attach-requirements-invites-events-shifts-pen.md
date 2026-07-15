---
target: attach-requirements-invites-events-shifts.pen
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-07-13T12-52-12Z
slug: iles-attach-requirements-invites-events-shifts-pen
---
# Critique: attach-requirements-invites-events-shifts.pen

**Target:** `.ai/design/design_files/attach-requirements-invites-events-shifts.pen`  
**Register:** product (backoffice coordinator surfaces)  
**Context:** `.ai/design/PRODUCT.md`, `.ai/design/DESIGN.md`, `.ai/design/attach-requirements-invites-events-shifts-context.md`  
**Prior run:** 23/40 (2026-07-09)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Count-only pill/table is clear after toggle removal; still no loading/saving feedback designed |
| 2 | Match System / Real World | 3 | Level-specific copy locked (join / sign up / shift); org path subtitle appropriate on org surfaces only |
| 3 | User Control and Freedom | 3 | Cancel/save, remove-form X, close sheet present; no undo on destructive remove |
| 4 | Consistency and Standards | 3 | Actions, de-dup footer, and titles unified; S10 shift shells still diverge from S2a/S9 token shell |
| 5 | Error Prevention | 2 | No guardrails for long form names, many attached forms, or remove-all edge |
| 6 | Recognition Rather Than Recall | 3 | Events table column + org pill + search dropdown support scan-at-a-glance |
| 7 | Flexibility and Efficiency | 2 | Add-existing strong on org; event/shift pickers and edit sheets still missing |
| 8 | Aesthetic and Minimalist Design | 3 | Calm product UI; `S10 — Shift calendar` and shift create shells carry merge-artifact drift |
| 9 | Error Recovery | 1 | No loading, error, or failed-save states in any surface |
| 10 | Help and Documentation | 3 | Unified de-dup footer is consistent contextual help |
| **Total** | | **26/40** | **Acceptable — improved foundation; handoff gaps remain** |

## Anti-Patterns Verdict

**LLM assessment:** Still does not read as generic AI slop. No gradient text, glassmorphism, hero metrics, or marketing card grids. The surface reads as a credible Clippy backoffice extension. Residual weakness is **incomplete craft and shell inconsistency**, not aesthetic AI-ness. The enforcement-toggle removal was the right simplification: attached forms = required is easier to communicate than configured-but-off states.

**Deterministic scan:** Unavailable — `detect.mjs` entrypoint missing in this environment. No browser overlay (Pencil `.pen` source, not renderable HTML).

**Absolute-ban check:** No side-stripe borders, gradient text, or glassmorphism. Card-in-sheet nesting for event/shift forms is acceptable as a shared component pattern.

## Overall Impression

Meaningful progress since the first critique. Copy vocabulary, de-dup footer, and core create flows (event populated/empty, shift populated/empty) now form a coherent story. The S2a table rebalance fixes the crushed Dates/Location columns. The file is ready for **continued craft**, not dev handoff yet: edit flows, cross-context pickers, and system-state templates are still absent, and shift artboards need token normalization.

## What's Working

1. **Enforcement model simplification** — Removing requirement-form toggles aligns UI with the locked decision (attached = enforced, empty = none). Open Shift toggles remain correctly scoped. Coordinators are not asked to reason about paused enforcement that does not exist in product intent.
2. **Copy decisions propagated** — Org (`Forms required to join`), event (`Forms required to sign up`), shift (`Required forms`) with matching subtitles and empty states. `+ Add existing` / `Create new` and one de-dup line everywhere.
3. **S2a events table** — Rebalanced columns (Event 220, Dates 136, Location fill, Shifts 88, Forms 128, Actions 140), muted dates/location, `None` at `$text-xs`, long-title row at 72px. Scannable alongside shift count badges.

## Priority Issues

### [P1] State matrix still incomplete for events and shifts
- **What:** Missing edit event sheet (empty + populated), edit shift sheet, add-existing picker overlays in event/shift context, and loading/error templates. Context file gaps 5–7 remain open.
- **Why it matters:** Dev and QA will invent these states at implementation time. Coordinators cannot validate edit-path continuity or failure recovery before build.
- **Fix:** Add four artboards minimum: edit event (empty + populated), edit shift (empty + populated), event picker overlay, shift picker overlay. Inherit one loading + one error pattern from design system.
- **Suggested command:** `impeccable craft` (Pencil continuation)

### [P1] Shift shell token drift vs canonical artboards
- **What:** `S10 — Create shift` artboards and `S10 — Shift calendar` use hardcoded `#f0f0f0` backdrop, `#ffffff` toggle knobs, `fontSize` 12 (23×) and 13 (58×), `cornerRadius` 12 on some cards, 280px sidebar vs 256px on S2a/S9.
- **Why it matters:** Violates DESIGN.md 14px Floor and tinted-neutral rules. Implementation will not match `clippy-design-system.lib.pen` without a cleanup pass.
- **Fix:** Rebind shift shells to `$background`, `$primary-foreground` knobs, `$text-xs` minimum type, `$radius-xl` on actions, 256px sidebar to match S2a/S9.
- **Suggested command:** `impeccable polish`

### [P2] Forms column `None` vs badge asymmetry
- **What:** Shifts column uses outline badges (`12 shifts`); forms with counts use outline badges (`2 forms`); empty rows use plain muted `None` text without badge chrome.
- **Why it matters:** Minor scan inconsistency; coordinators may read `None` as lower emphasis than counts (acceptable) or as a different component family (confusing).
- **Fix:** Either wrap `None` in the same outline badge with muted label, or document intentional text-only empty state in context file.
- **Suggested command:** `impeccable layout`

### [P2] Orphan / ambiguous `S10 — Shift calendar` artboard
- **What:** 1440×908 artboard with `layout: none`, absolute shell, not listed in context inventory. Sits beside create-shift flows with different dimensions and styling.
- **Why it matters:** Reviewers and devs may treat it as canonical shift context when it is a calendar shell placeholder.
- **Fix:** Either integrate into context inventory with explicit purpose, or remove/archive if out of scope for this craft pass.
- **Suggested command:** `impeccable distill`

### [P2] No stress / edge-state coverage
- **What:** No designs for 10+ attached forms, long German form titles, table overflow, or remove-last-form confirmation.
- **Why it matters:** Humanitarian-aid orgs will hit long names and many forms; without stress artboards, layout breaks ship to production.
- **Fix:** One stress artboard per surface type (org popover, event sheet, shift sheet, events table row).
- **Suggested command:** `impeccable harden`

## Persona Red Flags

**Alex (Event Planner / power coordinator):** Still cannot verify edit-event or edit-shift workflows in the file. Must open create sheets only. No keyboard/bulk affordances designed (acceptable for static craft, but edit parity is a gap). Table column helps list scan; no click-through from forms badge to edit.

**Jordan (first-time coordinator):** Level-specific copy is now clearer (event says "sign up", not org "join"). Empty-state subtitles on event and shift sheets explain zero-forms case. Still no loading confirmation after save, so Jordan will not know if attach/remove succeeded during implementation.

**Riley (stress tester):** Long event title row exists (72px) but no long form-name rows in attached lists. No many-forms scroll behavior. `S10 — Shift calendar` shell at 1440px does not match 1280px list artboards for responsive review.

**Mara (Volunteer Manager — project-specific):** Org pill workflow and event/shift inline cards now share action labels and footer copy, reducing "different product" feeling. Placement difference (pill vs inline) is intentional but Mara will still ask why events list shows forms while volunteers page uses a pill: document in handoff notes.

## Minor Observations

- Standalone `Component to attach form` uses `cornerRadius: 12` instead of `$radius-lg`.
- Two `S3 — Create event sheet` artboards (populated + empty) are intentional; frame name `Create Event Sheet` inside S9a is separate (sheet chrome label).
- Org standalone components correctly retain org-level copy; do not reuse verbatim on event surfaces.
- Pill variants (`No forms required` / `2 forms required`) align with simplified enforcement model.

## Questions to Consider

- Should `None` in the events table match the outline badge pattern used for shift counts?
- Is `S10 — Shift calendar` in scope for this craft pass, or a leftover import to remove?
- Should clicking a forms badge on the events list open edit-event sheet (not designed)?
- One shared `RequirementFormsCard` component with placement variants (popover vs inline): worth extracting before edit sheets?
