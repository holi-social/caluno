# Shiftless check-in warning card — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show admins an informational warning card in the manual check-in flow when they check a volunteer in without a shift, listing the organizational consequences of a shiftless time entry.

**Architecture:** Pure frontend change. A thin presentational card (`CheckInWithoutShiftWarningCard`) rendered by `ManualCheckInPage` when "Check in without shift" is active, plus a one-line pure visibility helper that is unit-tested per the repo's no-DOM test rule. Copy lives in the next-intl catalogs (`en`/`de`) under the existing `CheckIn` namespace. No backend, no `@repo/data`, no schema changes.

**Tech Stack:** Next.js 16 (App Router, React 19), TypeScript strict, Tailwind CSS 4, next-intl, `bun:test`, Biome.

**Spec:** `docs/superpowers/specs/2026-09-08-shiftless-check-in-warning-design.md`

## Global Constraints

- Repo root: `/Users/dima_rosmait/Documents/repos/holi/caluno/voli-1119-check-in-no-shift`. Use `bun` — never npm or yarn.
- Tests: `bun:test` only, **no DOM / no rendered-component tests** — test pure helpers, keep components thin. Run with `bun test <path>` from `apps/frontend`.
- All user-facing strings from `apps/frontend/messages/{en,de}.json` via `useTranslations`/`getTranslations`; both locales must stay in key-shape sync. Never hardcode copy.
- UI primitives from `@repo/ui` (e.g. `Card`, `CardContent`); icons from `lucide-react`; styling with Tailwind classes matching the readiness stack (`blocker-card.tsx` is the reference).
- Client-side routing/navigation from `@/i18n/navigation` (not raw `next/*`) — not needed here, but do not introduce raw Next imports.
- Gates before every commit: `bun run check-types`, `bun run lint`, and `bun test src/domain/shift` all pass from `apps/frontend`.
- Commit messages: conventional (`feat(frontend): …`, scoped to this change).
- `docs/superpowers/` is gitignored repo-wide but historically force-tracked — commit plan/spec docs with `git add -f`.

---

### Task 1: Visibility helper for the shiftless warning

**Files:**
- Create: `apps/frontend/src/domain/shift/components/manual-check-in/shiftless-check-in-warning.ts`
- Test: `apps/frontend/src/domain/shift/__tests__/shiftless-check-in-warning.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `shouldShowShiftlessCheckInWarning(withoutShift: boolean): boolean` — later tasks (and the page) use this exact name to decide rendering. On `ManualCheckInPage` the volunteer prop is always present, so the only input is the `withoutShift` flag.

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/domain/shift/__tests__/shiftless-check-in-warning.test.ts`:

```typescript
import { describe, expect, it } from 'bun:test';
import { shouldShowShiftlessCheckInWarning } from '../components/manual-check-in/shiftless-check-in-warning';

describe('shouldShowShiftlessCheckInWarning', () => {
  it('shows the warning when checking in without a shift', () => {
    expect(shouldShowShiftlessCheckInWarning(true)).toBe(true);
  });

  it('hides the warning when a shift is selected', () => {
    expect(shouldShowShiftlessCheckInWarning(false)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `apps/frontend`:
```bash
bun test src/domain/shift/__tests__/shiftless-check-in-warning.test.ts
```
Expected: FAIL — module `../components/manual-check-in/shiftless-check-in-warning` not found.

- [ ] **Step 3: Write minimal implementation**

Create `apps/frontend/src/domain/shift/components/manual-check-in/shiftless-check-in-warning.ts`:

```typescript
/**
 * Visibility rule for the shiftless check-in warning card. The volunteer is
 * always picked by the time ManualCheckInPage renders, so the only question
 * is whether the admin ticked "Check in without shift".
 */
