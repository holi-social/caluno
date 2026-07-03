---
name: decision-routing
description: Where every decision is recorded — trailer, AGENTS.md, or GLOSSARY — by lifespan, in the same commit. The delivery-time check is a blocker. Use at IMPLEMENTING and DELIVERING.
---

# Decision Routing

Every decision gets a `Decision:` trailer (see `commit-convention`). Beyond that, route by
**lifespan** — a decision that changes a standing invariant must update the file that owns
that invariant, **in the same commit**, or it rots:

| Kind of decision | Lives in | Example |
|------------------|----------|---------|
| Process / one-off (why this approach for this task) | `Decision:` trailer + the task log (transient working memory) | "expansion at write time, not read time" |
| Architectural invariant (a rule future code must respect) | trailer **and** the owning `AGENTS.md` "Known constraints" / "Patterns" section | "FormSubmissionService ↔ MembershipService use `forwardRef` on both sides — keep it" |
| Domain meaning (what a term denotes) | trailer **and** `docs/GLOSSARY.md` | "a Form Submission has only SUBMITTED/REJECTED" |

Precedence on conflict: **GLOSSARY wins on domain meaning, AGENTS.md wins on architecture,
code wins on facts.**

**At delivery, check**: did any decision in this change alter an invariant or a term? If
yes and the owning file wasn't updated, that is a **delivery blocker** — fix before
stopping at the gate. (One-fact-one-file: parents never restate children; never restate a
child AGENTS.md fact in a parent.)
