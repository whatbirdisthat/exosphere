# FOUNDRY governance

- **merge-mode:** `pr-approval` — FOUNDRY builds; the adversarial reviewer panel + SENTINEL
  `/security-gate` must pass; then it opens a PR for the human to inspect and merge. FOUNDRY never
  self-merges to main.
- **test-runner:** Vitest (TS-native, v8 coverage).
- **architecture ADR:** yes — a one-page handler-architect ADR for the Pipeline + pure-scan-core shape
  (the never-execute trust boundary is recorded).
- **npm package name:** deferred to build time (accepted, low-stakes).
- Decided 2026-06-06 by the user.
