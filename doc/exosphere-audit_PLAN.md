# Implementation Plan — exosphere-audit (R1, first vertical slice)

- **Title:** exosphere-audit CLI — static supply-chain auditor (v1 slice)
- **Roadmap item:** R1
- **Date:** 2026-06-06
- **Owner:** lifecycle-orchestrator
- **Source of truth:** `doc/idea/exosphere-audit/brief.md`; domain: `doc/SUBJECT_MATTER_UNDERSTANDING.md`;
  architecture: `doc/architecture/ADR-001-pipeline-pure-scan-core.md`; governance: `.foundry/governance.md`.

## Environment Prerequisites

| Concern | Value |
|---|---|
| Language / runtime | TypeScript 5.x on Node.js (v24 present; targets ≥18), ESM, strict mode |
| Package / dist | npm, `bin` entry for `npx exosphere-audit`; package name placeholder `exosphere-audit` |
| Test runner | **Vitest** + `@vitest/coverage-v8` |
| Coverage floor | line 100% AND branch 100% (Vitest `thresholds: {lines:100, branches:100, functions:100, statements:100}`) |
| BDD harness | **Cucumber-style tags inside Vitest** (`@EARS-{ID}` describe/it tags). `bdd_harness: PRESENT (Vitest-mapped)`. No separate Cucumber runtime; `.feature` files are spec docs in `doc/spec/features/`, their scenarios mapped 1:1 to tagged Vitest cases. |
| E2E / STORY | CLI subprocess harness over the labelled fixture corpus. handler-playwright **N/A** (no UI). |
| Lint / format | ESLint + Prettier (not a DoD gate for the slice; tsc strict is the type gate) |

## Coverage Commands

- **Branch+line coverage (the gate):** `npx vitest run --coverage`
  (config enforces `lines:100, branches:100, functions:100, statements:100`).
- Type gate: `npx tsc --noEmit`.
- Build (for STORY subprocess): `npm run build` → `dist/`.

## EARS & Gherkin Planning Summary

Expected EARS families (detail in `doc/SPECIFICATION.ears.md`):
- Input resolve (git-url vs local-dir auto-detect).
- Safe-acquire / **never-execute** invariant (shallow clone, hooks disabled, no install/hook run, cleanup).
- Enumerate (skill SBOM: SKILL.md/agents/plugin.json/settings.json/hooks/scripts/MCP).
- Four detection classes (dangerous-bash, prompt-injection, over-broad-perms, committed-secrets).
- Verdict aggregation (PASS/REVIEW/BLOCK) + non-zero exit on BLOCK.
- Dual output (markdown + JSON), each finding cites file:line+rule+why.

Each EARS gets ≥3 Gherkin scenarios (happy / unhappy / **abuse**). Abuse matters doubly: hostile
clone, injection-in-fixture, zero-width unicode, HTML-comment-hidden instructions.

## File-by-File Change Plan

Per ADR-001. Pure core first (`src/core/*`), then adapters (`src/adapters/*`), then CLI (`src/cli.ts`,
`src/bin.ts`). Tests beside source (`__tests__/`), integration in `tests/integration/`, story in
`tests/story/`, corpus in `tests/corpus/`.

## Risk Register

| Risk | Mitigation |
|---|---|
| **Auditor executes hostile payload** (worst outcome) | Pure core never imports `node:child_process`/`node:fs`; clone uses `-c core.hooksPath=/dev/null`, `GIT_TERMINAL_PROMPT=0`, no submodule/LFS smudge, no install step; explicit test asserts no execution. |
| False positives erode trust | Precision-first ruleset; REVIEW soft tier; corpus gate enforces ≤10% FP; benign fixtures stress near-miss patterns. |
| Coverage gap on error branches | One coordinate per error branch; typed errors; branch coverage gate at 100%. |
| Temp clone leakage | `finally` cleanup; integration test asserts temp dir removed. |
| Scope creep into R2–R7 | DoD + SMU §6 scope discipline; build R1 only. |

## Test Strategy

- Runner Vitest; unit beside source; integration `tests/integration/`; story `tests/story/`.
- Tests-as-coordinates: typed exact assertions, one axis per edge case, typed errors.
- Corpus is the success oracle: labelled malicious + benign fixtures with expected verdicts.

## Performance Targets

- Full CLI audit over a fixture: wall-clock budget asserted in the story harness (latency-sensitive
  path). Disk write of report: < 100 ms. No network during scan (offline-after-fetch).

## UI Elements

None. CLI only. No gesture tests. handler-playwright N/A.

## Checklist (Steps 0–9 + Story)

- [x] Step 0 — Plan + DoD + ADR + scaffold
- [ ] Step 1 — EARS (EARS-REVIEWER + SMU-REVIEWER PASS)
- [ ] Step 2 — Feature docs / Gherkin (BDD-REVIEWER PASS)
- [ ] Step 3 — Tests RED (TEST-DESIGN-REVIEWER PASS)
- [ ] Step 4 — First test run / gap map
- [ ] Step 5 — Implementation (DESIGN-REVIEWER PASS)
- [ ] Step 6 — Green run, 100/100 coverage (REGRESSION-REVIEWER PASS)
- [ ] Step Story — corpus gate ≥90%/≤10%-FP, STORY_PROVEN
- [ ] Step 7 — Sync
- [ ] Step 8 — Commit message
- [ ] Step 9 — Commit/push + PR + SENTINEL security-gate (AWAITING MERGE)

## Resumption (cold-start)

1. Read this plan, `DEFINITION_OF_DONE.md`, `doc/SUBJECT_MATTER_UNDERSTANDING.md`,
   `doc/architecture/ADR-001-*.md`, `doc/idea/exosphere-audit/brief.md`, `ROADMAP.md` (R1).
2. Confirm branch `slice/exosphere-audit-v1`. Governance = pr-approval (never self-merge).
3. Build the pure scan core first (types → engine → ruleset/scanners → aggregator → reporters),
   then acquire + enumerate adapters, then CLI. The corpus IS the success gate.
4. Do NOT build R2–R7. Line ends at DELIVERY (no DEPLOY/VERIFY).

## Completion

- Commit hash: `c1533fa`
- Date: 2026-06-06
- PR: https://github.com/whatbirdisthat/exosphere/pull/1 (AWAITING MERGE — pr-approval)
- Coverage: 100% line / 100% branch / 100% function (88 tests)
- Corpus gate: 100% accuracy at 0.0% false-positive (≥90%/≤10%-FP gate cleared)
- Security gate: PASS (0 real secrets; 0 production-dep vulnerabilities)
