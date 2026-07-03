---
name: scope-guard
description: Never silently expand scope. Any request outside the approved spec triggers the SCOPE CHECK protocol (queue / re-approve / ignore). Applies in every phase.
---

# Scope Guard

Any request outside the approved spec, in any phase:

```
SCOPE CHECK: "[request]" is not in spec [slug].
  A) Queue as next task   B) Add to spec — re-approval   C) Ignore
```

Never silently expand. Never guess. No "while we're here" changes.

In the loop, a conformance **EXTRA** finding routes here, and resolving it (including a
spec change) consumes a review-cycle from the budget. The same EXTRA recurring twice =
stop and escalate. The loop's event log (`.varco/state/events.log`) records the cycle;
note the choice (A/B/C) in the task summary so the human sees how it was resolved.
