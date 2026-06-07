---
description: Run Semgrep SAST on top of skillsentry's verdict (opt-in; needs an external semgrep binary; degrades gracefully).
argument-hint: "[target dir] (defaults to the current repo '.')"
allowed-tools: Bash(node:*), Bash(semgrep:*), Bash(command:*), Read
---

# /supersize-semgrep:sast

Add deeper, language-aware Semgrep static analysis ALONGSIDE skillsentry's deterministic verdict. Read
`knowledge/trust-statement.md` first — this is a separate product that shells to an external tool.

## 1 — the deterministic verdict still comes from the pure auditor
The skillsentry CLI is a SEPARATE plugin; resolve it robustly (don't assume a sibling path — plugins
install as isolated subtrees). Try, in order: a `skillsentry` on PATH, then the sibling vendored CLI.
If NEITHER resolves, say so LOUDLY and tell the user to run `/skillsentry:audit` themselves — do not
bury the miss in a JSON note (U12).
```bash
TARGET="${1:-.}"
if command -v skillsentry >/dev/null 2>&1; then
  skillsentry "$TARGET" --format json
elif [ -f "${CLAUDE_PLUGIN_ROOT}/../skillsentry/cli/bin.js" ]; then
  node "${CLAUDE_PLUGIN_ROOT}/../skillsentry/cli/bin.js" "$TARGET" --format json
else
  echo "⚠️  skillsentry CLI not found — run /skillsentry:audit $TARGET separately for the deterministic verdict; this command will run only the Semgrep pass below." >&2
fi
```

## 2 — supersize with Semgrep IF it is installed
```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/sast.sh" "${1:-.}"
```
The script checks for `semgrep` on PATH:
- **present** → runs `semgrep --config auto --error "$TARGET"` and prints its findings.
- **absent** → prints one-line install guidance (`pipx install semgrep` / `brew install semgrep`) and
  exits 0 — it never blocks and never pretends to have run.

## 3 — present both, separately
Show skillsentry's PASS/REVIEW/BLOCK verdict and, beneath it, Semgrep's findings under a clearly
separate heading. Do NOT merge them into one verdict — they are two tools with two trust models. Note
explicitly whether Semgrep ran or was skipped.
