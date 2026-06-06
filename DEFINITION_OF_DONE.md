# Definition Of Done

Date: 2026-06-06
Scope: IDEATOR-originated items processed through the Development System (Steps 0-9) — current cycle: **R1 (skillsentry CLI, first vertical slice)**
Owner: Development System Orchestrator (lifecycle-orchestrator)

## Purpose

This document defines the shared, non-negotiable quality bar for every IDEATOR item
in this project. All agents must consult this file before they begin work and before
they hand off to the next stage.

## Meaning Of Done

The target value is not "code exists". The target value is:
- The original problem is demonstrably solved for intended actors.
- The solution is specified, documented, tested, proven, and packaged for shipment.
- Evidence exists for behavior under happy, unhappy, and abuse conditions.
- Upstream/downstream handoffs are complete, explicit, and auditable.
- Every generated document has passed a reviewer-agent check with approved updates.

## Universal Done Gates

### 1. Problem-Solution Traceability
- Every artifact traces back to the IDEATOR brief: problem, actors, scope, constraints.
- Each requirement has a stable ID and mapping to tests.

### 2. Specification Integrity
- EARS statements are complete, unambiguous, and uniquely ID'd.
- Gherkin scenarios cover happy, unhappy, and abuse paths.
- All `.feature` files are either wired to a passing test runner OR explicitly moved to
  `doc/spec/` with a `# SPECIFICATION ONLY — NOT EXECUTABLE` header.

### 3. Test Evidence — Non-Negotiable
- Tests fail before implementation (RED evidence) and pass after (GREEN evidence).
- Regressions are absent in full-suite runs.
- Line coverage threshold: **100%**. Branch coverage threshold: **100%**.
- Every error path (guard clause, exception handler, else arm) has a test that
  deliberately triggers it and asserts the error response.

### 4. Dead Code Policy
- Any file < 50% coverage: delete it or test it. "Retain for backward compatibility" without
  tests is not a valid disposition.

### 5. BDD Executability
- Every Gherkin scenario wired to the runner has executable step bindings. Here: `.feature`
  files are mapped to Vitest specs via `@EARS-{ID}` tags (cucumber-style, no separate Cucumber
  runtime). Unwired scenarios live in `doc/spec/` as specification-only.

### 6. Story / E2E Tests
- At least one story test per feature exercises the **complete, unmocked stack**: the built CLI
  is spawned as a subprocess over the labelled fixture corpus — real process, real disk, real
  git acquisition for at least one fixture, no internal mocking.
- No UI in this slice (CLI only) — Playwright gesture tests are **N/A** (confirmed by
  `first-slice.md` and `FOUNDRY_PLAN.md`).

### 7. Performance Evidence
- The latency-sensitive path here is a full CLI audit over a fixture. Story tests record a
  perf-delta sample (wall time) and assert a budget; a regression past budget does not merge.

### 8. Implementation Quality
- Production code satisfies spec intent (not just literal assertions).
- Architecture boundary (pure scan core never executes audited code) is maintained.
- **Load-bearing safety invariant:** the auditor MUST NEVER execute the audited artefact or its
  hooks (no build/install/post-install/hook run). This is tested explicitly.

### 9. Integration And Release Readiness
- Commit message documents WHY/WHAT/TESTING/ROADMAP closure.
- Roadmap and plan artifacts updated to AWAITING MERGE / COMPLETE state per governance.

### 10. Reviewer Gate Compliance
- Every newly generated or materially changed document reviewed by reviewer panel.
- Reviewer recommendations applied or explicitly dispositioned. Zero unresolved CRITICAL findings.

### 11. Handoff Contract Completeness
- Each stage output includes downstream instructions, artifact references, unresolved risks,
  and acceptance checks in the handoff-protocol YAML schema.

## Project-Specific Success Gate (R1)

- A labelled fixture corpus (malicious + benign): malicious → BLOCK with the correct
  `file:line` + rule; benign → PASS; aggregate **≥ 90% correct classification at ≤ 10%
  false-positive rate**. This corpus IS the success oracle and is built test-first.
- SENTINEL `/security-gate` runs on our own repo before DELIVERY and returns PASS (no
  committed secrets / no flagged dependency / no PII leak).

## Stage-Specific Done Criteria

