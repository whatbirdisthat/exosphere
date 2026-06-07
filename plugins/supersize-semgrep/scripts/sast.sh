#!/usr/bin/env bash
# supersize-semgrep: run Semgrep IF installed, else degrade gracefully. Never blocks, never pretends.
# This is a SEPARATE product that shells to an external binary — see ../knowledge/trust-statement.md.
set -uo pipefail

TARGET="${1:-.}"

if ! command -v semgrep >/dev/null 2>&1; then
  echo "○ semgrep is not installed — supersize-semgrep skipped (skillsentry's verdict stands alone)."
  echo "  Install it to enable deeper SAST:  pipx install semgrep   # or: brew install semgrep"
  exit 0
fi

echo "▸ semgrep $(semgrep --version 2>/dev/null) — scanning ${TARGET} (results are SEPARATE from skillsentry's verdict)"
semgrep --config auto --error "${TARGET}"
