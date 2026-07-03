---
name: grounding
description: Anti-hallucination rule — verify any library API not already used in this codebase before calling it, and confirm every externally-defined identifier a diff introduces. Applies during IMPLEMENTING and REVIEWING.
---

# Grounding Rule (anti-hallucination)

Before calling any library API not already used in this codebase: **verify it exists in
the installed version.** Preference order:

1. grep existing usage in the repo,
2. read the `.d.ts` in `node_modules/<pkg>`,
3. installed docs/changelog.

Never write an unfamiliar signature from memory.

At review time: list every **externally-defined identifier** the diff introduces — config
keys, env vars, raw SQL columns, endpoint paths, event names — and confirm each against
ground truth. String-shaped APIs type-check regardless of existence; the type checker
cannot save you here.

Never guess an ambiguous requirement or an unverified API: STOP, or ground it.
