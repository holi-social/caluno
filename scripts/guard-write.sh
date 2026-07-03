#!/usr/bin/env bash
# Host PreToolUse hook target for file writes. Exit 2 = block (Claude Code & Kimi convention).
# Philosophy: **if you use varco, its phases bind you; if you just opened an agent, you're
# free.** Real enforcement is CI on protected main (docs/HUMAN_GUIDE.md) — this is session
# discipline for varco-driven work only:
#   - varco-owned files (.varco/state/*, .varco/config.json, *.key, *.pub) are NEVER
#     raw-writable — state changes only through the varco CLI. (Applies always: this is
#     the one rule casual sessions carry too.)
#   - other .varco/* writes (specs, manifests, plugins) are housekeeping: allowed.
#   - NO active varco task -> everything else is allowed. Casual sessions are unconstrained.
#   - ACTIVE task -> its phase binds: source writes only in `write` (IMPLEMENTING).
#   - ACTIVE task on a design loop (manifest starts with "design") -> write phase is
#     limited to the design blast radius: design/**, the frontend app, @repo/ui source,
#     and the message catalogs. Backend/data/config stay dev-loop territory.
# Reads the host's JSON tool payload on stdin. Requires jq; without a resolvable path it
# falls back to phase-only for active tasks.
ROOT=$(git rev-parse --show-toplevel 2>/dev/null) && cd "$ROOT"

INPUT=$(cat 2>/dev/null || true)
TARGET=""
if command -v jq >/dev/null 2>&1; then
  TARGET=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null || true)
fi

# varco-owned files: never raw-writable (the agent must not grant itself signals,
# rewrite the config, or touch key material).
case "$TARGET" in
  .varco/state/*|*/.varco/state/*|.varco/config.json|*/.varco/config.json|*.key|*.pub)
    echo "BLOCKED: '$TARGET' is varco-owned. State changes only through the varco CLI; config/keys are the human's." >&2
    exit 2 ;;
esac

# Pipeline housekeeping (specs, manifests, plugins, README) is always allowed.
case "$TARGET" in
  .varco/*|*/.varco/*) exit 0 ;;
esac

# No active varco task (or no jq) -> unconstrained. Use varco for real product work;
# quick experiments and answers don't need a ceremony.
[[ -f .varco/state/state.json ]] || exit 0
command -v jq >/dev/null 2>&1 || exit 0
STATE=$(jq -r '.state // "unknown"' .varco/state/state.json 2>/dev/null || echo unknown)
case "$STATE" in DELIVERED|ESCALATED|unknown) exit 0 ;; esac   # terminal task = no task

PHASE=$(jq -r '.phase // "unknown"' .varco/state/state.json 2>/dev/null || echo unknown)
MANIFEST=$(jq -r '.manifest // ""' .varco/state/state.json 2>/dev/null || echo "")

if [[ "$PHASE" == "write" ]]; then
  # Design loops write inside the design blast radius only — everything frontend + design/,
  # never backend, data layer, or package config/deps (those are named in the brief).
  if [[ "$MANIFEST" == design* ]]; then
    case "$TARGET" in
      design/*|*/design/*) exit 0 ;;
      packages/ui/src/*|*/packages/ui/src/*) exit 0 ;;
      apps/frontend/src/*|*/apps/frontend/src/*) exit 0 ;;
      apps/frontend/messages/*.json|*/apps/frontend/messages/*.json) exit 0 ;;
      "") exit 0 ;;   # unresolved path: phase is write, let it through
    esac
    echo "BLOCKED: design loops write only design/**, apps/frontend/src, packages/ui/src, and the message catalogs. '$TARGET' is dev-loop territory — name it in the brief as a dev subtask." >&2
    exit 2
  fi
  exit 0
fi

# Active non-design-context writes: design/ notes are fine in any phase (context files,
# sidecars); source is not.
case "$TARGET" in design/*|*/design/*) exit 0 ;; esac

echo "BLOCKED: varco task '$MANIFEST' is in phase '$PHASE'. Source writes need the write phase (IMPLEMENTING) — advance the loop (varco apply) or tell the human what it awaits. (No task active = no constraints; finish or escalate this one.)" >&2
exit 2
