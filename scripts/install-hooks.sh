#!/usr/bin/env bash
# Point this repo's git hooks at .githooks/ (pre-commit format, commit-msg lint). Idempotent.
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
chmod +x \
  .githooks/pre-commit \
  .githooks/commit-msg \
  scripts/pre-commit-format.sh \
  scripts/commit-lint.sh
git config core.hooksPath .githooks
echo "Git hooks installed (core.hooksPath=.githooks)"
