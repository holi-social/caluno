#!/usr/bin/env bash
# Tests for the local session guard (varco-first write-block) + the CI script helpers.
# There are no git hooks in this pipeline — real enforcement is CI. The guard is
# session phase-discipline only. Run: scripts/__tests__/gates.test.sh
set -uo pipefail
PASS=0; FAIL=0
assert() { # assert <desc> <expected_code> <actual_code>
  if [[ "$2" == "$3" ]]; then PASS=$((PASS+1)); echo "ok    - $1";
  else FAIL=$((FAIL+1)); echo "FAIL  - $1 (expected $2, got $3)"; fi
}
ROOT=$(cd "$(dirname "$0")/.." && pwd)   # -> the scripts/ directory
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
cd "$TMP" && git init -q . && git config user.email t@t && git config user.name t
# Mirror the real layout: guards live under scripts/, varco state under .varco/state/
mkdir -p scripts .varco/state design
cp "$ROOT/guard-write.sh" "$ROOT/commit-lint.sh" "$ROOT/sast-gate.sh" scripts/
chmod +x scripts/*.sh
echo init > f.txt
printf '.varco/state/\n' > .gitignore && git add -A
git commit -q -m init

varco_state() { # varco_state <STATE> <phase> [manifest] — writes a minimal live state file
  printf '{"task":"t","state":"%s","phase":"%s","manifest":"%s"}' "$1" "$2" "${3:-feature-loop}" > .varco/state/state.json
}
guard() { echo "{\"tool_input\":{\"file_path\":\"$1\"}}" | scripts/guard-write.sh >/dev/null 2>&1; }

# 1. active task in write phase (IMPLEMENTING) -> source write allowed
varco_state IMPLEMENTING write
guard "src/x.ts"; assert "write phase allows src write" 0 $?
# 2. plan phase blocks source writes
varco_state PLANNING plan
guard "src/x.ts"; assert "plan phase blocks src write" 2 $?
# 3. read-only phase (REVIEWING) blocks source writes
varco_state REVIEWING read-only
guard "src/x.ts"; assert "read-only phase blocks src write" 2 $?
# 4. varco housekeeping (specs/manifests) allowed in any phase
guard ".varco/specs/foo.json"; assert "spec write allowed in read-only" 0 $?
varco_state PLANNING plan
guard ".varco/manifests/my-loop.json"; assert "manifest write allowed in plan" 0 $?
# 5. varco-owned files are NEVER raw-writable, even in write phase
varco_state IMPLEMENTING write
guard ".varco/state/state.json"; assert "blocks raw write to state.json" 2 $?
guard ".varco/config.json"; assert "blocks raw write to config.json" 2 $?
guard "/abs/repo/.varco/state/state.json"; assert "blocks state.json via absolute path" 2 $?
guard ".varco/approver.key"; assert "blocks key material" 2 $?
guard ".varco/approver.pub"; assert "blocks pubkey" 2 $?
# 6. a TERMINAL task counts as no task -> unconstrained again
varco_state DELIVERED plan
guard "src/x.ts"; assert "delivered task -> casual freedom is back" 0 $?
# 7. no varco task -> casual sessions are UNCONSTRAINED (except varco-owned files)
rm -f .varco/state/state.json
guard "src/x.ts"; assert "no active task -> source write allowed (casual session)" 0 $?
guard ".varco/config.json"; assert "no task: varco config still protected" 2 $?
# 8. a DESIGN loop in write phase: design blast radius only
varco_state IMPLEMENTING write design-loop
guard "design/foo-context.md"; assert "design loop writes design/" 0 $?
guard "packages/ui/src/components/base/foo.tsx"; assert "design loop writes packages/ui/src" 0 $?
guard "apps/frontend/src/app/page.tsx"; assert "design loop writes frontend app src" 0 $?
guard "/abs/repo/apps/frontend/src/app/page.tsx"; assert "design loop: absolute path resolves" 0 $?
guard "apps/frontend/messages/de.json"; assert "design loop writes message catalogs" 0 $?
guard "packages/ui/package.json"; assert "design loop blocks packages/ui config/deps" 2 $?
guard "apps/frontend/package.json"; assert "design loop blocks frontend config/deps" 2 $?
guard "apps/backend/src/x.ts"; assert "design loop blocks backend" 2 $?
guard "packages/data/src/x.ts"; assert "design loop blocks data layer" 2 $?
guard ".varco/config.json"; assert "design loop still can't touch varco config" 2 $?
# 9. a DEV loop in write phase has no such fence; design/ notes are writable in ANY phase
varco_state IMPLEMENTING write feature-loop
guard "apps/backend/src/x.ts"; assert "dev loop in write phase writes backend" 0 $?
varco_state REVIEWING read-only design-loop
guard "design/foo-context.md"; assert "design notes writable in read-only phase" 0 $?
guard "packages/ui/src/foo.tsx"; assert "design loop read-only phase blocks source" 2 $?

# 10. commit-lint accepts valid subjects
scripts/commit-lint.sh subject "feat(ui): add button" >/dev/null 2>&1; assert "commit-lint accepts valid subject" 0 $?
scripts/commit-lint.sh subject "fix: patch leak" >/dev/null 2>&1; assert "commit-lint accepts subject without scope" 0 $?
# 11. commit-lint rejects invalid subjects
scripts/commit-lint.sh subject "bad subject" >/dev/null 2>&1; assert "commit-lint rejects invalid subject" 1 $?
scripts/commit-lint.sh subject "feat(UI): bad scope case" >/dev/null 2>&1; assert "commit-lint rejects uppercase scope" 1 $?
# 12. commit-lint skips merge commits in range mode
git commit -q --allow-empty -m "Merge branch 'x' into main"; scripts/commit-lint.sh range HEAD~1..HEAD >/dev/null 2>&1; assert "commit-lint skips merge commits in range" 0 $?

# 13. sast-gate passes when no Critical/High findings
cat > gl-sast-report.json <<'EOF'
{"vulnerabilities":[{"severity":"Medium","name":"test","location":{"file":"a.ts","start_line":1}}]}
EOF
scripts/sast-gate.sh gl-sast-report.json >/dev/null 2>&1; assert "sast-gate passes on Medium-only report" 0 $?
# 14. sast-gate fails on High
cat > gl-sast-report.json <<'EOF'
{"vulnerabilities":[{"severity":"High","name":"bad","location":{"file":"a.ts","start_line":1}}]}
EOF
scripts/sast-gate.sh gl-sast-report.json >/dev/null 2>&1; assert "sast-gate fails on High finding" 1 $?
# 15. sast-gate skips when report missing
rm -f gl-sast-report.json
scripts/sast-gate.sh gl-sast-report.json >/dev/null 2>&1; assert "sast-gate skips when report missing" 0 $?

echo "---"; echo "passed: $PASS  failed: $FAIL"; [[ $FAIL -eq 0 ]]
