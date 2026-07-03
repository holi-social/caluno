---
name: migration-safety
description: Review rubric for any Drizzle migration — destructive ops, rollback, the old-code/new-schema deploy window, locking, deploy ordering. For REVIEWING when a migration is in the diff. (The how-to-create recipe is the separate drizzle-migration skill.)
---

# Migration Safety (review rubric)

Any Drizzle migration in the change-set gets this pass (distinct from the
`drizzle-migration` skill, which is the *authoring* recipe):

- **Destructive operations** — drops, truncates, type narrowing, NOT NULL on existing
  columns: each needs an explicit justification and a backfill/step plan.
- **Rollback** — is there a safe way back? What state does a half-applied failure leave?
- **The deploy window** — old code runs against the new schema during deploy: FK
  integrity, defaults, and reads/writes must survive that overlap in BOTH directions.
- **Table locking** — will this lock a hot table? (long ALTERs, index builds without
  CONCURRENTLY, volume of rewrites).
- **Deploy ordering** — schema vs. code vs. data backfill: state the required order
  explicitly; "migrate then deploy" is a claim, verify it holds for this change.
- **Schema ↔ migrations in sync** — CI's `check_migrations` enforces it; don't hand-edit
  one side.
