---
name: drizzle-migration
description: Safe Drizzle migration practice for apps/backend — schema-first, generated SQL, expand-and-contract for renames. Use when a task touches the DB schema or generates a migration, or a spec mentions tables, columns, FKs, or enums.
metadata:
  type: workflow
---

# Drizzle migration practice

1. Schema change in code first (domain `schemas/`, export from `database/schema.ts`); generate the SQL, never hand-write it: `bun run db:generate` (apps/backend).
2. Apply locally: `bun run db:migrate`.
3. Expand-and-contract for renames: add new column, dual-write, backfill, drop old in a LATER release — never rename in one step (old code runs against new schema during the deploy window).
4. No DROP / type narrowing without a data check stated in the spec.
5. Soft deletes (`deletedAt`), never hard deletes on important records.
6. Every migration goes to the Migration Safety Agent at `>>review`.
