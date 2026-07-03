#!/usr/bin/env bash
# Create GitLab issues for Medium SAST findings (grouped by file + rule, deduped by group label).
# Requires SAST_ISSUES_TOKEN (project access token, api scope).
# Usage: sast-open-medium-issues.sh [path-to-report]
set -euo pipefail

readonly TOKEN_HINT='Set masked CI variable SAST_ISSUES_TOKEN (project access token, Developer+, api scope).'
REPORT="${1:-gl-sast-report.json}"

if [[ ! -f "$REPORT" ]]; then
  echo "↷ No SAST report; skipping Medium issue creation"
  exit 0
fi

if [[ -z "${CI_API_V4_URL:-}" || -z "${CI_PROJECT_ID:-}" ]]; then
  echo "↷ Not in GitLab CI; skipping Medium issue creation"
  exit 0
fi

if [[ -z "${SAST_ISSUES_TOKEN:-}" ]]; then
  echo "⚠ SAST_ISSUES_TOKEN is unset or empty in this job."
  echo "  Ref: ${CI_COMMIT_REF_NAME:-unknown} protected=${CI_COMMIT_REF_PROTECTED:-unknown}"
  if [[ "${CI_COMMIT_REF_PROTECTED:-}" == "false" ]]; then
    echo "  → Branch is not protected; uncheck **Protected** on the CI variable (or protect this branch)."
  fi
  echo "  Other causes: environment scope mismatch, wrong variable name, masked-value validation failed."
  echo "  Did you only create Settings → Access tokens? You must also add Settings → CI/CD → Variables"
  echo "  with Key=SAST_ISSUES_TOKEN and Value=<paste the token secret> (Protected off for feature branches)."
  exit 0
fi

api() {
  curl -sS --request "$1" --header "PRIVATE-TOKEN: ${SAST_ISSUES_TOKEN}" "${@:2}"
}

group_label_for() {
  printf '%s|%s' "$1" "$2" | sha256sum | awk '{print "sast-group-" substr($1, 1, 16)}'
}

medium_count=$(jq '[.vulnerabilities[]? | select(.severity == "Medium")] | length' "$REPORT")
if [[ "$medium_count" -eq 0 ]]; then
  echo "✔ No Medium SAST findings"
  exit 0
fi

created=0
skipped=0

while IFS= read -r group; do
  file=$(echo "$group" | jq -r '.[0].file')
  rule=$(echo "$group" | jq -r '.[0].rule')
  name=$(echo "$group" | jq -r '.[0].name')
  count=$(echo "$group" | jq 'length')
  short_file=$(basename "$file")
  group_label=$(group_label_for "$file" "$rule")

  existing=$(api GET \
    "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/issues?state=opened&labels=${group_label}&per_page=1" \
    | jq 'length')

  if [[ "$existing" -gt 0 ]]; then
    echo "↷ Issue already open for ${file} + ${rule} (${group_label})"
    skipped=$((skipped + 1))
    continue
  fi

  if [[ "$count" -eq 1 ]]; then
    line=$(echo "$group" | jq -r '.[0].line')
    title="${name} — ${short_file}:${line}"
  else
    title="${name} — ${short_file} (${count} locations)"
  fi

  payload=$(jq -n \
    --arg title "$title" \
    --arg file "$file" \
    --arg rule "$rule" \
    --arg name "$name" \
    --arg pipeline "${CI_PIPELINE_URL:-unknown}" \
    --arg commit "${CI_COMMIT_SHA:-unknown}" \
    --arg group_label "$group_label" \
    --argjson findings "$group" \
    'def locations_table:
      "| Line | Fingerprint |\n|------|-------------|\n"
      + ($findings | sort_by(.line) | map("| `\(.line)` | `\(.id[0:16])` |") | join("\n"));
    {
      title: $title,
      description: (
        "## SAST Medium — " + $name + "\n\n"
        + "**File:** `" + $file + "`\n"
        + "**Rule:** `" + $rule + "`\n"
        + "**Occurrences:** " + ($findings | length | tostring) + "\n"
        + "**Pipeline:** " + $pipeline + "\n"
        + "**Commit:** `" + $commit + "`\n\n"
        + locations_table + "\n\n"
        + "### Description\n\n"
        + $findings[0].description + "\n\n"
        + "---\n_Auto-created by **SAST** (`sast_medium_issues`). Group label: `" + $group_label + "`._"
      ),
      labels: ("security::sast,sast-medium," + $group_label)
    }')

  response=$(api POST \
    --header "Content-Type: application/json" \
    --data "$payload" \
    "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/issues")

  if echo "$response" | jq -e '.iid' >/dev/null 2>&1; then
    iid=$(echo "$response" | jq -r '.iid')
    echo "✓ Created issue #${iid}: ${title}"
    created=$((created + 1))
  else
    echo "✖ Failed to create issue for ${file} + ${rule}:"
    echo "$response" | jq -r '.message // .error // .' 2>/dev/null || echo "$response"
    echo "${TOKEN_HINT}"
    exit 0
  fi
done < <(jq -c '
  [.vulnerabilities[]? | select(.severity == "Medium") | {
    id,
    name,
    file: .location.file,
    line: .location.start_line,
    description,
    rule: ([.identifiers[]? | select(.type == "semgrep_id") | .value][0] // .cve // .name)
  }]
  | group_by(.file + "|" + .rule)
  | .[]
' "$REPORT")

echo "Medium issues: created=${created} skipped=${skipped} (grouped from ${medium_count} finding(s))"
