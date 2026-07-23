---
target: invitations-on-home.pen
total_score: 26
p0_count: 0
p1_count: 3
timestamp: 2026-07-08T08-50-15Z
slug: ai-design-design-files-invitations-on-home-pen
---
# Design Critique: invitations-on-home.pen

**Target:** `.ai/design/design_files/invitations-on-home.pen`  
**Register:** Product (volunteer-facing mobile)  
**Artboards reviewed:** `volunteer/home — Upcoming (with invitations)`, `ShiftCard/my/Invited`, `volunteer/invitation — Detail`, `volunteer/invitations — All`

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Strong invite badges and deadline on detail; home cards show status but no post-action feedback |
| 2 | Match System / Real World | 3 | Plain "Invited", "Accept", "Decline" language; placeholder strings (`{x}`, `{Address}`) still present |
| 3 | User Control and Freedom | 3 | Decline + "change your mind" copy on detail; no inline undo on home |
| 4 | Consistency and Standards | 2 | Invited cards diverge from committed cards appropriately, but token usage is mixed with hardcoded hex; All Invitations artboard content mismatch |
| 5 | Error Prevention | 3 | Respond-before deadline and capacity on detail reduce bad commits |
| 6 | Recognition Rather Than Recall | 3 | Mail icon + "Invited" label; section header makes pending work discoverable |
| 7 | Flexibility and Efficiency | 2 | Accept/Decline only on detail page; home requires extra navigation for the primary action |
| 8 | Aesthetic and Minimalist Design | 2 | Green accent stacks (container + cards + badges + banners) overspends the One Voice budget |
| 9 | Error Recovery | 3 | Reassurance copy addresses reversal; no designed undo state |
| 10 | Help and Documentation | 2 | "What you'll do" on detail helps first-timers; home section lacks brief orientation |
| **Total** | | **26/40** | **Acceptable** |

---

## Anti-Patterns Verdict

**LLM assessment:** This does not read as generic AI slop. It extends existing Clippy volunteer-home patterns (section headers, shift cards, tab bar) with purposeful differentiation for pending invites. No gradient text, glassmorphism, hero metrics, or side-stripe borders. The main risk is **green-as-decoration**: the invitations block uses a tinted container, green card strokes, green banners, and a count badge simultaneously, which drifts toward "screen looks green" and weakens Field Green as a signal.

**Deterministic scan:** CLI detector unavailable (`bundled detector not found`). Manual token review flagged hardcoded neutrals (`#09090b`, `#71717b`, `#ffffff`, `#f0fdf4`) alongside semantic variables, which will complicate dark-mode parity at implementation.

**Browser visualization:** Skipped. Target is a Pencil design file, not a renderable URL. No overlay injection attempted.

---

## Overall Impression

The direction is sound: a dedicated Invitations section between Your shifts and Discover, visually distinct invited cards, and a strong detail page with Accept/Decline and reassurance copy. The biggest gap is **action placement**. The craft brief calls for action-first pending invites, but home cards are informational only while committed cards get a Check in button. Fix that mismatch and trim the green layering, and this is ready to hand to engineering.

---

## What's Working

1. **Clear status differentiation.** Invited cards use a mail banner, green stroke, and light green banner fill versus neutral committed cards with timer + Check in. A volunteer scanning the home screen can tell pending from booked at a glance.

2. **Detail page action design.** Accept (primary) + Decline (outline) side by side, capacity row, deadline badge ("respond before Sat 14 Jun"), and "You can change your mind until the shift starts" hit the emotional goals for first-timers and regulars alike.

3. **Section IA matches the brief.** Invitations sits between Your shifts and Discover with its own header, count badge, and See all link. That supports the D2 decision without burying invites inside the horizontal shift carousel.

---

## Priority Issues

