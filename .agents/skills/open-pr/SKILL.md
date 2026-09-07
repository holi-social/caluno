---
name: open-pr
description: >-
  Opens a GitHub pull request with a short Jira-keyed title and tight body, then
  moves the ticket to In Review. Use when creating a PR, wrapping up a PR,
  running >>deliver, or using gh pr create / gh pr edit.
metadata:
  type: workflow
---

# Open a PR

No ticket, no PR — ask, then wait.

## 1. Resolve the key

Stop at the first real key (`VOLI-1093`, `VOL-1237`, or `[A-Z][A-Z0-9]+-\d+`):

1. The user's message
2. The active spec (`**Ticket:**`)
3. `.ai/TASKS.md`
4. The current branch name
5. Recent commit messages on the branch

Do not invent a key.

## 2. Title

`{KEY}: {what someone can now do}` — key first, colon, space, lowercase after the colon. User-facing. One line.

```
VOLI-1093: let coordinators set when a recurring series ends
```

Same shape when editing an existing PR title.

## 3. Body

Reviewer skim, not a walkthrough.

```markdown
## Summary
<1–3 bullets: outcome, not files or per-surface behavior>

**Ticket:** [VOLI-1254](https://holi.atlassian.net/browse/VOLI-1254)

**Decision:** <only standing choices a reviewer must know; omit if none>

## Test plan
- [ ] <3–5 reviewer checks; the happy path plus the failures that matter>
```

**Done when** the body is shorter than a spec: no per-screen essays, no implementation tour, no CI pass counts.

Example for overnight shifts:

```markdown
## Summary
- Planners can save a shift whose end clock is earlier than start (20:00–01:00).
- The instance lives on the start day; duration is elapsed minutes (1–1439).

**Ticket:** [VOLI-1254](https://holi.atlassian.net/browse/VOLI-1254)

**Decision:** start day owns the shift; end-before-start rolls to the next calendar day.

## Test plan
- [ ] Create 20:00–01:00 — saves, shows once on the start day as 20:00 - 01:00
- [ ] Equal clocks and ≥24h stay blocked
- [ ] Recurring Friday 20:00–01:00 expands overnight
```

## 4. Clean against `main`

```bash
git fetch origin main
git merge-tree --write-tree origin/main HEAD
```

**Done when** that exits 0.

If it doesn't: `git rebase origin/main` and resolve. Additive hunks (imports, lockfile regenerate, both sides keep) — fix them. **Severe** (same hunk, two intents, you would have to invent the merge) — ask, then wait. Feature branch only; `git push --force-with-lease` after a rebase of an already-pushed branch, never `main`.

## 5. Open with `gh`

Follow the creating-pull-requests user rule (status, diff, log, push `-u` if needed). Then:

```bash
gh pr create --title "VOLI-1093: let coordinators set when a recurring series ends" --body "$(cat <<'EOF'
…body…
EOF
)"
```

**Done when** `gh pr view --json url,title` shows the key-first title and the URL is in chat.

## 6. Checks

```bash
gh pr checks --watch --fail-fast
```

**Done when** every check is `pass`.

If a check fails: read the log, fix the defect, push, watch again. Cap 3 fix cycles. Infra (runner, DB down) is not a cycle — report it. A 4th fail → STOP; do not move Jira.

## 7. Jira → In Review

Atlassian MCP. `cloudId`: `holi.atlassian.net`.

1. `getJiraIssue` — if status is already `In Review`, stop.
2. `getTransitionsForJiraIssue` — pick the transition whose **name** is `In Review` (not `PO Review`).
3. `transitionJiraIssue` with that transition `id`.

**Done when** the issue status is `In Review`. If the transition is missing or the MCP call fails, STOP and report; the PR still stands.

## 8. Slack paste

Always end the wrap-up in chat with this line (do not post it; the human pastes):

```
:git-merged: PR | VOLI-1093: let coordinators set when a recurring series ends https://github.com/holi-social/caluno/pull/93
```

Shape: `:git-merged: PR | {title} {url}` — title is the key-first PR title, then the PR URL. **Done when** that line is in the reply.
