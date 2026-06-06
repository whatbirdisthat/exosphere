# ADR-001: Pipeline + thin Hexagonal pure-scan-core

**Status:** Accepted
**Date:** 2026-06-06
**Roadmap item:** ROADMAP-1
**Spawning agent:** lifecycle-orchestrator (embodying handler-architect) at run top

## Context

R1 builds a CLI that acquires a **hostile** Claude Code skill/plugin (git URL or local dir),
statically scans it across four detection classes, and emits an explained PASS/REVIEW/BLOCK
verdict. Two boundaries warrant a recorded decision before decomposition: a new **external
integration** (git acquisition of a hostile remote — EARS-005, EARS-006) and a new **delivery
channel** (a CLI — EARS-001, EARS-021, EARS-022). The load-bearing constraint (SMU §6) is that
the auditor **never executes** the audited artefact or its hooks.

## Decision

**Primary pattern:** Pipeline (ordered transformation: acquire → enumerate → scan → aggregate → render)

**Composed with:** thin Hexagonal / Ports-&-Adapters — a pure, IO-free **scan core** wrapped by
thin adapters at the edges.

The decidable logic (rule matching, finding shaping, verdict aggregation, report formatting from a
report model) is a **pure core** with no IO. All IO — git clone, filesystem walk, stdout, process
exit code — lives in thin **adapters** at the pipeline edges. The pure core never touches the
network or shell and therefore *cannot* execute the audited artefact: the never-execute invariant
is a structural property of the boundary, not a runtime check we hope holds.

## Why this pattern

- **Domain testability without I/O:** rule engine, every scanner's matcher, the verdict
  aggregator, and the report-model renderers are pure functions over in-memory inputs — unit-pinned
  as coordinates with zero filesystem or network.
- **Integration boundaries with test doubles:** the *acquire* port (resolve input + hostile shallow
  clone) and the *enumerate* port (tree walk → skill SBOM) are exercised against a **real temp
  filesystem** at integration level; the scan core receives plain in-memory file records, so unit
  tests need no disk.
- **Story-test stack:** the built CLI binary is spawned as a subprocess over the labelled fixture
  corpus — fully unmocked, real disk, real git for at least one fixture.

## Consequences

### Files & layers introduced

| Layer | Path | Owns | Depends on |
|---|---|---|---|
| Domain types | `src/core/types.ts` | `Rule`, `Finding`, `Severity`, `Verdict`, `ScanInput`, typed errors | nothing |
| Rule engine | `src/core/engine.ts` | apply ruleset → findings over in-memory files | types |
| Scanners (pure rules) | `src/core/scanners/{dangerous-bash,prompt-injection,over-broad-perms,committed-secrets}.ts` | one detection class each (disjoint rule modules) | types |
| Ruleset | `src/core/ruleset.ts` | curated, versioned rule collection (loads scanners) | scanners |
| Aggregator | `src/core/verdict.ts` | findings → PASS/REVIEW/BLOCK + exit code | types |
| Reporters | `src/core/report.ts` | report model → markdown + JSON | types |
| Adapter: acquire | `src/adapters/acquire.ts` | input resolve + hostile shallow clone + cleanup | types |
| Adapter: enumerate | `src/adapters/enumerate.ts` | tree walk → skill SBOM (in-memory file records) | types |
| Adapter: CLI | `src/cli.ts` / `src/bin.ts` | argv → pipeline → stdout + exit code | all above |

Dependency rule: `core/*` depends on `core/types` only — **never** on `adapters/*` or Node IO
modules (`node:fs`, `node:child_process`). Adapters depend inward on the core.

### Test placement

| Test type | Location | Substitutes |
|---|---|---|
| Unit | `src/**/__tests__/*.test.ts` (beside source) | none — pure core, in-memory inputs |
| Integration | `tests/integration/*.integration.test.ts` | real temp filesystem; real `git` for acquire |
| BDD | Gherkin `.feature` (`doc/spec/features/`) mapped to Vitest via `@EARS-{ID}` tags | wired to the use-case layer |
| Story | `tests/story/*.story.test.ts` | unmocked: spawn the built CLI over the corpus |
| Performance | inside the story harness | wall-clock budget on a full audit |

### Test-first checklist

- [x] Can the domain logic be exercised by a unit test without I/O? **Yes** — the scan core is pure.
- [x] Can each integration point be replaced by a test double? **Yes** — acquire/enumerate are ports;
  the core consumes in-memory file records.
- [x] Can a story test exercise the complete stack against a real binary on real disk? **Yes** — the
  CLI is spawned as a subprocess over the corpus.

### Rejected alternatives

- **Layered / N-tier** — rejected: it does not force the IO-free core boundary, so the never-execute
  invariant would be a convention rather than a structural guarantee.
- **A single monolithic scanner module** — rejected: the four detection classes must be disjoint,
  parallel-safe rule modules (FOUNDRY_PLAN T8b–e fan out after T8a); one module would serialize them
  and entangle their rule state.

## Downstream instructions

- TEST-AGENT: place pure-core unit tests beside source under `__tests__/`; place acquire/enumerate
  integration tests under `tests/integration/` using a real temp dir; the corpus story harness lives
  under `tests/story/`. Use in-memory `FileRecord[]` inputs for all scan-core coordinates.
- IMPLEMENT-AGENT: build **types → engine → ruleset/scanners → aggregator → reporters** (pure core
  first and once), then the acquire and enumerate adapters, then the CLI wiring. Do not invert this
  order. `core/*` must never import `node:fs`, `node:child_process`, or any adapter.
- STORY-AGENT: the unmocked full-stack test spawns the built CLI (`node dist/bin.js <fixture>`) over
  every corpus fixture and asserts verdict + exit code + JSON/markdown shape; at least one fixture is
  acquired via real `git clone --depth 1` of a local bare repo to prove the hostile-clone path.

## Revision history

| Date | Change | Reason |
|---|---|---|
| 2026-06-06 | Initial decision | FOUNDRY cycle R1 |