### [P1] Home invite cards have no Accept/Decline actions
- **Why it matters:** Craft decision D2 positions invitations as action-first. Committed shifts expose Check in on the home card; pending invites force a tap-through to detail before the volunteer can respond. That adds friction for phone-first, on-site users (Casey) and violates the stated "actions (Accept + Decline, never Check in)" requirement for the card variant.
- **Fix:** Add a compact action row to `ShiftCard/my/Invited` on home (Accept primary + Decline ghost/outline), or a single Accept with swipe/long-press Decline if space is tight. Keep full-width actions on detail for confirmation context.
- **Suggested command:** `impeccable shape` (card action layout) then `impeccable layout`

### [P1] Green budget overspend on the Invitations section
- **Why it matters:** DESIGN.md One Voice Rule caps Field Green at ~10% of a screen. The section uses green on: outer container stroke, container tint, title count badge, each card stroke, and each invite banner. Combined with the active day pill and tab bar highlight, green stops meaning "primary action" and becomes ambient decoration.
- **Fix:** Pick one anchor: either the section container OR the card stroke OR the banner, not all three. Prefer neutral container + green only on the primary Accept button and the count badge.
- **Suggested command:** `impeccable quieter`

### [P1] `volunteer/invitations — All` artboard content mismatch
- **Why it matters:** The artboard is named and headered for Invitations but renders Discover calendar content (`Schichten (Kalender)` with discovery shift cards). Engineers implementing from this file will ship the wrong screen.
- **Fix:** Replace body content with a vertical list of `ShiftCard/my/Invited` (full-width, with actions), grouped by day if needed. Reuse the section header pattern from home.
- **Suggested command:** `impeccable craft`

### [P2] Day strip clips horizontally on home
- **Why it matters:** Layout snapshot shows the day strip at 416px inside a 361px container (`partially clipped`). On a 393px device this will crop Saturday/Monday pills awkwardly and hide scroll affordance.
- **Fix:** Set explicit horizontal scroll on the strip or reduce pill count to fit; add fade edge or partial pill peek as scroll cue.
- **Suggested command:** `impeccable adapt`

### [P2] Redundant invitation count messaging
- **Why it matters:** Section shows a green "2" badge, title "Invitations", and subtitle "2 invitations waiting for you". Three signals for one fact increases noise without aiding comprehension.
- **Fix:** Drop the subtitle when the badge is present, or keep subtitle and use a neutral dot/badge. Earn one count indicator.
- **Suggested command:** `impeccable distill`

---

## Persona Red Flags

**Jordan (First-Timer):** Home invite cards look tappable but give no hint that Accept/Decline live inside. After tapping, they must parse a full detail page before acting. Add inline actions or a visible "Respond" affordance on the card face.

**Casey (Distracted Mobile):** Primary response requires two screens and scrolling past hero imagery on detail. For a coordinator pinged between tasks, that is one screen too many. Inline Accept on home (with detail for review) matches thumb-zone, interruption-friendly use.

**Morgan (Regular volunteer, project-specific):** Long German surname in greeting ("Hi, Longlastname!") truncates awkwardly in the header screenshot. Invitations copy is English while detail body is German. Mixed locale in one flow will break trust for German-first pilot orgs.

---

## Minor Observations

- `ShiftCard/my/Invited` reuses discovery card body layout (time, title, address) but drops org name; consider whether org context matters for multi-org volunteers.
- Detail page day picker ("Juni" + week strip) is rich for a recurring invite but may be overkill if the coordinator invited a single instance.
- Placeholder `{x} shifts this week` in Discover section should be resolved before dev handoff.
- Several nodes use hardcoded `#ffffff` / `#09090b` instead of `$card` / `$foreground`; bind to tokens before implementation.

---

## Questions to Consider

- What if Accept/Decline lived on the home card, and detail became optional review rather than mandatory?
- Does the green section container earn its weight, or would a neutral block with one green CTA per card communicate urgency better?
- Should "See all" on Invitations land on a list of invite cards only, not a calendar?
