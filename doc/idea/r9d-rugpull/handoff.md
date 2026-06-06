# R9d — Handoff contract (→ FOUNDRY)

> Human-readable intent + machine-checkable exit gate for the discovery→specification boundary.
> Partner downstream: FOUNDRY `/foundry:foundry` (EARS → feature → test → implement → story).

## What is being handed off
A fully-scoped, pressure-tested detection slice: **T3 rug-pull / version-diff via an approval lockfile.**
Design is settled and the two FP/security forks are resolved (capability-fingerprint diff; additive-only
invariant). No further product decisions are open — FOUNDRY proceeds straight to EARS.

## Artifacts
- `brief.md` — problem · actors · scope · success · constraints · resolved questions.
- `smu-seed.md` — domain delta (rug-pull, capability fingerprint, lockfile, T3 tier, invariants table,
  the "T3 is not a Rule" architectural fact).
- `first-slice.md` — test-first build order + Definition of Done.
- This file — exit gate + downstream instructions.

## Risks / watch-items for the builder
- **The FP line (highest risk).** Capability-set equality must be robust to benign reorder/whitespace/doc
  edits. Build the benign-drift near-miss fixtures FIRST and let them gate the diff implementation.
- **Layering (ADR-001).** Lockfile parsing/hashing is IO → adapter layer; the diff is pure → core. Do not
  leak `node:fs`/`node:crypto` into `core/*`.
- **Additive-only must be enforced in code, not convention** — the fold step must be a literal
  `max(freshVerdict, driftVerdict)`; add a test that a permissive lockfile cannot lower a HIGH verdict.
- **ATLAS id** — reuse the supply-chain technique id already used by the cross-file taint rule unless a
  more specific one applies; keep the framework-mapping compile-time invariant satisfied.

## EXIT GATE (verified ✅ — discovery → specification)
- [x] **Actionable problem** — the rug-pull; stateless scanners can't see it.
- [x] **Named actors** — author, consumer/CI, attacker.
- [x] **Explicit scope** — IN/OUT enumerated; git-ref diffing, signing, hosted policies, T2 all OUT.
- [x] **Concrete constraints** — additive-only, capability-fingerprint, transparency, deterministic/offline/
      zero-dep; all load-bearing and testable.
- [x] **Testable success** — 5 corpus fixtures + coverage/FP/dep/dogfood gates in `brief.md`.
- [x] **Open questions resolved-or-accepted** — both forks resolved; signing explicitly deferred.

## Downstream instructions
1. FOUNDRY ingests `ROADMAP.md` → R9d (Tier 1d) as the active P0 slice; this package is its discovery input.
2. Author **EARS** (extend the EARS-074 range), then `.feature`, then failing tests (esp. the benign-drift
   and laundering fixtures), then implement minimally, then story-level proof through the CLI.
3. Land **ADR-008** as part of the slice (see `first-slice.md` step 7).
4. On green: mark ROADMAP R9d COMPLETE with merge ref; this **unblocks the npm-publish gate** — publish is
   the next decision once R9d ships.

*Light is green, trap is clean — R9d is go for the conveyor.* 🟢
