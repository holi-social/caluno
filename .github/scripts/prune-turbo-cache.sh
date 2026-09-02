#!/usr/bin/env bash
# Keep .turbo/cache under a size budget before it is uploaded as an Actions cache.
# Turborepo never garbage-collects it, and restore-then-save grows it every run
# until it crowds out the Bun cache in the repo's 10 GB quota. Entries are
# content-addressed by task hash, so dropping the oldest only costs a recompute.
set -euo pipefail

CACHE_DIR="${TURBO_CACHE_DIR:-.turbo/cache}"
BUDGET_MB="${TURBO_CACHE_BUDGET_MB:-512}"

if [ ! -d "$CACHE_DIR" ]; then
  echo "No Turborepo cache at $CACHE_DIR; nothing to prune."
  exit 0
fi

used_mb() { du -sm "$CACHE_DIR" | cut -f1; }

before="$(used_mb)"
removed=0

while [ "$(used_mb)" -gt "$BUDGET_MB" ]; do
  oldest="$(find "$CACHE_DIR" -maxdepth 1 -name '*.tar.zst' -printf '%T@ %p\n' \
    | sort -n | head -1 | cut -d' ' -f2-)"
  [ -n "$oldest" ] || break

  hash="$(basename "$oldest" .tar.zst)"
  rm -f "$CACHE_DIR/$hash.tar.zst" \
        "$CACHE_DIR/$hash-meta.json" \
        "$CACHE_DIR/$hash-manifest.json"
  removed=$((removed + 1))
done

echo "Turborepo cache: ${before} MB -> $(used_mb) MB (budget ${BUDGET_MB} MB, ${removed} entries dropped)"
