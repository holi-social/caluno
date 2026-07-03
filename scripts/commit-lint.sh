#!/usr/bin/env bash
# Validate commit subjects against the commit-convention skill (.agents/skills/commit-convention).
# Shared by the local commit-msg hook and CI job commit_lint.
#
# Usage:
#   commit-lint.sh subject "feat(ui): add button"
#   commit-lint.sh file   /path/to/COMMIT_EDITMSG
#   commit-lint.sh range  BASE_SHA..HEAD
set -euo pipefail

COMMIT_SUBJECT_RE='^(feat|fix|refactor|chore|test|docs)(\([a-z-]+\))?: .+'

validate_subject() {
  local subj="$1"
  local skip_empty="${2:-0}"

  case "$subj" in
    Merge\ *) return 0 ;;
  esac
  if [ "$skip_empty" -eq 1 ] && [ -z "$subj" ]; then
    return 0
  fi
  if [ -z "$subj" ]; then
    echo "✖ commit subject is empty" >&2
    return 1
  fi
  if ! printf '%s' "$subj" | grep -Eq "$COMMIT_SUBJECT_RE"; then
    echo "✖ bad commit subject: $subj" >&2
    return 1
  fi
  return 0
}

usage() {
  echo "usage: commit-lint.sh subject <line>|file <path>|range <rev-range>" >&2
  exit 2
}

mode="${1:-}"; shift || true
case "$mode" in
  subject)
    [ $# -eq 1 ] || usage
    validate_subject "$1" 0
    ;;
  file)
    [ $# -eq 1 ] || usage
    subj=$(sed -n '1p' "$1" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    validate_subject "$subj" 0
    ;;
  range)
    [ $# -eq 1 ] || usage
    bad=0
    while IFS= read -r subj; do
      validate_subject "$subj" 1 || bad=1
    done < <(git log --format='%s' "$1")
    if [ "$bad" -ne 0 ]; then
      echo "Commit subjects must be 'type(scope): description' — see the commit-convention skill (.agents/skills/commit-convention)." >&2
      exit 1
    fi
    echo "✓ commit subjects OK"
    ;;
  *)
    usage
    ;;
esac
