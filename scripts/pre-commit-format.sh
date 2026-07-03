#!/usr/bin/env bash
# Format and lint-fix staged files with Biome before commit.
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$ROOT"

mapfile -t staged < <(git diff --cached --name-only --diff-filter=ACMR || true)
if ((${#staged[@]} == 0)); then
  exit 0
fi

set +e
output=$(bun run format-and-lint:staged 2>&1)
code=$?
set -e

if ((code != 0)); then
  if echo "$output" | grep -q 'No files were processed'; then
    exit 0
  fi
  echo "$output" >&2
  exit "$code"
fi

for file in "${staged[@]}"; do
  if [[ -e "$file" ]]; then
    git add -- "$file"
  fi
done

if [[ -n "$output" ]]; then
  echo "$output"
fi
