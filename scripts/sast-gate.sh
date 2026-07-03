#!/usr/bin/env bash
# Fail the job when gl-sast-report.json contains Critical or High findings.
# Usage: sast-gate.sh [path-to-report]
set -euo pipefail

REPORT="${1:-gl-sast-report.json}"

if [[ ! -f "$REPORT" ]]; then
  echo "↷ No SAST report at ${REPORT}; semgrep-sast did not run — skipping gate"
  exit 0
fi

count=$(jq '[.vulnerabilities[]? | select(.severity == "Critical" or .severity == "High")] | length' "$REPORT")

if [[ "$count" -gt 0 ]]; then
  echo "✖ Found ${count} Critical/High SAST finding(s):"
  jq -r '.vulnerabilities[]? | select(.severity == "Critical" or .severity == "High") | "  - [\(.severity)] \(.name) (\(.location.file):\(.location.start_line))"' "$REPORT"
  exit 1
fi

echo "✔ No Critical/High SAST findings"
