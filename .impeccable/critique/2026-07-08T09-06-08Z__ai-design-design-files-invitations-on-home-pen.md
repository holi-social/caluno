---
target: invitations-on-home.pen
total_score: 30
p0_count: 0
p1_count: 0
timestamp: 2026-07-08T09-06-08Z
slug: ai-design-design-files-invitations-on-home-pen
---
# Design Critique: invitations-on-home.pen (2nd pass)

**Target:** `.ai/design/design_files/invitations-on-home.pen`  
**Register:** Product (volunteer-facing mobile)  
**Artboards reviewed:** `volunteer/home — Upcoming (with invitations)`, `ShiftCard/my/Invited`, `volunteer/invitations — All`, `volunteer/invitation — Detail` (×2 variants)

**Changes since last pass:** Quieter green on home invitations, All Invitations artboard fixed, hero invitation pill removed, respond-by deadline moved to action helper text. Product decision: home cards are preview-only; Accept/Decline stay on detail.

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Deadline at action point; invite status on cards; no competing hero badge |
| 2 | Match System / Real World | 3 | Plain language throughout; placeholders and one capacity math error remain |
| 3 | User Control and Freedom | 3 | Accept/Decline + reassurance on detail; preview→detail flow is intentional |
| 4 | Consistency and Standards | 3 | Home invite styling now aligns with system; two detail artboard variants need consolidation |
| 5 | Error Prevention | 3 | Respond-before deadline + capacity before commit |
| 6 | Recognition Rather Than Recall | 3 | Mail banner + "Invited · date" distinguishes pending from committed shifts |
| 7 | Flexibility and Efficiency | 3 | Two-tap respond flow is acceptable given preview-only home decision |
| 8 | Aesthetic and Minimalist Design | 3 | Green budget restored; only count badge + Accept CTA carry Field Green |
| 9 | Error Recovery | 3 | "Change your mind" copy; no designed post-accept undo |
| 10 | Help and Documentation | 2 | "What you'll do" on detail; preview cards could hint tap-to-respond |
| **Total** | | **30/40** | **Good** |

---

## Anti-Patterns Verdict

**LLM assessment:** Still not AI slop. The file now reads as a coherent extension of volunteer-home patterns. The quieter invitations section fixes the prior green-as-decoration problem. Detail hero matches other shift detail pages (event link → title → org). No gradient text, glassmorphism, side stripes, or hero-metric templates.

**Deterministic scan:** CLI detector unavailable (`bundled detector not found`). Manual review still finds hardcoded hex (`#09090b`, `#71717b`, `#ffffff`) mixed with semantic tokens.

**Browser visualization:** Skipped (Pencil design file, not a renderable URL).

---

## Overall Impression

This is in much better shape. The three biggest blockers from the first review are resolved: green overspend, wrong All Invitations content, and the cluttered hero invitation pill. What remains is polish and handoff hygiene: pick one detail variant, fix small copy/math errors, and resolve placeholders before engineering.

---

## What's Working

1. **Restrained invite differentiation.** Neutral card strokes and mail banners distinguish pending invites without painting the section green. Count badge is the only green signal in the invitations block.

2. **Detail page action zone.** Accept + Decline, capacity, and combined deadline/reassurance copy ("Respond before Sat 14 Jun. You can change your mind until the shift starts.") sit together where the decision happens. Hero stays clean.

3. **End-to-end flow is complete.** Home preview → See all list → detail respond covers the volunteer journey with consistent card shapes across surfaces.

---

## Priority Issues

### [P2] Two detail artboard variants without a canonical pick
- **Why it matters:** `AixD5` shows a fixed date row (Mon., 17 Juni); `fRr3C` adds a full week day-picker. Implementers will not know which to build.
- **Fix:** Mark one as canonical (likely `fRr3C` for recurring invites, or `AixD5` for single-instance). Disable or delete the other, or label one "recurring" and one "single instance" explicitly.
- **Suggested command:** `impeccable distill`

### [P2] Capacity copy math error on day-picker detail
- **Why it matters:** `fRr3C` shows "6 of 12 spots taken · 4 free" (should be 6 free). Breaks trust on a high-stakes decision screen.
- **Fix:** Align to "8 of 12 spots taken · 4 free" across both detail artboards, or use dynamic placeholder `{taken}` / `{free}` consistently.
- **Suggested command:** `impeccable clarify`

### [P2] Day strip still clips on home
- **Why it matters:** Layout snapshot: day strip 416px in 361px container (`partially clipped`). Fourth day pill crops without scroll cue.
- **Fix:** Horizontal scroll container or reduce visible pills; add partial peek on trailing edge.
- **Suggested command:** `impeccable adapt`

### [P2] Redundant invitation count on home
- **Why it matters:** Green "2" badge + subtitle "2 invitations waiting for you" repeat the same fact.
- **Fix:** Drop subtitle when badge is present.
- **Suggested command:** `impeccable distill`

### [P3] Placeholders and locale mix before handoff
- **Why it matters:** `{x} shifts this week`, `{Address}`, `{hh:mm}` remain; home copy is English, detail body German.
- **Fix:** Resolve placeholders; align locale per pilot org (German-first).
- **Suggested command:** `impeccable harden`

---

## Persona Red Flags

**Jordan (First-Timer):** Preview cards on home do not hint that tapping leads to Accept/Decline. Consider subtle "Tap to respond" in muted text, or rely on detail being obvious enough after one use.

**Casey (Mobile):** Two-tap flow (home → detail → respond) is acceptable given the preview-only decision, but All Invitations list also lacks a direct respond affordance. Same as home: tap-through only.

**Morgan (Regular, German-first):** Mixed EN home / DE detail copy will feel inconsistent for Hanseatic Help pilots. Unify before dev.

---

## Minor Observations

- All Invitations screen correctly mirrors home cards; good See-all destination.
- Tab bar on All Invitations still shows Home active; consider whether back-navigation makes tab state irrelevant.
- Invite banner copy "Invited · Sat 14 Jun" is clear and matches quieter system treatment.

---

## Questions to Consider

- Which detail variant is canonical: fixed date or week day-picker?
- Should preview cards get a muted "Tap to respond" hint, or is the card shape enough?
- Is the count badge alone sufficient, or would dropping the subtitle feel too sparse?
