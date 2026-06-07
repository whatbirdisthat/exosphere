---
description: Run Semgrep SAST on top of skillsentry's verdict (opt-in; needs an external semgrep binary; degrades gracefully).
argument-hint: "[target dir] (defaults to the current repo '.')"
allowed-tools: Bash(node:*), Bash(semgrep:*), Bash(command:*), Read
---

# /supersize-semgrep:sast

Add deeper, language-aware Semgrep static analysis ALONGSIDE skillsentry's deterministic verdict. Read
`knowledge/trust-statement.md` first — this is a separate product that shells to an external tool.

## 1 — the deterministic verdict still comes from the pure auditor
```bash
node "${CLAUDE_PLUGIN_ROOT}/../skillsentry/cli/bin.js" "${1:-.}" --format json 2>/dev/null || \
  echo '{"note":"skillsentry plugin not found alongside; run /skillsentry:audit separately"}'
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
