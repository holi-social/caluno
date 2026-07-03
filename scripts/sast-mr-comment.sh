#!/usr/bin/env bash
# Post or update a single MR comment summarizing Critical/High SAST findings.
# MR pipelines only. Requires SAST_ISSUES_TOKEN (project access token, api scope).
# CI_JOB_TOKEN cannot POST MR notes on GitLab — read-only on the Notes API.
# Usage: sast-mr-comment.sh [path-to-report]
set -euo pipefail

readonly MARKER='<!-- clippy-sast-gate-summary -->'
readonly TOKEN_HINT='Set masked CI variable SAST_ISSUES_TOKEN (project access token, Developer+, api scope). Settings → Access tokens → Add new token.'
REPORT="${1:-gl-sast-report.json}"

if [[ "${CI_PIPELINE_SOURCE:-}" != "merge_request_event" || -z "${CI_MERGE_REQUEST_IID:-}" ]]; then
  echo "↷ Not an MR pipeline; skipping SAST MR summary comment"
  exit 0
fi

if [[ ! -f "$REPORT" ]]; then
  echo "↷ No SAST report; skipping MR summary comment"
  exit 0
fi

if [[ -z "${CI_API_V4_URL:-}" || -z "${CI_PROJECT_ID:-}" ]]; then
  echo "↷ Not in GitLab CI; skipping MR summary comment"
  exit 0
fi

api() {
  curl -sS --request "$1" --header "PRIVATE-TOKEN: ${SAST_ISSUES_TOKEN}" "${@:2}"
}

build_body() {
  local count
  count=$(jq '[.vulnerabilities[]? | select(.severity == "Critical" or .severity == "High")] | length' "$REPORT")
  local pipeline_link="[pipeline #${CI_PIPELINE_ID}](${CI_PIPELINE_URL})"
  local work_items_link="[Work Items](${CI_PROJECT_URL}/-/work_items)"

  if [[ "$count" -eq 0 ]]; then
    cat <<EOF
${MARKER}

### ✅ SAST gate passed

No **Critical** or **High** findings in ${pipeline_link}.

_Medium findings are filed as separate GitLab issues by **SAST**; see ${work_items_link} for the full report._
EOF
    return
  fi

  {
    echo "${MARKER}"
    echo ""
    echo "### ⛔ SAST gate blocked — ${count} Critical/High finding(s)"
    echo ""
    echo "**This MR cannot merge** until these are fixed, dismissed as false positives (ruleset), or removed from the diff."
    echo ""
    echo "| Severity | Finding | Location | Rule |"
    echo "|----------|---------|----------|------|"
    jq -r '
      def semgrep_id:
        ([.identifiers[]? | select(.type == "semgrep_id") | .value][0] // "n/a");
      def esc: gsub("\\|"; "/");
      .vulnerabilities[]?
      | select(.severity == "Critical" or .severity == "High")
      | "| \(.severity) | \(.name | esc) | `\(.location.file):\(.location.start_line)` | `\(semgrep_id | esc)` |"
    ' "$REPORT"
    echo ""
    echo "Full report: ${work_items_link} · ${pipeline_link}"
  }
}

body=$(build_body)

echo "━━━ SAST MR summary ━━━"
echo "$body"
echo "━━━━━━━━━━━━━━━━━━━━━━"

if [[ -z "${SAST_ISSUES_TOKEN:-}" ]]; then
  echo ""
  echo "⚠ SAST_ISSUES_TOKEN is unset or empty — MR comment not posted."
  echo "  Ref: ${CI_COMMIT_REF_NAME:-unknown} protected=${CI_COMMIT_REF_PROTECTED:-unknown}"
  if [[ "${CI_COMMIT_REF_PROTECTED:-}" == "false" ]]; then
    echo "  → Branch is not protected; uncheck **Protected** on the CI variable (or protect this branch)."
  fi
  echo "  Other causes: environment scope mismatch, wrong variable name, masked-value validation failed."
  exit 0
fi

payload=$(jq -n --arg body "$body" '{body: $body}')

notes_url="${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}/notes?per_page=100"
note_id=$(api GET "$notes_url" | jq -r --arg m "$MARKER" '[.[] | select(.body | contains($m))][0].id // empty')

if [[ -n "$note_id" ]]; then
  response=$(api PUT \
    --header "Content-Type: application/json" \
    --data "$payload" \
    "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}/notes/${note_id}")
  action="Updated"
else
  response=$(api POST \
    --header "Content-Type: application/json" \
    --data "$payload" \
    "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}/notes")
  action="Posted"
fi

if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
  echo "✓ ${action} SAST summary on MR !${CI_MERGE_REQUEST_IID}"
else
  echo "✖ Failed to post MR SAST summary:"
  echo "$response" | jq -r '.message // .error // .' 2>/dev/null || echo "$response"
  echo "${TOKEN_HINT}"
  exit 0
fi
