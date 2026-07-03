# Host adapters — per-tool setup

This is the one place that explains how to set up each AI coding tool (Claude Code, Kimi, Cursor, Zed) for this project. The two guides ([`../../.varco/README.md`](../../.varco/README.md), [`../../docs/HUMAN_GUIDE.md`](../../docs/HUMAN_GUIDE.md)) point here.

## Read this first: you can skip all of it

The only thing on this page is one **optional** convenience — a "write-phase guard." Skipping it costs you nothing important: the real protection is CI on a protected `main`, which no local setup can replace or weaken (see [`../../docs/HUMAN_GUIDE.md`](../../docs/HUMAN_GUIDE.md)). **If you only review Merge Requests, you need nothing here at all.** Set the guard up only if you also *run* an agent and want the extra safety net.

## Four words this page uses

- **Phase** — the active varco task's mode, read from `.varco/state/state.json`: `plan` (proposing, no edits), `write` (editing allowed — the IMPLEMENTING state), `read-only` (verifying). **No active task = no constraints** — the guard only binds varco-driven work (plus: varco state/config/keys are never raw-writable). Design loops additionally stay inside the frontend + `design/` blast radius.
- **Guard** — `scripts/guard-write.sh`, a small script that runs *before* each file the agent tries to write and blocks the write unless the phase is `write` (housekeeping under `.varco/` is always allowed; `.varco/state`, `.varco/config.json` and key material are never raw-writable). It's a pre-flight check, not a wall — a determined shell can bypass it.
- **Hook** — a command your AI tool runs automatically at a set moment. We use the "before a tool runs" moment (`PreToolUse`) to run the guard. Setting up the guard = registering it as a hook.
- **Adapter** — the little config snippet in this folder that registers that hook for one specific tool. "Merge the adapter" just means: copy its lines into your tool's own config file.

The guard reads the tool's JSON payload on stdin, so it needs `jq` installed. `AI_HOST` is set in each adapter's command so metrics can tell hosts apart. Prerequisites overall: `git`, `bun`, `jq`.

## Per-tool setup

| Tool | What to do | Status |
|------|------------|--------|
| **Claude Code** | Nothing — it reads the committed `.claude/settings.json` automatically. | Done for you |
| **Kimi Code** | Merge the `[[hooks]]` block from [`kimi.config.toml`](./kimi.config.toml) into your Kimi config. See **Kimi steps** below. | Works; fail-open |
| **Cursor** | Nothing — it reads the committed `.cursor/hooks.json` automatically (same model as Claude Code). See **Cursor** below. | Committed; pending one smoke test |
| **Zed / others** | No known hook mechanism. Just run without the guard — it degrades fine. | Not wired |

### Kimi steps

Kimi's global config is `~/.kimi-code/config.toml` (or `$KIMI_CODE_HOME/config.toml` if you set that variable) — a TOML file. Open it and paste in the `[[hooks]]` block from [`kimi.config.toml`](./kimi.config.toml). That registers the guard as a `PreToolUse` hook.

Two things to know:
- The hook's `matcher` matches Kimi's tool names. The file-writing tools are **`Write`** and **`Edit`** (per the [Built-in Tools reference](https://www.kimi.com/code/docs/en/kimi-code-cli/reference/tools.html)), so the snippet uses `matcher = "Write|Edit"`. If a future Kimi version renames them, update this.
- A `[[hooks]]` block accepts **only** `event`, `matcher`, `command`, `timeout` — any extra field makes the whole config fail to load.

Kimi's hooks behave as: `PreToolUse` can block, exit code 2 blocks (your message goes to stderr), any other failure is *allowed through* (fail-open) — so a broken guard never locks you out. Reference: [Kimi config files](https://www.kimi.com/code/docs/en/kimi-code-cli/configuration/config-files.html), [Kimi hooks](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/hooks.html).

### Cursor

Cursor needs **two** committed files, because it loads instructions differently from Claude/Kimi (no `CLAUDE.md`/`AGENTS.md` auto-read you can rely on):
- `.cursor/rules/pipeline.mdc` (`alwaysApply: true`) — teaches the agent the pipeline: read `AGENTS.md` (which carries the varco driving rules) and run `varco status` at session start. Without it, "Cursor doesn't know about the pipeline." This is the context layer.
- `.cursor/hooks.json` — the write-guard. This is the enforcement layer (below).

Both are committed, so a Cursor user does nothing. The hook is wired the same way as Claude Code: the committed `.cursor/hooks.json` registers `guard-write.sh` as a `preToolUse` hook. Cursor's `preToolUse` fires before any tool and blocks on exit code 2 (≡ `permission: "deny"`) — the convention the guard already uses. Reference: [Cursor hooks](https://cursor.com/docs/hooks).

The `matcher` must list **only** Cursor's file-writing tools — `Write|StrReplace|Delete` (the in-chat write tool and the inline-edit/Tab tool). This is deliberately narrow: the guard blocks any matched tool call lacking a `write`-phase, so matching read/search tools would brick the `plan`/`read-only` phases. **One thing still unverified** (no Cursor in CI): that the relative command path resolves and the guard actually fires on a real edit. Confirm once by, in a non-`write` phase, asking Cursor to edit a source file and checking the write is blocked; then this is "done for you" like Claude. If a tool name is wrong, the symptom is over-blocking (reads blocked) or under-blocking (edits slip) — adjust the matcher.

### Zed / others

No known hook mechanism. Just run without the guard — it degrades fine; CI is the wall regardless.
