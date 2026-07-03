---
name: commit-convention
description: Clippy's commit format — one commit per subtask, type(scope) subjects, Decision:/Spec: trailers, and the PR description as the durable record. Use at DELIVERING.
---

# Commit Convention

One commit per subtask. Subject: `type(scope): description` — CI's `commit_lint` job
enforces it. Body: bullets, then trailers.

- **Types**: feat, fix, refactor, chore, test, docs.
- **Scopes**: shifts, membership, auth, requirement-profile, organization, time-tracking,
  notification, data, ui.
- **Trailers**: one `Decision:` per decision **with its consequence**, plus `Spec: <slug>`.

```
feat(shifts): add recurring shift expansion

- expand rrule into instances on write
- cap horizon at 12 months

Decision: expansion at write time, not read time — read path stays index-only
Spec: voli-549-backend-queries
```

Trailers are machine-greppable: `git log --format='%(trailers:key=Decision,valueonly)'`.

**The PR description is the durable copy**: acceptance criteria + out-of-scope list +
decisions go into it at delivery (GitLab squash-merge can drop commit bodies — the PR
description must carry the decisions too).
