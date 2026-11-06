# Task 8 report: Full verification gate

## Status

**FAILED** (historical run below). **Superseded for lint/types + accounting leftovers:** see [Fix (2026-11-06)](#fix-2026-11-06).

Branch: `main`. Prior note: ahead of `origin/main` by prior accounting-removal commits.

## Commits

- `fix: clear accounting leftovers and format baseline snapshot` — Biome-formatted baseline `snapshot.json`; removed stale `['accounting','setup-status']` invalidations. (Resolve exact SHA with `git log -1 --oneline` on `main`.)

## 1. Lint + types

Command:

```bash
bun run lint && bun run check-types
```

**Exit 1** at lint. `check-types` did not run in this combined command (`&&` short-circuit).

`turbo run format-and-lint` → `biome check .`

- Checked 1327 files in 479ms. No fixes applied. Found 1 error.
- `apps/backend/src/database/migrations/20261106171308_baseline/snapshot.json` — formatter would collapse single-item and short arrays onto one line (`prevIds`, enum `values`, FK `columns` / `columnsTo`). Biome reported “1793 more lines truncated.”
- `error: script "lint" exited with code 1`
- Tasks: 0 successful, 1 total. Time ~1.06s. Failed: `//#format-and-lint`.

Follow-up (same session, because the combined command never reached types):

```bash
bun run check-types
```

**Exit 0.** `turbo run check-types`: 8 successful, 8 total, 1 cached, ~21.8s.

- `@repo/data` codegen cache hit.
- `@repo/ui` Storybook build completed. Warning: some chunks > 500 kB; Vite plugin timings note.
- Turbo warning: `no output files found for task @repo/ui#build`.

## 2. Backend unit tests

```bash
bun run --cwd apps/backend test
```

(`bun test src`, bun test v1.4.4)

**Exit 1.**

```
345 pass
2 fail
1184 expect() calls
Ran 347 tests across 52 files. [8.18s]
error: script "test" exited with code 1
```

Failures:

1. `NotificationModule > sends membership approved email with the check-in QR attached when event is emitted` (108.37ms) — `emailService.send` was not called after a 100ms wait (`notification.spec.ts:344`). Isolated re-run of that test name **passed** in 126.65ms (`1 pass, 36 filtered out`). The suite wait is shorter than QR generation under load. Not an accounting reference.
2. `EventService.updateEventInviteStatus PostHog > records previous_status when a volunteer cancels their participation` (0.79ms) — `BadRequestGraphQLError: You can no longer cancel your participation after the event has started`. Fixture `startsAt` is `2026-10-01T09:00:00.000Z`; today is 2026-11-06, so `Date.now() > event.startsAt` in `event.service.ts` rejects the cancel before PostHog capture. Not an accounting reference.

## 3. Integration tests

Postgres was already accepting connections on `localhost:5432`. `bun run db:up` was not re-run.

```bash
bun test apps/backend/test/
```

**Exit 1.** Storage specs passed (MinIO reachable for those cases). No DB/MinIO startup failure.

```
1 tests failed:
(fail) ShiftService.updateShiftInstance applyToAllFuture — non-UTC host timezone > does not shift startsAt/endsAt when resubmitted unchanged with applyToAllFuture [7.18ms]

500 pass
1 fail
25 errors
1722 expect() calls
Ran 501 tests across 20 files. [12.50s]
```

The failing test throws `ConflictGraphQLError: Cannot edit a past or completed shift instance` (`shift.service.ts:1592`, called from `shift.integration.spec.ts:5197`). The fixture is a weekly shift from `2026-10-07` with `UNTIL=20261101T000000Z`. On 2026-11-06 every instance is in the past. Not an accounting reference.

The 25 errors are Postgres `57P01` / `terminating connection due to administrator command` while the isolated test database is dropped. They are teardown noise, not additional failing tests. The database was dropped (`Dropped test database caluno_test_62789_mw590x76`).

## 4. Leftover scan

```bash
rg -n 'reimbursementType|ReimbursementType|Pauschale|pauschale|/admin/.*/accounting|AccountingModule|document_templates|PERMISSIONS\.ACCOUNTING|accountingEnabled' \
  --glob '!**/.ai/**' --glob '!**/node_modules/**' --glob '!docs/superpowers/**'
```

**Not clean.** 2 matches, 1 file:

```
scripts/accounting-purge-paths.txt:4:apps/frontend/src/app/[locale]/admin/[orgUId]/accounting/
scripts/accounting-purge-paths.txt:22:apps/backend/src/database/migrations/20260910094902_soft_delete_seeded_document_templates/
```

Both are path strings in the purge inventory. Those directories are gone. `docs/superpowers/**` was excluded as allowed. No live `AccountingModule`, `reimbursementType`, `Pauschale`, `accountingEnabled`, or `document_templates` schema hits outside that inventory file.

A wider case-insensitive `accounting` search (excluding `.ai`, `node_modules`, `docs/superpowers`, migrations, and `snapshot.json`) also hits comments / a stale query key that the brief regex does not match:

- `apps/frontend/src/domain/org-unit/forms/edit-form.tsx` — `queryKey: ['accounting', 'setup-status']`
- `apps/frontend/src/domain/organization/components/organization-profile-form.tsx` — same query key, plus a comment that accounting reads the org profile
- `apps/backend/src/time-tracking/time-tracking.service.ts` — comment mentioning timesheet/accounting data
- `apps/backend/src/database/fixtures.ts` — comment about accounting documents

## Why nothing was fixed

The brief allows a small fix commit (`fix: clear remaining accounting leftovers for quality gate`) only when lint, types, or tests fail because of leftover accounting references. These failures do not:

- Lint is Biome layout on the rebaseline `snapshot.json`.
- The two unit failures are a 100ms wait vs ~127ms QR generation, and a fixture date that is now in the past.
- The integration failure is the same class of date-relative fixture (`UNTIL` 2026-11-01, today 2026-11-06).
- The scan hits are inventory paths, not code the compiler or tests import.

## Concerns

1. **Unit/integration tests** from the historical run below may still fail for date-relative fixtures or timing; not re-run in the fix pass (see [Fix (2026-11-06)](#fix-2026-11-06)).
2. **`scripts/accounting-purge-paths.txt`** still matches the leftover scan — expected inventory of removed paths.
3. **Resolved in fix pass:** Biome on baseline `snapshot.json`, stale `['accounting','setup-status']` invalidations in org profile / org-unit forms.
4. **`.ai`** submodule may show dirty locally from bootstrap; it was not committed for this work.

## Fix (2026-11-06)

- **`snapshot.json`**: Ran `bunx biome check --write` on `apps/backend/src/database/migrations/20261106171308_baseline/snapshot.json` so `biome check .` passes.
- **Stale query keys**: Removed `['accounting', 'setup-status']` invalidations and related comments from `organization-profile-form.tsx` and `edit-form.tsx`. Profile save still invalidates `['organization-unit', rootUnitId]`; org-unit edit still invalidates `['organization-unit', editOrgUnitId]`.
- **Verification**: `bun run lint && bun run check-types` — **exit 0** (Biome: 1370 files checked; types: all 8 tasks successful).
- **Leftover scan**: Same `rg` pattern as above — only `scripts/accounting-purge-paths.txt` (inventory). No `['accounting', …]` / `setup-status` matches under `apps/frontend` for those patterns.
- **Commit**: `fix: clear accounting leftovers and format baseline snapshot` (exact SHA: `git log -1 --oneline`).
- **Out of scope**: Unit/integration test suites were not re-run here (prior failures were date/timing flakes unrelated to these edits).
