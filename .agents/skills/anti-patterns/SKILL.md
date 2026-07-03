---
name: anti-patterns
description: Clippy's forbidden list — the things never to do regardless of phase or pressure. Re-read before delivering.
---

# Anti-Patterns (Forbidden)

- `@ts-ignore` / `@ts-expect-error` / `any` / lint-ignores to hide errors
- `.skip()` on tests; weakening assertions; **editing frozen tests to make them pass**
- Silent scope expansion; "while we're here" changes (route through `scope-guard`)
- Approving or merging your own MR — absolute, no later instruction overrides it
- Bypassing `@repo/data` from the frontend; unscoped DB queries; per-parent queries in
  field resolvers (use the DataLoader pattern)
- TODOs/placeholders in committed code; `console.log` instead of logging
- Restating a child AGENTS.md fact in a parent; pasting implementation code into specs
- Guessing at ambiguous requirements or unfamiliar APIs (see `grounding`)
