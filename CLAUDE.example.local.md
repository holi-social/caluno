<!-- AI pipeline opt-in template.
     To activate for your sessions: copy the section below into your CLAUDE.local.md
     AND set AI_PIPELINE_ENABLED=1 in .env.
 -->

## AI pipeline (mandatory for agent sessions)
The development pipeline lives in `.ai/`. **Humans start at [`.ai/README.md`](.ai/README.md)** (operator's guide: flow, commands, how to drive it). Agents read `.ai/PIPELINE.md` at the start of every session — it defines the phases (plan/write/read-only), the `>>` commands, the gates, and the verification agents. Bootstrap a session with `.ai/scripts/bootstrap.sh` (phase, current task, skills index).

**Any request that creates or changes files outside `.ai/` is pipeline work — including a casual, plainly-worded one-off ("create this file", "just add X") with no `>>` command.** A bare request is not approval to enter `write`: check the phase first, and get explicit write-phase approval before editing. Never self-promote to `write` because the user asked for output.

- **Code context**: this file plus the nested `AGENTS.md` in the package you're editing (`apps/frontend`, `apps/backend`, `packages/data`, `packages/ui`) — loaded by proximity. One fact lives in exactly one AGENTS.md, the deepest that contains it; parents never restate children.
- **Domain language**: `.ai/GLOSSARY.md` — grep it for ticket nouns. Precedence: GLOSSARY wins on domain meaning, AGENTS.md wins on architecture, code wins on facts.
- **Enforcement**: CI on a protected `main` (required checks + human MR approval) is the only wall — see `.ai/HUMAN_GUIDE.md`. The sole local guard is an optional write-phase hook (`.claude/settings.json` for Claude Code, `.ai/adapters/kimi.config.toml` for Kimi); nothing to install locally.
- **Decisions**: every decision gets a `Decision:` commit trailer; architectural invariants also update the owning `AGENTS.md`, domain meanings also update `.ai/GLOSSARY.md`.
