# Shiftless check-in warning card — design

Date: 2026-09-08
Ticket: VOLI-1119 (check-in without shift)
Status: approved

## Problem

The manual check-in flow can now create a time entry without a shift instance. That is legitimate (spontaneous help, forgotten check-in), but it has consequences for the organization that are invisible at check-in time:

1. **No reimbursement by default.** The entry gets no `reimbursementTypeId`, so it never appears in the Stundennachweis queue and can never be marked paid (DB check `chk_time_entries_paid_requires_reimbursement_type`). Only fixable retroactively by editing the entry in the admin timesheet form (`isPaidTime` toggle).
2. **Not tied to shift planning.** Shiftless hours count in general hour totals only — never toward any shift's capacity, `filledCount`, or planning stats.
3. **Duplicate only caught at submit.** The readiness query reports `hasOpenTimeEntry: false` for the null-instance path, so a volunteer with an open shiftless entry looks ready; the duplicate fails only at mutation time with a generic Conflict toast.
4. **Empty task cell on the Stundennachweis PDF.** The invoice table renders `shiftTitle ?? entry.notes ?? ''`; a shiftless entry without notes shows a blank task cell.

Admins should see these consequences when they choose the shiftless path, so the check-in is a deliberate decision rather than a silent one.

## Decision

**Approach A — static warning card** (chosen over dynamic-via-readiness and fix-reimbursement-at-check-in; see "Alternatives considered").

An informational card, rendered in the manual check-in page when "Check in without shift" is active and a volunteer is selected. It never blocks or disables the check-in button.

Explicitly out of scope:

- No backend or `@repo/data` changes.
- No acknowledgement checkbox / confirm dialog.
- No notes-field prefill (discussed, rejected for this iteration).
- No dynamic tailoring (e.g. hiding the reimbursement bullet for orgs without reimbursement types) — possible later enhancement via the readiness query.

## Design

### Placement and rendering

- New component `CheckInWithoutShiftWarningCard` in `apps/frontend/src/domain/shift/components/manual-check-in/`, next to `check-in-readiness-card.tsx`.
- Rendered in `manual-check-in-page.tsx` directly above `CheckInReadinessCard`, visible when `withoutShift === true` and a volunteer is selected.
- The card coexists with the readiness card: blocker states (`notMember`, `pendingMembership`) still render and still gate the button; the warning is purely informational and never disables "Check in".
- Visual language follows the readiness stack (icon + title + description/bullets, matching `BlockerCard` styling) but with no action button and an informational tone rather than an error tone.

### Copy

Four bullets under the `CheckIn` namespace in `apps/frontend/messages/en.json` and `de.json` (both locales kept in sync per frontend AGENTS.md):

1. **No reimbursement by default** — the hours enter no Stundennachweis/payment pipeline unless the entry is later edited in the timesheet form.
2. **Not tied to shift planning** — the hours count in general totals only, not toward any shift's capacity or stats.
3. **Duplicate only caught at submit** — check-in fails with an error if the volunteer already has an open shiftless entry.
4. **Stundennachweis PDF** — the task column will be empty unless notes are added to the entry.

### Testing

Per frontend AGENTS.md (`bun:test`, no DOM, no rendered-component tests):

- Extract the visibility rule (show iff `withoutShift && volunteer selected`) into a small pure helper and unit-test it co-located with the component.
- The card itself stays a thin render of i18n strings; no DOM tests.
- Regression gate: `bun run check-types`, `bun run lint`, and the existing check-in domain specs (`check-in-readiness` and related) stay green.

## Alternatives considered

- **B — dynamic warning via `checkInReadiness`.** Extend the readiness query with shiftless-specific facts (org has reimbursement types configured; volunteer already has an open shiftless entry) and tailor the card. More precise, and would move duplicate detection before submit — but touches backend schema, `@repo/data`, and codegen. Deferred; can layer onto Approach A later.
- **C — fix reimbursement at check-in.** Let the admin attach a reimbursement type during shiftless check-in so complication 1 disappears instead of being warned about. Larger scope (mutation input, form UI) and changes the purpose of the check-in flow. Rejected for now.
