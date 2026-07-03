---
name: security-rubric
description: Clippy's security-review rubric — multi-tenancy/org-scoping first, one-hop input scoping, GraphQL-specific checks. For the REVIEWING step (session verifier or review.skills on a dispatched reviewer).
---

# Security Review Rubric (this repo)

Trigger: new resolvers/mutations/endpoints, auth changes, org scoping, input handling,
data access.

**Rubric of record: the Multi-Tenancy CRITICAL rules in `apps/backend/AGENTS.md`** — read
them there (one fact, one file; this skill does not restate them).

**Input scoping (keeps the reviewer's context minimal):** the diff PLUS the full source of
every service/repository method the diff calls **directly (one hop)**; deeper calls are
listed by name and pulled only on demand — never drag in half the backend.

Checks, in priority order:

- auth bypass; cross-org access; **org scoping along the full call path** — unscoped
  queries hide in *existing* code that *new* code calls
- input validation
- GraphQL: depth limits, field-level auth, N+1 (the DataLoader pattern is required —
  per-parent queries in field resolvers are forbidden)
- secrets in code or logs
- OWASP top-10 sweep

Report findings with severity and an exploitability-honest confidence; the loop's policy
(not the reviewer) decides what blocks. A security re-review after fixes that touch
auth/resolvers/data happens **inside the current review-cycle** — it does not start a new
one.
