---
target: attach-requirements-invites-events-shifts.pen
total_score: 23
p0_count: 0
p1_count: 3
timestamp: 2026-07-09T17-01-30Z
slug: iles-attach-requirements-invites-events-shifts-pen
---
# Critique: attach-requirements-invites-events-shifts.pen

**Target:** `.ai/design/design_files/attach-requirements-invites-events-shifts.pen`  
**Register:** product (backoffice coordinator surfaces)  
**Context:** `.ai/design/PRODUCT.md`, `.ai/design/DESIGN.md`, design context file

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Green-dot pill signals count, not enforcement; toggle-off-with-forms state missing everywhere except shift (and only ON) |
| 2 | Match System / Real World | 2 | Event surfaces reuse org-join copy ("Forms required to join", "Completed before approval into…") |
| 3 | User Control and Freedom | 3 | Cancel/save, remove-form X, close sheet present; no undo on destructive remove |
| 4 | Consistency and Standards | 2 | Three attachment patterns with divergent titles, button labels, toggles, and de-dup copy |
| 5 | Error Prevention | 2 | No guardrails for removing last form, disabling enforcement, or long German strings |
| 6 | Recognition Rather Than Recall | 3 | Header pill + search dropdown are discoverable; events table column aids scan |
| 7 | Flexibility and Efficiency | 2 | Add-existing search is strong; no edit flows, no loading templates, duplicate artboards slow review |
| 8 | Aesthetic and Minimalist Design | 3 | Calm shadcn-like product UI; clutter from duplicate frames and mixed shell specs |
| 9 | Error Recovery | 1 | No loading, error, or empty-table edge states designed |
| 10 | Help and Documentation | 3 | De-dup info footer is good contextual help where it appears |
| **Total** | | **23/40** | **Acceptable — significant craft gaps before dev handoff** |

## Anti-Patterns Verdict

**LLM assessment:** Does not read as generic AI slop (no gradient text, glassmorphism, hero metrics, or identical marketing card grids). It reads as a credible coordinator admin surface in the Clippy/Notion vein. The failure mode is **incomplete craft and pattern drift**, not aesthetic AI-ness. Imported shift shells (`#f0f0f0` backdrop, 256 vs 280px sidebars, 12px/13px type) feel like merge artifacts rather than intentional design.

**Deterministic scan:** Unavailable — `detect.mjs` entrypoint missing in this environment. No browser overlay (Pencil `.pen` source, not renderable HTML).

**Absolute-ban check:** No side-stripe borders, gradient text, or glassmorphism detected in source. Card-in-sheet nesting exists for event/shift forms; acceptable if this becomes a shared component, but watch against nested-card anti-pattern on detail pages.

## Overall Impression

Org-invite work is the strongest slice: header pill, populated/empty components, and form search dropdown form a coherent VOLI-814 handoff. Events and shifts are only partially landed — the table column is a good addition, but the state matrix stops halfway. The single biggest opportunity is to **finish the enforcement model visually** (toggle on/off, configured-but-off, table badge semantics) and **unify copy/components** across org, event, and shift before more pixels.

## What's Working

1. **Org-invite pill → popover → search** — Right pattern for a list page: low visual weight in the header, full configuration on demand, reusable standalone components (`Forms Required Button`, `Component to attach form`, `Form Search Dropdown`).
2. **Events table "Required forms" column** — Scannable badge pattern (`2 forms` / `None`) matches shift count badges; supports coordinator glance workflows.
3. **Shift Required Forms Card structure** — Toggle in header, inline list, paired actions, and contextual de-dup hint follow product register conventions and DESIGN.md switch-in-card guidance.

## Priority Issues

### [P1] Enforcement toggle missing on org and event surfaces
- **What:** Toggle exists only on shift `Required Forms Card` (always ON). Org popover and event inline card have no enforcement switch; toggle-off-with-retained-list is undrawn.
- **Why it matters:** Product intent is requirements as a **setting** enforced at approval/join/signup. Without toggle states, dev and QA will guess behavior; coordinators cannot see configured-but-paused enforcement.
- **Fix:** Add switch to org popover header and event card header; draft three states: ON+forms, OFF+forms retained (muted list + pill/badge variant), ON+empty.
- **Suggested command:** `impeccable harden` (edge states) + continued Pencil craft

