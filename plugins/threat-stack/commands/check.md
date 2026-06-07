---
description: Consolidated threat-stack readiness — is the auditor built, the matrix healthy, and the optional tools present?
allowed-tools: Bash(node:*), Bash(npm:*), Bash(command:*), Read
---

# /threat-stack:check

Report platform readiness in one view. Advisory — never blocks.

## 1 — auditor (AUDIT) is runnable
```bash
test -f plugins/skillsentry/cli/bin.js && echo "✓ skillsentry vendored CLI present" || echo "✗ run: npm run build:plugin"
node plugins/skillsentry/cli/bin.js . --ci 2>/dev/null && echo "✓ self-audit ran" || echo "⚠ self-audit reported a verdict (see output)"
```

## 2 — threat map (MODEL) is healthy
```bash
node plugins/threat-modeler/scripts/coverage-matrix.mjs 2>/dev/null || echo "✗ build first: npm run build"
```
Flag any portal still `ABSENT` as the next gap-ritual target.

## 3 — optional tools (EXTEND)
```bash
command -v semgrep >/dev/null 2>&1 && echo "✓ semgrep present (supersize-semgrep usable)" || echo "○ semgrep not installed (supersize-semgrep will degrade gracefully)"
```

Summarise as a ✓/⚠/✗/○ table by stage, then name the single most useful next action.
