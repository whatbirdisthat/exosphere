# ADR-002: `.exosphereignore` matcher — pure-core, zero new runtime deps

**Status:** Accepted
**Date:** 2026-06-06
**Roadmap item:** R3
**Spawning agent:** lifecycle-orchestrator (embodying handler-architect)
**Extends:** ADR-001 (Pipeline + thin Hexagonal pure-scan-core)

## Context

R3 lets an audited target ship a `.exosphereignore` (gitignore-style globs) that excludes paths
from enumeration. Two decisions warrant a record: (1) **whether to add the `ignore` npm package**
or implement the matcher, and (2) **where the matcher lives** relative to the ADR-001 pure/adapter
boundary. A load-bearing product constraint is the **transparency invariant**: an exclusion must
never silently hide a finding — the report must disclose what was excluded.

## Decision

1. **No new runtime dependency.** Implement a small, vetted gitignore-subset matcher in
   `src/core/ignore.ts`. R1 shipped with **zero runtime dependencies**; R3 keeps that posture.
2. **The matcher is pure** (IO-free), in `core/*`, depending on `core/types` only. The filesystem
   read of the `.exosphereignore` file happens in the `enumerate` **adapter** (IO at the edge).
   `core/ignore.ts` takes the ignore-file **text** + candidate **path strings** and returns the
   exclusion decisions + provenance.
3. **Provenance is a first-class output**, not a side effect. The matcher reports, per excluded
   path, which pattern matched; the enumerate adapter aggregates this into an `ExclusionSummary`
   `{ excludedCount, patterns: { pattern, count }[] }` that flows into the report model.

## Why no `ignore` package

- **A security auditor with zero runtime deps is itself a smaller attack surface.** The tool
  exists to scrutinise supply-chain risk; adding a transitive-dep tree to do so is self-defeating
  and weakens the trust story (SMU §5 design value 4: safety of the auditor itself).
- `ignore` is CJS and stateful; the ADR-001 boundary wants a pure function over in-memory inputs.
- The required gitignore subset is **bounded and fully testable**: literal segments, `*`
  (non-`/`), `**` (cross-segment), `?`, leading-`/` root anchor, trailing-`/` directory match,
  mid-pattern `/` anchoring, `#` comments, blank lines, and `!` negation. All pinned to 100%
  coverage as pure coordinates.

## Supported gitignore subset (explicit scope)

Supported: `#` comments, blank lines, `*`, `**`, `?`, leading `/` (root-anchored), trailing `/`
(directory), embedded `/` (anchored to root), `!` negation (re-includes a previously excluded
path; last matching pattern wins). Out of scope (documented, not silently dropped): character
classes `[a-z]`, and `.gitignore` precedence across nested ignore files (single root file only,
matching the ROADMAP "single `.exosphereignore` at the target root" scope).

## Consequences

- `src/core/ignore.ts` (pure) + `src/core/__tests__/ignore.test.ts` (coordinates) added.
- `src/core/types.ts` gains `ExclusionSummary`; `AuditReport` gains an `exclusions` field.
- `src/core/report.ts` discloses the summary in markdown + JSON (transparency invariant).
- `src/adapters/enumerate.ts` reads `.exosphereignore` (unless `--no-ignore`), applies the pure
  matcher, returns `{ files, exclusions }`.
- `src/cli.ts` parses `--no-ignore` and threads the summary into the report.
- **Net new runtime dependencies after R3: zero.**

## Transparency invariant (tested, load-bearing)

The report ALWAYS shows the exclusion summary when any file was excluded. A permissive
`.exosphereignore` that excludes a malicious file yields PASS **only** alongside a visible
"N files excluded by patterns […]" disclosure in both md and JSON. `--no-ignore` bypasses
exclusion entirely and re-surfaces the hidden finding (BLOCK). Both are story-proven.

## SDLC checklist (R3)

- [x] Step 0 — Plan + ADR-002 (dependency decision recorded)
- [x] Step 1 — EARS-024..031 (continuity from 023; EARS/SMU gates PASS)
- [x] Step 2 — Gherkin ≥3/EARS incl. abuse (BDD gate PASS)
- [x] Step 3 — Tests RED (35 new coordinates; TEST-DESIGN gate PASS)
- [x] Step 4 — Gap map (all RED = feature-gap)
- [x] Step 5 — Implementation (pure `core/ignore` + adapter + cli + report; DESIGN gate PASS)
- [x] Step 6 — Green run 128 tests, 100/100/100/100 (REGRESSION gate PASS)
- [x] Step Story — 3 success-gate fixtures + self-scan PASS proven via built CLI; perf budget held; STORY_PROVEN
- [x] Step 7 — Sync (0/0 vs main)
- [x] Step 8 — Commit narrative
- [ ] Step 9 — Push + PR (pr-approval; AWAITING MERGE)

## Completion

- Coverage: 100% line / 100% branch / 100% function / 100% statement (128 tests)
- Self-scan: `exosphere-audit .` → PASS (0 findings, 90 files excluded-and-disclosed); `--no-ignore` → BLOCK
- Runtime dependencies added: ZERO (matcher implemented in pure core; see ADR-002 rationale)
- Security-gate: PASS (inline; `sentinel` plugin not installed)

## Revision history

| Date | Change | Reason |
|---|---|---|
| 2026-06-06 | Initial decision | FOUNDRY cycle R3 |
