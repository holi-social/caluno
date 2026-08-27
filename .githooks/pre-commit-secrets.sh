#!/usr/bin/env bash
# Scan staged changes for secrets before commit (gitleaks). CI secret_detection_gate is the real wall.
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$ROOT"

CONFIG="$ROOT/.gitleaks.toml"
GITLEAKS_IMAGE="zricethezav/gitleaks:v8.24.2"

run_scan() {
  if command -v gitleaks >/dev/null 2>&1; then
    gitleaks protect --staged --source "$ROOT" --config "$CONFIG" --redact --report-path gitleaks-report.json
    return
  fi

  if command -v docker >/dev/null 2>&1; then
    docker run --rm \
      -v "$ROOT:/repo" \
      -w /repo \
      "$GITLEAKS_IMAGE" \
      protect --staged --source /repo --config /repo/.gitleaks.toml --redact --report-path gitleaks-report.json
    return
  fi

  echo "↷ Secret scan skipped (install gitleaks or docker). CI secret_detection_gate will catch leaks."
}

run_scan
