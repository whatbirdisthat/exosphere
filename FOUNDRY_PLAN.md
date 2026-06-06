# FOUNDRY Plan — skillsentry — R9d (T3 rug-pull / version-diff) — 2026-06-07

> Single-item cycle. Active P0 slice, branch `slice/r9d-rugpull`. Discovery is COMPLETE and at
> knowledge-parity — the build-ready IDEA package is `doc/idea/r9d-rugpull/` (brief · smu-seed ·
> first-slice · handoff; exit gate verified ✅). This plan does NOT re-interrogate discovery; it
> decomposes the agreed slice into a test-first build order, pins the load-bearing invariants as
> enforceable constraints, and hands each step to `lifecycle-orchestrator`.
>
> **Objective (verbatim from ROADMAP Tier 1d):** detect the rug-pull — a skill that was clean when
> approved and has since mutated to gain dangerous capability — by diffing the target's current
> trust-relevant surface against a committed `.skillsentry.lock` and flagging capability ESCALATION
> (not benign drift). This is the npm-publish gate.

---

## Stack Manifest

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript 5.6 (ESM, `"type":"module"`) | strict; `.js` import specifiers |
| Runtime | Node ≥ 18 | `node:crypto` (sha256), `node:fs/promises` — **adapter layer only** |
| Test runner | vitest 2.1.x | `npm run test` / `npm run test:cov` (v8 coverage) |
| BDD/story | vitest corpus oracle (`tests/corpus/manifest.ts` + `tests/story/corpus.story.test.ts`) | this repo has **no** Gherkin/pytest-bdd; "story" = the labelled-corpus end-to-end proof through the CLI |
| E2E | `tests/integration/cli.integration.test.ts` (drives `runAudit`) | no Playwright (CLI tool, not a UI) |
| Persistence | NEW: `.skillsentry.lock` — deterministic byte-stable JSON at target root | read/written in adapter; **never executed** (same boundary as R3 ignore / R4 ruleset data) |
| Tooling | tsc build, eslint (`--max-warnings=0`) | `npm run build`, `npm run lint`, `npm run selfaudit` |
| **Runtime deps** | **{} (zero)** — the trust pillar | sha256 via `node:crypto`; structural diff is pure. **No new dep is admissible.** |

**VALUE_HANDLER:** `handler-js` staffs every TEST / IMPLEMENT / STORY unit (TS/Node project). No other
handler is required. **No missing handlers** — see §Missing Handlers.

**Commands (CI + local gate):** `npm run build` · `npm run test:cov` · `npm run lint` ·
`npm run selfaudit` (= `npm run build && node dist/bin.js .`, must stay **PASS** — dogfood gate).

---

## Subject Matter Understanding — Status

**SMU delta source of truth: `doc/idea/r9d-rugpull/smu-seed.md`** (not restated here). It already
extends `doc/SUBJECT_MATTER_UNDERSTANDING.md` (8.8 KB, present) with every temporal-detection concept
this slice introduces: the rug-pull threat, the **capability fingerprint** (NOT a raw byte snapshot),
the `.skillsentry.lock` artifact, the **T3 temporal tier** (and why T3 ships before T2), the
load-bearing invariants table, and the architectural fact that **T3 is not expressible as a `Rule`**.

**Gap review against the current codebase — CONFIRMED accurate, no SMU edit needed:**
- `src/core/types.ts` — `RuleTier = 'T0' | 'T1'` and every matcher (`detect` / `detectCrossFile`) is
  per-file and sees only **current** state. The smu-seed's "T3 is not a Rule" claim is verified true:
  drift needs `(freshScanResult, lockfile)` — two target-level inputs no `Rule` signature can take.
- ADR-001 boundary holds — `core/*` imports only `types.ts`; `node:fs`/`node:crypto` live in
  `src/adapters/*`. The lockfile read/write + sha256 MUST land in the adapter; the diff MUST be pure core.
- The R3 transparency precedent (`ExclusionSummary` in `AuditReport`, disclosed in `report.ts`) is the
  exact pattern the lockfile disclosure must mirror.

If discovery had left a domain gap I would append to the SMU; it has not. **SMU action for this cycle:
none beyond carrying the smu-seed into the cycle. On COMPLETE, fold the smu-seed into the main SMU.**

