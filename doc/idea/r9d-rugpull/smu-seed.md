# R9d — SMU-seed (domain understanding delta)

> Extends `doc/SUBJECT_MATTER_UNDERSTANDING.md` with the temporal-detection concepts R9d introduces.
> Agent-facing. Read alongside `brief.md` and `first-slice.md`.

## New domain concepts

### The rug-pull (the threat)
A skill is approved while clean, then mutated post-approval to gain dangerous capability. The defender's
question is temporal: *"what changed since I trusted this?"* — unanswerable by a stateless scan. R9d adds
the missing axis. Framework: OWASP **ASI04** (Agentic Supply-Chain Compromise); MITRE ATLAS technique id
to be assigned per the existing per-rule mapping convention (reuse the supply-chain ATLAS id already used
by the cross-file taint rule unless a more specific one fits).

### Capability fingerprint (the baseline content)
NOT a raw byte snapshot. The trust-relevant **capability SET** of a target at approval time:
- the set of T0/T1 findings (rule id + class + severity + file:line) present at approval;
- declared capability surface: permission allow-lists, MCP scope combinations, hook commands, the
  inventory of bundled scripts;
- per-file sha256 (kept ONLY to detect "content changed since approval" and surface it as a note);
- the approval verdict and disclosed `.skillsentryignore` exclusions.
Diffing keys on the **capability set**, so a doc edit (hash changes, set unchanged) is benign drift, while
a new sink/perm/hook (set grows) is escalation.

### `.skillsentry.lock` (the artifact)
A deterministic, byte-stable, schema-versioned JSON file at the target root, written by `--approve`,
committed by the author. It is a **second viral artifact** (cf. the R2 badge) and a recurring CI ritual.
It is self-excluded from enumeration/hashing. It is **data the tool reads, never executes** — same
security boundary as the externalised ruleset (R4) and `.skillsentryignore` (R3).

### T3 — the temporal tier
`RuleTier` widens `'T0'|'T1'` → add `'T3'` (the ADR-004 extension point, used as designed). **T3 ships
before T2 on purpose:** T3 holds the deterministic/offline/never-execute invariant, whereas the semantic
T2 would break it — so T3 is a default-eligible tier, T2 remains an unbuilt opt-in. Note this ordering in
the new ADR.

## Load-bearing invariants (do not violate)

| Invariant | How R9d honours it |
|---|---|
| **Additive-only** | `verdict = max(fresh scan, T3 signal)`. The lockfile can ADD findings, never subtract. The fresh deterministic scan always runs and sets the floor. |
| **Anti-laundering** | Follows from additive-only: a permissive lockfile cannot suppress a fresh HIGH finding. A lockfile that recorded approved-HIGH findings is itself disclosed. |
| **Low-FP** | Capability-fingerprint diff (not raw hash); benign drift → PASS + note. New benign-drift near-miss fixtures pin the line. |
| **Transparency (R3)** | The lockfile cannot silently suppress; exclusions and approved-HIGH are always disclosed. |
| **Deterministic / offline / never-execute** | sha256 (`node:crypto`) + pure structural diff over in-memory records. No fetch, no exec, no new runtime dep. |

## Architectural fact (surfaced by the ideate pressure-test)
T3 is **not** expressible as a `Rule`. Every existing matcher (`detect` / `detectCrossFile`,
`src/core/types.ts`) only sees the **current** file set. Drift needs `(freshScanResult, lockfile)` — two
inputs, target-level, not per-file. So T3 is a **new temporal pass** computed after the T0/T1 engine
produces the fresh result, wired at the engine/adapter edge where the lockfile (an IO input) is read.
The lockfile read lives in the IO/adapter layer (per ADR-001 the pure `core/*` never touches `node:fs`);
the diff logic is pure and lives in core, taking already-parsed records.
