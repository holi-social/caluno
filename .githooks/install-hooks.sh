#!/usr/bin/env bash
# Point this repo's git hooks at .githooks/ (pre-commit secrets+format). Idempotent.
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
chmod +x \
  .githooks/pre-commit \
  .githooks/pre-commit-format.sh \
  .githooks/pre-commit-secrets.sh
git config core.hooksPath .githooks
echo "Git hooks installed (core.hooksPath=.githooks)"