---

## Architecture Decisions

**ADR-008 — T3 temporal tier via approval lockfile** (authored as a *step of this slice*, step 8).

Phase 2.5 trigger check: R9d introduces a **new persistence mechanism** (`.skillsentry.lock`) AND a
**new bounded context** (temporal/approval state) AND **modifies an existing boundary** (the engine →
verdict edge gains a target-level temporal pass that no `Rule` can express). All three triggers fire,
so an ADR is mandatory. **However**, the architecture is already *decided and pressure-tested* in the
IDEA package — the discovery `/ideator` pass resolved both forks (capability-fingerprint diff;
additive-only invariant) and the "T3 is not a Rule → temporal pass at the engine/adapter edge"
shape. There is therefore **no open architectural question for `handler-architect` to decide**;
ADR-008 is a *recording* artifact, not a *decision* spawn. I am NOT spawning a separate architect
cycle — doing so would re-litigate a settled design and burn tokens against the Prime Directive.

ADR-008 must record (per first-slice step 7): the new T3 tier; capability-fingerprint diff basis (raw
byte-hash rejected — trips every benign edit); the additive-only invariant `verdict = max(fresh, T3)`;
the lockfile-as-data security boundary (read, never executed); the **T3-before-T2 ordering** rationale
(T3 holds deterministic/offline/never-execute; T2 would break it, stays an unbuilt opt-in); and that
git-ref `--since` diffing was rejected in favour of the offline lockfile. References ADR-001 (pure
core), ADR-004 (tier extension point), ADR-006/007 (prior tier additions).

---

## Shared Infrastructure Map

This is a single-item cycle, so "shared" = components built once *within* this slice and consumed by
multiple later steps. Building the PURE core units first and once (not re-deriving capability extraction
per call site) is the highest-leverage move.

| Component | Built in step | Consumed by | Build-once tokens | Cost if duplicated |
|---|---|---|---|---|
| Lockfile schema types (`LockFile`, `CapabilitySet`, `FileHash`) + pure serialiser | Step 1 | 2,3,4,5,6 | ~3k | ~9k (re-shaped per consumer) |
| `extractCapabilitySet(findings, files, exclusions) → CapabilitySet` (pure) | Step 1/4 | 2 (approve), 4 (diff input) | ~3k | ~6k (approve & diff drift apart → laundering bug) |
| sha256 + lockfile read/write IO (adapter) | Step 2 | 3, 5 | ~3k | — |
| `diffCapabilities(fresh, lock) → DriftFinding[]` (pure) | Step 4 | 5 (fold), 6 (report) | ~5k | ~10k |
| Drift→Finding/disclosure mapping | Step 5 | 6, 7 | ~2k | — |

**Load-bearing reuse rule:** `--approve` (step 3) and the diff (step 4) MUST extract the capability set
through the **same pure function** built in step 1. If approve records a capability set computed
differently from how the diff recomputes "fresh", benign drift will false-positive AND escalation may
slip — the FP line and the anti-laundering invariant both depend on this single source of truth.

---

## Token Budget Summary

No `IDEA_COST.jsonl` exists, so estimates use the **priority→tier heuristic anchored to the two nearest
shipped comparables on this exact codebase**: R9b (T1 intra-file, EARS-058–066, ~9 EARS, additive tier)
and R9b.1 (T1 cross-file, EARS-067–074, 8 EARS, additive tier). R9d is comparable in shape (one additive
tier, new builtin, new DetectionClass, RuleTier widened, ADR + corpus) but has **more surface**: a new
IO artifact (lockfile read/write/serialise), a new CLI flag (`--approve`), and a temporal pass wired at
a new edge. Complexity factor **1.3** (more actors/surface than a pure-analyzer slice).

