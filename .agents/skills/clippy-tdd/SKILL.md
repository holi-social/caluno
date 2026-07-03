---
name: clippy-tdd
description: Clippy's TDD specifics on top of the generic tdd skill — frozen tests, selective e2e via #test tags, the two backend runners and their exact commands. Use during IMPLEMENTING on any spec-backed work.
---

# TDD in this repo (on top of the generic `tdd` skill)

Double loop. Tests written before code are part of the contract; once approved they are
**FROZEN** for the implementer. Editing a frozen test to make it pass is a DIVERGENT
conformance finding and a forbidden anti-pattern — if a test is genuinely wrong, STOP and
surface it; changing the contract is the human's call.

1. **At spec approval**: acceptance criteria tagged `#test` get an e2e test generated
   (red). Untagged criteria get none — selective by design. The spec may override the
   level (`test-level: e2e | integration | unit`).
2. **At task start**: write failing tests for THIS subtask's acceptance criteria, confirm
   red. Two runners coexist in the backend:
   - **unit = jest**: `src/**/*.spec.ts` (pattern: `src/notification/notification.spec.ts`,
     `@nestjs/testing` + `jest.fn()`).
   - **integration = bun:test**: `apps/backend/test/` — full Nest app + Postgres, needs a
     migrated DB (`bun run db:up && bun run db:migrate`).
   Write at the unit/integration level (targeted), not user-journey e2e. **e2e stays
   selective**: only the step-1 tests for `#test`-tagged criteria — never turn an untagged
   criterion into an e2e test.
3. **During implement**: run ONLY this task's targeted test — unit:
   `bun run --cwd apps/backend test -- <file>` (jest); integration:
   `bun test apps/backend/test/<file>`. This is the steering signal; it runs often and
   must stay fast.
4. **At QUALITY**: the quality gate runs full lint + types; when the backend changed, also
   run `bun --cwd apps/backend test:e2e` (Postgres must be up — an infra failure is NOT a
   defect and consumes no budget cycle; fix the environment and re-run). CI re-runs all of
   it on the MR and is the authoritative gate.