### [P1] Copy and component vocabulary diverge across the three levels
- **What:** Org/event use "Forms required to join" / "Completed before approval into Clippy › Health"; shift uses "Required forms" / "Anyone joining this shift must complete these". Buttons: "+ Add existing" vs "+ Add existing form"; de-dup footer has two phrasings; event subtitle describes org approval, not event signup.
- **Why it matters:** Violates PRODUCT.md principle "Same job, same shape" and DESIGN.md consistency. German translations will diverge further.
- **Fix:** Pick one title/subtitle template per entity type (org join, event signup, shift signup) and one action-label pair; document in context file; propagate to all components.
- **Suggested command:** `impeccable clarify`

### [P1] Incomplete state matrix (events + shifts)
- **What:** Missing: event create populated, toggle-off, edit sheet, add-existing picker; shift empty card, toggle-off, edit sheet, picker overlay. Three duplicate `S3` and two duplicate `S10`/`S9a` frames.
- **Why it matters:** Incomplete matrices cause implementation gaps and review fatigue; duplicates signal uncertainty about canonical variants.
- **Fix:** Complete the seven subtasks in context file; delete or mark duplicate frames; keep one canonical artboard per state.
- **Suggested command:** `impeccable craft` (Pencil continuation)

### [P2] Design-system token drift in shift artboards
- **What:** S10 shells use hardcoded `#f0f0f0`, `#ffffff` toggle knobs, `fontSize` 12/13 (below 14px floor), `cornerRadius` 12 instead of `$radius-xl`, mixed sidebar widths (256 vs 280).
- **Why it matters:** Breaks Flexibility-before-identity and 14px Floor rules; implementation will not match `clippy-design-system.lib.pen` without cleanup.
- **Fix:** Rebind to library tokens; upsize helper/metadata type to `$text-xs` minimum; normalize shells to match S2a/S9 artboards.
- **Suggested command:** `impeccable polish`

### [P2] Ambiguous status signaling on header pill
- **What:** Green dot communicates "has forms" on the pill (`No forms required` uses muted dot; `2 forms required` uses primary dot) but does not distinguish enforcement OFF with forms configured.
- **Why it matters:** Coordinators may think volunteers are still blocked when enforcement is paused.
- **Fix:** Define pill variants: none / N forms active / N forms paused (muted badge copy e.g. "2 forms (off)"); align with table column semantics.
- **Suggested command:** `impeccable clarify` + `impeccable layout`

## Persona Red Flags

**Alex (Event Planner / power coordinator):** Cannot quickly see enforcement status across events without opening each sheet. Duplicate artboards slow design review. No edit-event path means workflow continuity is unverified. Table helps, but toggle-off rows are absent.

**Jordan (first-time coordinator):** "Forms required to join" on an event create sheet sounds like org membership, not event registration — will mis-set expectations. Two different de-dup footers teach conflicting mental models. Focus ring (`$ring` stroke) on "+ Add existing" in populated event card looks like a permanent selected state, not a focus affordance.

**Riley (stress tester):** No designs for 0/10/20 attached forms, long form names, loading/error, or remove-all-forms. Toggle-off retention untested. Events table shows `None` vs counts but not paused-enforcement variant.

**Mara (Volunteer Manager — project-specific):** Spends long desk sessions; needs parity between Volunteers pill workflow and Events/Shifts sheet workflow. Shift and event surfaces feel like different products (toggle only on shift, different button labels). Will file bugs on "why can I turn it off for shifts but not events?"

## Minor Observations

- Misnamed frame `Create Event Sheet` inside S9a carries popover title "Forms required to join" — rename to avoid dev confusion.
- Populated event `Component to attach form` uses focus-ring styling on default Add button; should be default border until focused.
- `fontSize` 12 appears 31× and 13 appears 47× — systematic cleanup needed.
- Shift info footer at 12px vs org at 13px — pick `$text-xs` everywhere.
- Consider whether events list needs click-through from forms badge to edit (not designed).

## Questions to Consider

- Should event copy say "before signing up" instead of "before approval into {org}"?
- When enforcement is OFF but forms remain, should the table show `2 forms (paused)`, `Configured`, or still `2 forms`?
- Is the org pill the right pattern for events detail, or only for list-level Volunteers header?
- What is the single canonical component: one `RequirementFormsCard` with placement variants (popover vs inline)?