| Step | Unit | TEST tokens | IMPLEMENT tokens | Basis |
|---|---|---|---|---|
| 1 | Lockfile schema + pure serialiser + `extractCapabilitySet` | ~3k | ~4k | heuristic ×1.3 |
| 2 | sha256 + lockfile file IO (adapter) | ~2k | ~3k | adapter precedent (enumerate/acquire) |
| 3 | `--approve` CLI wiring | ~2k | ~2k | flag-parse precedent (`--badge`/`--ci`) |
| 4 | Capability-set diff (pure core) — **FP line** | ~5k | ~5k | highest-risk; exhaustive class unit tests |
| 5 | T3 temporal-pass wiring + additive-only fold | ~3k | ~3k | engine/adapter edge |
| 6 | Report surface (md + JSON): delta, "changed since approval", "approved N high" disclosure | ~3k | ~3k | report precedent (R3 exclusions) |
| 7 | Corpus fixtures (5 gates) — **build benign-drift + laundering FIRST** | ~4k | ~2k | corpus precedent (R9a/R9b) |
| 8 | ADR-008 + RULESET.md update + EARS-075+ + dogfood | ~3k | ~2k | recording artifact |
| | EARS authoring (whole slice, EARS-075 → ~090) | ~4k | — | ~9–12 statements |
| | Feature/story + reviewer revision headroom | — | ~6k | SECURITY-REVIEWER likely revision on additive-only |
| **Total** | | **~29k** | **~30k** | |

**Cycle estimate: ~59k tokens** (range 50–70k with reviewer revision cycles).
`estimation_basis: heuristic-anchored-to-R9b/R9b.1 ×1.3`. Record actuals to a new `IDEA_COST.jsonl`
on COMPLETE so the next cycle has history.

---

## Work Decomposition

### Item R9d — T3 rug-pull / version-diff (approval-lockfile drift detection)

**Tier:** PRIMARY (P0 — the differentiator and the npm-publish gate)
**Priority status:** HIGH
**Token budget estimate:** ~59k (basis: heuristic anchored to R9b / R9b.1 ×1.3)
**Depends on:** nothing open (builds on shipped R3 transparency, R4 ruleset, R9a framework mapping)
**Parallel-safe with:** n/a (single item)

The 8 steps of `first-slice.md` are the spine. Each step is test-first; the **100% coverage floor and
zero-new-dep gate hold at every step**. Steps are classified PURE (coordinate-bearing, unit-testable in
isolation, parallelisable across `handler-js` workers) vs WIRING (thin, story/integration-level).

#### Step 1 — Lockfile schema + pure serialiser + `extractCapabilitySet`  · **PURE**
- New types in `src/core/types.ts`: `LockFile` (schemaVersion, perFile sha256 map, `CapabilitySet`,
  approval verdict, disclosed `.skillsentryignore` provenance), `CapabilitySet`, `DriftFinding`.
- Widen `RuleTier` → `'T0' | 'T1' | 'T3'`. Add `DetectionClass` `'version-drift'`.
- Pure serialiser `serialiseLock(lock) → string` — **byte-stable**: sorted keys, stable ordering,
  trailing newline. Pure `extractCapabilitySet(findings, files, exclusions) → CapabilitySet`.
- `handler-js` — TEST: byte-stability + capability-set equality robustness (reorder/whitespace);
  IMPLEMENT: types + pure functions, no `node:*` import.
- **Parallelisable** with step 7 fixture authoring (different files, no shared writes).

#### Step 2 — sha256 + lockfile file IO (adapter)  · **WIRING (adapter)**
- New `src/adapters/lockfile.ts`: `hashFiles(files) → Map<path,sha256>` (`node:crypto`), `readLock(root)`
  / `writeLock(root, text)` (`node:fs/promises`). `.skillsentry.lock` self-excluded from enumeration
  (extend `enumerate.ts` skip set, mirroring `.skillsentryignore`).
- `handler-js` — TEST: integration (real fs temp dir); IMPLEMENT: adapter only. **ADR-001 guard:** no
  `node:fs`/`node:crypto` may appear under `src/core/**` (add/extend a lint or test assertion).

#### Step 3 — `--approve` CLI wiring  · **WIRING (story-level)**
- Extend `parseArgs` with `approve: boolean`. On `--approve`: run the normal scan, extract capability set
  (step 1), hash files (step 2), write `.skillsentry.lock`. Byte-stable; re-approve identical state →
  identical bytes.
- `handler-js` — integration test: approve clean target → lock written; re-approve → byte-identical.

