#!/usr/bin/env bash
# Format and lint-fix staged files with Biome before commit.
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$ROOT"

staged=()
while IFS= read -r file; do
  staged+=("$file")
done < <(git diff --cached --name-only --diff-filter=ACMR || true)
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
    # -f: these files were already deliberately staged before this hook ran
    # (e.g. a merge bringing in a committed-but-gitignored file like a
    # generated codegen output); re-adding them post-format must not be
    # blocked by an ignore-pattern match.
    git add -f -- "$file"
  fi
done

if [[ -n "$output" ]]; then
  echo "$output"
fi