### Step 0 — Plan
- Plan at `doc/skillsentry_PLAN.md`; `DEFINITION_OF_DONE.md` at root; ADR written; checklist
  for Steps 0-9 + story present; resumption section present.

### Step 1 — EARS
- EARS file with unique IDs; every statement testable; EARS-REVIEWER + SMU-REVIEWER PASS.

### Step 2 — Feature Docs
- `.feature` scenarios for happy/unhappy/abuse per EARS (≥3 each); tags reference EARS IDs;
  BDD-REVIEWER PASS.

### Step 3 — Tests
- Tests author both happy AND every error/guard path; error paths deliberately triggered and
  asserted; tests RED for feature-gap reasons; TEST-DESIGN-REVIEWER PASS.

### Step 4 — First Test Run
- Gap map documents the failure surface; red reasons classified feature-gap vs infrastructure.

### Step 5 — Implementation
- Minimal code to satisfy failing tests; test intent unchanged; DESIGN-REVIEWER PASS.

### Step 6 — Green Run
- Full suite green; line=100% branch=100% confirmed; no regressions; REGRESSION-REVIEWER PASS.

### Step Story
- One story test exercises the complete unmocked stack (spawned CLI over corpus); corpus gate
  ≥90%/≤10%-FP asserted; perf sample recorded; total coverage 100/100;
  SECURITY-REVIEWER + REGRESSION-REVIEWER + COVERAGE-REVIEWER PASS; STORY_PROVEN emitted.

### Step 7 — Sync
- Branch synced with main; tests re-run green after sync.

### Step 8 — Commit Message
- WHY/WHAT/TESTING/ROADMAP structure; diff summary aligns with changed files; reviewer PASS.

### Step 9 — Commit And Push
- Adversarial review PASS; SENTINEL `/security-gate` PASS; changes committed and pushed.
- Governance = **pr-approval**: branch pushed + PR opened; roadmap STATUS: AWAITING MERGE
  (→ COMPLETE on human merge). Never self-merge to main.

## Project-Specific Success Gate (R2 — author self-audit + README trust-badge)

> Extends R1+R3; all R1+R3 gates above remain in force. R2 adds the `--badge` and `--ci` surfaces.

- **PASS → badge:** a PASS-fixture repo, audited with `--badge`, emits a valid, **byte-stable** badge
  snippet — BOTH a Markdown snippet (`![audited by skillsentry](<inline data-URI svg>)`) and the
  raw SVG source. Determinism is asserted across two runs (identical bytes).
- **BLOCK/REVIEW → no badge:** a BLOCK-fixture repo, audited with `--badge`, emits **no badge** plus a
  clear one-line reason, and preserves the normal report + the non-zero exit code on BLOCK.
- **`--ci` gates correctly:** non-zero exit on BLOCK gates the author's PR; `--ci` respects the R3
  `.skillsentryignore` by default and `--no-ignore` still overrides it.
- **Transparency carry-over (load-bearing):** a repo that earns a badge via `.skillsentryignore`
  exclusions STILL discloses those exclusions in the report — a badge cannot launder a hidden
  exclusion. Tested with an abuse fixture (a malicious `.skillsentryignore` hiding a finding).
- **Zero new runtime dependency** (ADR-003): the SVG is hand-generated; no SVG/badge package added.
- **Offline:** no hosted/dynamic badge endpoint; the badge is a self-contained inline data-URI.
- 100% coverage floor (stmts/branches/funcs/lines) held; all R1+R3 tests remain green.

### Step-Story Done Criteria (R2 addendum)

- The built CLI proves, over real fixtures on real disk: `--badge` on PASS emits a byte-stable md+svg
  (verified across two spawns); `--badge` on a BLOCK fixture emits no badge + a reason + non-zero exit;
  `--ci` gates on BLOCK and passes on PASS; a badge earned via `.skillsentryignore` still discloses the
  exclusion. `STORY_PROVEN` requires all of these.

## Orchestrator Exit Condition

An item is done ONLY when all universal + stage gates pass, line=branch=100%, the corpus gate
holds (≥90%/≤10%-FP), `STORY_PROVEN` is present, and the delivery sentinel matches pr-approval
(`AWAITING_MERGE` with PR open + reviews PASSed; final `DELIVERY_COMPLETE` on human merge).
The line ends at DELIVERY — no DEPLOY/VERIFY (pure library/CLI).