#### Step 4 — Capability-set diff (pure core)  · **PURE · HIGHEST-RISK (the FP line)**
- New `src/core/drift.ts`: `diffCapabilities(freshCapabilitySet, lock) → DriftFinding[]`. Pure over
  already-parsed records. Classify each mutation:
  - **benign drift** (per-file hash changed, capability set unchanged) → informational note, **no finding**.
  - **escalation** (set GREW: new sink/perm/hook/script) → `DriftFinding` tier `'T3'`, class
    `'version-drift'`, severity from the escalation, OWASP **ASI04** + ATLAS, cites escalated file:line + delta.
  - **approval invalidation** (a file that carried an accepted finding changed) → re-surface.
- `handler-js` — TEST **exhaustively, each class** (this is where FPs are born); IMPLEMENT pure, minimal.
- **Parallelisable** with step 6 report rendering once the `DriftFinding` shape is frozen by step 1.

#### Step 5 — T3 temporal-pass wiring + additive-only fold  · **WIRING (engine/adapter edge)**
- In `cli.ts` (the edge where the lockfile IO input lands): after `scan(files, ruleset)` → `findings`,
  if a lockfile was read, compute fresh capability set, `diffCapabilities`, fold drift findings in.
- **Additive-only, ENFORCED IN CODE:** the fold is a literal `max(freshVerdict, driftVerdict)` — drift
  findings are *added* to the finding list before `aggregate`; the lockfile path can never *remove* a
  finding or lower a verdict. New closed-registry builtin name `'lockfile-drift'` registered (the T3
  signal's source label), even though T3 runs as a temporal pass not a per-file `Rule`.
- `handler-js` — TEST: a permissive lockfile cannot lower a HIGH verdict (the anti-laundering test);
  no-lockfile path is byte-identical to today.

#### Step 6 — Report surface (md + JSON)  · **WIRING (story-level)**
- Extend `report.ts` (mirror the R3 `appendExclusions` pattern): render the lockfile delta, the
  "**N files changed since approval**" informational note, and — load-bearing — the
  "**lockfile approved N high-severity findings**" disclosure. JSON carries the same structured fields.
- `handler-js` — TEST: each surface (delta / changed-note / approved-HIGH disclosure) in both formats.

#### Step 7 — Corpus fixtures  · **PURE (data) · BUILD GATING FIXTURES FIRST**
- New `tests/corpus/` entries + `manifest.ts` rows for the 5 success-gate fixtures (see §Gating Fixtures).
- `handler-js` (STORY) — these gate the diff implementation: the benign-drift and laundering fixtures
  must exist and be red before step 4/5 code is written.

#### Step 8 — ADR-008 + docs + dogfood  · **WIRING (docs)**
- Author ADR-008 (see §Architecture Decisions). Update `doc/RULESET.md` if the rule record gains fields.
- Append EARS-075 → ~090 to `doc/SPECIFICATION.ears.md` (next id is **EARS-075**; highest existing is
  EARS-074). Update the footer "Highest existing ID" line.
- `skillsentry .` on this repo stays **PASS** (dogfood). SENTINEL/security-gate PASS.

**VALUE_HANDLERS required:** `handler-js` (sole handler — EARS, feature, TEST, IMPLEMENT, STORY).
**Reviewers invoked (from agent-roster):** SECURITY-REVIEWER (additive-only + lockfile-as-data boundary
+ transparency — expect at least one revision cycle here), plus the standard correctness/coverage
reviewers. SECURITY-REVIEWER is the load-bearing gate for this slice.

---

## Parallel Grouping

Single item, so parallelism is *within* the slice across `handler-js` workers. Build order is a DAG:

```
Round 0 (test-first foundation, parallel):
  - Step 7 GATING fixtures (benign-drift + laundering) — authored RED first
  - Step 1 lockfile schema + pure serialiser + extractCapabilitySet

Round 1 (after step 1 freezes the types):
  - Step 2 sha256 + lockfile IO (adapter)        ┐ parallel
  - Step 4 capability-set diff (pure core)       ┘ (different files; share only frozen types)

Round 2 (after 2 + 4):
  - Step 3 --approve CLI wiring          (needs 1+2)
  - Step 6 report surface (md+JSON)      (needs 4) — parallel with step 3

Round 3 (after 3 + 4 + 6):
  - Step 5 T3 temporal-pass wiring + additive-only fold (needs 1,2,4)

Round 4 (after all code green):
  - Step 8 ADR-008 + EARS + RULESET.md + dogfood
```

Two units are safely concurrent only if neither writes the same file and neither needs the other's
output mid-run. Steps 2 & 4 qualify (adapter vs core, share only the step-1 types). Steps 3 & 6 qualify
(cli.ts vs report.ts). Step 5 is the join point — it must run last among the code steps because it folds
everything at the edge.

---

## Load-Bearing Invariants (constraints the lifecycle MUST enforce)

These are non-negotiable. Each maps to a test the lifecycle cannot skip.

1. **Additive-only verdict = `max(freshScan, T3 signal)` — ENFORCED IN CODE, not convention.** The fresh
   deterministic T0/T1 scan always runs and sets the floor; drift findings are *added* before
   `aggregate`. A permissive `.skillsentry.lock` can never lower a HIGH verdict. → laundering test (step 5).
2. **Capability-fingerprint diff, NOT raw byte-hash.** Benign drift (hash changed, capability set
   unchanged) → **PASS** + note. Escalation (set grew) → **REVIEW/BLOCK**. Per-file hashes feed only the
   note, never a BLOCK on their own. → benign-drift fixture is the FP line (step 4/7).
3. **Transparency (R3 carry-over).** A lockfile can never silently suppress: any approved-HIGH finding or
   carried exclusion is disclosed in the report. Mirrors the `.skillsentryignore` rule exactly. → step 6
   disclosure tests.
4. **Zero new runtime deps.** sha256 via `node:crypto`; diff is pure structural. `dependencies` stays `{}`.
   → `package.json` assertion; CI pack-smoke.
5. **100% coverage floor** held at every step. → `npm run test:cov`.
6. **Deterministic · offline · never-execute · never-fetch.** Lockfile is data read, never executed
   (same boundary as R4 ruleset data / R3 ignore). `--approve` output byte-stable for a given state.
7. **Framework-mapped:** every T3 finding carries OWASP **ASI04** + a MITRE ATLAS id (reuse the
   supply-chain ATLAS id used by the cross-file taint rule unless a more specific one applies — keep the
   compile-time framework invariant satisfied).
8. **Type/registry widenings (additive):** `RuleTier` → add `'T3'`; new `DetectionClass` `'version-drift'`;
   new closed-registry builtin name `'lockfile-drift'`. Existing rules/tiers byte-unchanged.
9. **Layering (ADR-001):** lockfile parse/hash/IO in `src/adapters/*`; diff pure in `src/core/*`. No
   `node:fs`/`node:crypto` may leak into `core/*`. → ADR-001 guard assertion (step 2).
10. **Dogfood:** `skillsentry .` on this repo stays **PASS**; `.skillsentry.lock` self-excluded from its
    own enumeration/hashing.

---

## Gating Fixtures FIRST (highest-risk coordinates)

Per the handoff "risks/watch-items", these two fixtures are the highest-risk coordinates and MUST be
authored RED before the diff/fold code (steps 4, 5) is written — they *gate* the implementation:

1. **Benign-drift fixture (the FP line).** A target whose `.skillsentry.lock` is clean; the working tree
   has a doc edit / version bump / reordered files — **capability set identical**. Expected: **PASS** +
   "N files changed since approval" note. If capability-set equality is not robust to reorder/whitespace,
   this goes red and the whole differentiator becomes a false-positive machine. **Build this first.**
2. **Laundering fixture (additive-only).** A target shipping a permissive `.skillsentry.lock` that
   pre-approves a HIGH finding; the fresh scan still finds the HIGH. Expected: **BLOCK** (verdict not
   lowered) **+ disclosure** "lockfile approved N high-severity findings". Proves laundering is
   structurally impossible. **Build this second.**

The other three gate fixtures (step 7): escalation→BLOCK (tier T3 + file:line + ASI04/ATLAS + delta),
no-lockfile→byte-identical-to-today, `--approve`→byte-stable. The existing full corpus must stay
100%/≤10%-FP and `skillsentry .` must stay PASS.

---

## VALUE_HANDLER_POOL Required

- **`handler-js`** — sole handler. Staffs EARS authoring, feature/story definition, TEST units,
  IMPLEMENT units, and STORY (corpus) for every step. TS/Node project; no polyglot need.

## Missing Handlers (self-improvement flags)

**None.** `handler-js` covers the entire slice. No new VALUE_HANDLER is required.

## Self-Improvement Flags

- **Recurring SECURITY-REVIEWER pressure on transparency/additive invariants.** R3 (ignore disclosure),
  R4 (ruleset-as-data), R9b/R9b.1 (never-execute taint) and now R9d (additive-only + lockfile-as-data)
  all hinge on the same family of "data the tool reads, never executes; suppression is always disclosed"
  invariants. Flag for the SOLID covenant: the TEST-AGENT prompt for this codebase should *always* seed a
  laundering/suppression test and a `core/*` no-`node:*` assertion when a slice adds a new data artifact —
  it is a standing pattern, not a per-slice surprise.
- **New EARS family — temporal/stateful detection.** EARS-075+ introduces the first statements about a
  *prior approval baseline* (`WHEN a lockfile is present AND the capability set has grown, THE SYSTEM
  SHALL…`). No precedent exists in EARS-001–074 (all stateless/current-state). Flag a new EARS template
  for two-input temporal assertions so future temporal slices (e.g. signing) have a precedent.
- **No `IDEA_COST.jsonl` yet.** Eight slices have shipped with no cost history captured. Flag: start
  emitting `IDEA_COST.jsonl` rows on COMPLETE (ears_count, tokens_total, primary stack, tier) so
  estimation stops being pure heuristic.

---

## Resumption Instructions

A cold-start agent resuming this cycle (no conversation history) should:

1. **Read** `doc/idea/r9d-rugpull/{brief,smu-seed,first-slice,handoff}.md` and this file. Discovery is
   DONE — do **not** re-interrogate; both design forks (capability-fingerprint diff; additive-only) are
   resolved.
2. **Branch:** `slice/r9d-rugpull`. **Stack:** TypeScript/Node, vitest, eslint. **Gate commands:**
   `npm run build` · `npm run test:cov` · `npm run lint` · `npm run selfaudit`.
3. **Where things live now (verified 2026-06-07):**
   - Contracts: `src/core/types.ts` (`RuleTier='T0'|'T1'` — widen to add `'T3'`; `DetectionClass` — add
     `'version-drift'`; `AuditReport`/`Finding`/`ExclusionSummary` are the shapes to extend).
   - Engine `src/core/engine.ts` (per-file `scan`; T3 is NOT a Rule — wire the temporal pass at the edge).
   - Verdict `src/core/verdict.ts` (`aggregate` / `exitCodeFor` — additive-only fold adds findings here).
   - Report `src/core/report.ts` (`appendExclusions` is the R3 disclosure pattern to mirror).
   - Edge: `src/cli.ts` (`runAudit`, `parseArgs` — add `--approve`; fold drift here), `src/bin.ts`.
   - Adapters: `src/adapters/{acquire,enumerate,classify}.ts` — add `lockfile.ts` here (sha256 + read/write).
   - Tests: `tests/corpus/manifest.ts` (CORPUS oracle), `tests/story/corpus.story.test.ts`,
     `tests/integration/cli.integration.test.ts`.
   - Specs/docs: `doc/SPECIFICATION.ears.md` (next id **EARS-075**; highest existing EARS-074),
     `doc/RULESET.md`, `doc/architecture/` (add **ADR-008**; latest is ADR-007).
4. **Build in the Round 0→4 order** (§Parallel Grouping). **Author the two gating fixtures RED first**
   (§Gating Fixtures). Enforce all 10 invariants (§Load-Bearing Invariants); the laundering test and the
   `core/*` no-`node:*` assertion are mandatory.
5. **Definition of done** (from `first-slice.md`): all 5 brief success-gate fixtures green · full corpus
   100%/≤10%-FP · 100% coverage · 0 new runtime deps · SENTINEL/security-gate PASS · `skillsentry .` PASS
   · ADR-008 merged · ROADMAP R9d marked COMPLETE with the PR/merge ref. **On COMPLETE this unblocks the
   npm-publish gate** — publish is the next decision.
6. **On COMPLETE:** fold `smu-seed.md` into `doc/SUBJECT_MATTER_UNDERSTANDING.md`; emit the first
   `IDEA_COST.jsonl` row; review this plan vs actuals per the SOLID covenant.