export function shouldShowShiftlessCheckInWarning(withoutShift: boolean): boolean {
  return withoutShift;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run from `apps/frontend`:
```bash
bun test src/domain/shift/__tests__/shiftless-check-in-warning.test.ts
```
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/domain/shift/components/manual-check-in/shiftless-check-in-warning.ts \
        apps/frontend/src/domain/shift/__tests__/shiftless-check-in-warning.test.ts
git commit -m "feat(frontend): add shiftless check-in warning visibility rule"
```

---

### Task 2: Warning card component, i18n copy, and page wiring

**Files:**
- Create: `apps/frontend/src/domain/shift/components/manual-check-in/check-in-without-shift-warning-card.tsx`
- Modify: `apps/frontend/messages/en.json` (inside the `"CheckIn"` object, after `"checkInWithoutShift"`)
- Modify: `apps/frontend/messages/de.json` (same position, key-shape in sync)
- Modify: `apps/frontend/src/domain/shift/components/manual-check-in/manual-check-in-page.tsx` (imports + render slot above the readiness card)

**Interfaces:**
- Consumes: `shouldShowShiftlessCheckInWarning` from Task 1 (`(withoutShift: boolean) => boolean`); `useTranslations('CheckIn')` keys added in this task.
- Produces: `<CheckInWithoutShiftWarningCard />` (no props) — rendered by `ManualCheckInPage` above `CheckInReadinessCard`.

- [ ] **Step 1: Add the i18n keys (en)**

In `apps/frontend/messages/en.json`, inside the `"CheckIn"` object, insert the following five keys after `"shiftSheetTitle"` so the block stays alphabetically sorted (Biome does not enforce JSON key order; keep it tidy like the surrounding entries):

```json
    "shiftlessWarningDuplicateAtSubmit": "If this volunteer already has an open check-in without a shift, the check-in will fail with an error.",
    "shiftlessWarningEmptyTaskCell": "The Stundennachweis PDF shows an empty task column unless notes are added to the entry.",
    "shiftlessWarningNoReimbursement": "These hours get no reimbursement type. They won't enter the Stundennachweis or payment pipeline unless you edit the entry later.",
    "shiftlessWarningNoShiftStats": "The hours count toward general totals only, not toward any shift's capacity or planning.",
    "shiftlessWarningTitle": "Checking in without a shift",
```

- [ ] **Step 2: Add the i18n keys (de)**

In `apps/frontend/messages/de.json`, insert the same five keys with identical key names at the matching position inside `"CheckIn"`:

```json
    "shiftlessWarningDuplicateAtSubmit": "Wenn diese Person bereits ein offenes Check-in ohne Schicht hat, schlägt das Check-in mit einer Fehlermeldung fehl.",
    "shiftlessWarningEmptyTaskCell": "Im PDF des Stundennachweises bleibt die Spalte für die Aufgabe leer, wenn dem Eintrag später keine Notiz hinzugefügt wird.",
    "shiftlessWarningNoReimbursement": "Diese Stunden erhalten keine Vergütungsart. Sie erscheinen nicht im Stundennachweis bzw. in der Abrechnung, wenn du den Eintrag später nicht bearbeitest.",
    "shiftlessWarningNoShiftStats": "Die Stunden zählen nur in die Gesamtstunden, nicht in die Kapazität oder Planung einer Schicht.",
    "shiftlessWarningTitle": "Check-in ohne Schicht",
```

- [ ] **Step 3: Create the card component**

Create `apps/frontend/src/domain/shift/components/manual-check-in/check-in-without-shift-warning-card.tsx`:

```tsx
'use client';

import { Card, CardContent } from '@repo/ui';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Informational warning shown while "Check in without shift" is active.
 * Lists the organizational consequences of a shiftless time entry so the
 * check-in is a deliberate decision. Never blocks the check-in button.
 */
export function CheckInWithoutShiftWarningCard() {
  const t = useTranslations('CheckIn');

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Info className="size-5" />
          </div>
          <p className="font-semibold">{t('shiftlessWarningTitle')}</p>
        </div>
        <ul className="list-disc space-y-1 pl-10 text-sm text-muted-foreground">
          <li>{t('shiftlessWarningNoReimbursement')}</li>
          <li>{t('shiftlessWarningNoShiftStats')}</li>
          <li>{t('shiftlessWarningDuplicateAtSubmit')}</li>
          <li>{t('shiftlessWarningEmptyTaskCell')}</li>
        </ul>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Wire the card into ManualCheckInPage**

In `apps/frontend/src/domain/shift/components/manual-check-in/manual-check-in-page.tsx`:

4a. Add the import (next to the other `./` imports around line 31-36):

```tsx
import { CheckInWithoutShiftWarningCard } from './check-in-without-shift-warning-card';
```

4b. Add the derived flag next to `showReadinessCard` (around line 134-136):

```tsx
  // Informational only: never gates the check-in button, unlike the
  // readiness card, which only earns its place while it blocks.
  const showShiftlessWarning = shouldShowShiftlessCheckInWarning(withoutShift);
```

4c. Add the import for the helper (with the other `./` component imports near lines 31-36):

```tsx
import { shouldShowShiftlessCheckInWarning } from './shiftless-check-in-warning';
```

4d. Render the card directly above the readiness card (insert before the `{showReadinessCard && readinessState && (` block around line 251):

```tsx
        {showShiftlessWarning && <CheckInWithoutShiftWarningCard />}
```

- [ ] **Step 5: Run the gates**

Run from `apps/frontend`:
```bash
bun run check-types
bun run lint
bun test src/domain/shift
```
Expected: all pass. `check-types` must be clean (strict mode); lint uses Biome; the shift domain tests include the new Task 1 spec plus the existing `check-in-readiness` and related suites.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/domain/shift/components/manual-check-in/check-in-without-shift-warning-card.tsx \
        apps/frontend/src/domain/shift/components/manual-check-in/manual-check-in-page.tsx \
        apps/frontend/messages/en.json apps/frontend/messages/de.json
git commit -m "feat(frontend): warn about shiftless check-in consequences"
```

---

## Self-Review

**Spec coverage:**
- Warning card shown when "without shift" active + volunteer selected → Task 1 helper (`withoutShift` is the only input; volunteer is always present on this page) + Task 2 wiring. ✅
- Informational, never blocks the button → Task 2 Step 3 (no button/disabled logic) + Step 4 (rendered independently of the button gate). ✅
- Four complications in copy → Task 2 Steps 1-2 (reimbursement, shift planning, duplicate-at-submit, PDF task cell). ✅
- en + de key-shape sync → Task 2 Steps 1-2. ✅
- Visual language matches readiness stack → Task 2 Step 3 reuses `Card`/`CardContent` + muted icon circle from `BlockerCard`. ✅
- Testing per no-DOM rule → Task 1 (pure helper, real tests); Task 2 gates via check-types/lint/existing suites. ✅
- Out-of-scope items (backend, acknowledgement, notes prefill, dynamic tailoring) → absent from plan, matching spec. ✅

**Placeholder scan:** no TBD/TODO; every code step has complete code. ✅

**Type consistency:** `shouldShowShiftlessCheckInWarning(withoutShift: boolean): boolean` defined in Task 1, imported and called with `withoutShift: boolean` (page state, line 72) in Task 2. `CheckInWithoutShiftWarningCard` takes no props in both definition and usage. i18n key names identical across en/de and component. ✅
