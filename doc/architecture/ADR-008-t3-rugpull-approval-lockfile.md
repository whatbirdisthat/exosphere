# ADR-008: T3 temporal tier — rug-pull / version-diff via an approval lockfile

**Status:** Accepted
**Date:** 2026-06-07
**Roadmap item:** ROADMAP R9d (Tier 1d — T3 rug-pull / version-diff; the npm-publish gate)
**Spawning agent:** lifecycle-orchestrator (recording a design already settled at discovery parity)
**Supersedes/extends:** ADR-001 (pure-scan-core / never-execute), ADR-004 (tier-pluggable rule
record), ADR-005 (external declarative ruleset / data-not-code), **ADR-006 / ADR-007 (T1 shell
taint, intra- and cross-file)**. Every prior boundary is **unchanged**: the pure core never executes
and never fetches audited content; rule DATA stays inert; T0/T1 stay deterministic + offline.

> This ADR is a **recording** artifact, not a decision spawn. The two design forks (capability-
> fingerprint diff vs raw byte-hash; additive-only invariant vs signing) were resolved during the
> `/ideator` discovery pass — see `doc/idea/r9d-rugpull/{brief,smu-seed,first-slice,handoff}.md`. No
> open architectural question was re-litigated here.

## Context

skillsentry, like every incumbent one-shot scanner, only ever sees a target's **current** state. It
cannot answer the temporal question a defender actually has about a long-lived agent skill: *"this was
clean when I trusted it — is it still?"* The **rug-pull** is the supply-chain attack most specific to
agent skills: a skill is approved while clean, then mutated post-approval to gain dangerous capability
(a new `curl|sh` in `install.sh`, a broadened `Bash(*)` permission, a script that gains a sink, a new
hook). No stateless rule can catch it; the tool has no temporal axis.

Phase 2.5 ADR triggers all fire: R9d introduces a **new persistence mechanism** (`.skillsentry.lock`),
a **new bounded context** (temporal/approval state), and **modifies an existing boundary** (the
engine → verdict edge gains a target-level pass no `Rule` can express). The load-bearing questions:

1. **What is the diff basis** — what does "changed dangerously" mean without drowning in false
   positives on every benign edit?
2. **How is laundering prevented** — an attacker can ship a permissive lockfile alongside the mutation.
3. **Where does the temporal pass live**, given a `Rule` matcher only ever sees one current file?

## Decision

### 1 · Diff basis = the CAPABILITY FINGERPRINT, not a raw byte snapshot

`--approve` records, in `.skillsentry.lock`, the target's trust-relevant **capability SET**: the set of
T0/T1 findings projected to a stable structural key `(rule, detectionClass, severity, file, line)`,
plus each file's sha256, the approval verdict, and the disclosed `.skillsentryignore` provenance. The
diff keys on the **capability set**:

- **benign drift** — a per-file sha256 changed but the capability set is unchanged (a doc edit, a
  version bump, reordered files) → **PASS** + an informational "N file(s) changed since approval" note.
  No finding. *This is the false-positive line and it is the gating fixture (`benign-drift`).*
- **escalation** — the capability set GREW (a new sink/perm/hook/script/finding not in the baseline) →
  a `version-drift` finding, `tier: 'T3'`, OWASP **ASI04** + MITRE ATLAS **AML.T0011**, citing the
  escalated finding's `file:line` and the lockfile delta.
- **approval invalidation** — a file that carried an approved finding has changed bytes since approval
  → the approval of that file is re-surfaced (an approval is only as durable as the bytes it approved).

Raw byte-hash diffing was **rejected**: it trips on every benign edit, making the differentiator a
false-positive machine — exactly the failure mode the FP-line fixture is written RED-first to prevent.
The per-file sha256 is kept ONLY to drive the benign "changed since approval" note and the invalidation
case; it never BLOCKs on its own.

### 2 · Additive-only invariant — laundering is structurally impossible, ENFORCED IN CODE

`verdict = max(fresh T0/T1 scan, T3 drift signal)`. The fresh deterministic scan **always** runs and
sets the verdict floor; drift findings are only ever **added** to the finding list before `aggregate`.
A `.skillsentry.lock` can ADD a finding but can NEVER remove one or lower a verdict. This is not
convention — in `src/cli.ts` the fold is literally `aggregate([...freshFindings, ...drift.findings])`
over the union, which is exactly the max. A permissive/laundering lockfile that pre-approves a HIGH
finding therefore **cannot** lower the fresh HIGH BLOCK; and a lock that recorded approved-HIGH findings
is itself **disclosed** ("lockfile approved N high-severity finding(s)") in both report formats. The
`laundering` gating fixture proves this RED-first.

Cryptographically signed lockfiles were deferred (a later slice): additive-only already defeats
laundering, so signing is not on the critical path for R9d.

### 3 · T3 is NOT a `Rule` — it is a temporal pass at the engine/adapter edge

Every matcher signature (`detect(file)` / `detectCrossFile(file, files)`) sees only the **current**
file set. Drift needs two target-level inputs — `(freshScanResult, lockfile)` — that no `Rule`
signature can take. So T3 is **not** expressible as a rule and does **not** go through the ADR-005
compiler. Instead:

- the diff (`src/core/drift.ts`, `diffCapabilities`) is a **pure function over already-parsed records**
  (fresh findings + fresh hash map + parsed lock) — it lives in `core/*` and imports only `core/types`
  (+ the pure `core/lock`); it never touches `node:fs`/`node:crypto`/`child_process`/the network.
- the lockfile read/write and sha256 (`src/adapters/lockfile.ts`, `node:crypto` + `node:fs/promises`)
  live in the **adapter layer** (ADR-001). The byte-stable serialiser (`src/core/lock.ts`,
  `serialiseLock`) is pure; the bytes are written by the adapter.
- the pass is wired in `src/cli.ts` (the edge where IO inputs land): after `scan()` produces the fresh
  result, if a lockfile was read, compute the fresh hashes + capability set, `diffCapabilities`, and
  fold the drift findings in. Without a lockfile the pass is **inert** and the audit is byte-identical
  to a pre-R9d run.

An ADR-001 layering guard test (`src/core/__tests__/layering.test.ts`) asserts no `core/*` source
imports any `node:` builtin, so the boundary cannot silently erode.

### 4 · T3 ships BEFORE T2 — on purpose

The unbuilt semantic tier (T2) would require an LLM/parser and break the deterministic + offline +
never-execute invariants. T3 holds all of them (sha256 + pure structural diff), so it is a
**default-eligible** tier shipped now, while T2 remains an unbuilt opt-in gated at the adapter/CLI edge.
The tier-ordering is a capability decision, not a numeric one.

### 5 · `.skillsentry.lock` is DATA the tool reads, never executes

Same security boundary as the R4 ruleset data and the R3 ignore file. It is parsed with `JSON.parse`
(inert), never `eval`/`Function`/a shell; a malformed lock is treated as "no baseline" (the pass stays
inert), never a mid-audit throw. It is **self-excluded** from its own enumeration and from its own hash
set (it is the baseline, not audited content, and not part of its own fingerprint).

### Rejected alternatives

- **git-ref `--since` diffing** — rejected in favour of the offline, committed lockfile: it would
  require a git history (breaking the local-dir + offline posture) and couples trust to VCS state an
  attacker controls. The lockfile is a portable, offline, byte-stable baseline.
- **Raw byte-hash diff** — rejected: false-positives on every benign edit (see §1).
- **A signed/trusted lockfile for R9d** — deferred: additive-only already defeats laundering.
- **Expressing T3 as a `Rule`** — impossible: no matcher signature takes two target-level inputs (§3).
- **Reading sibling files / the lock from disk inside `core/*`** — rejected: it would put `node:fs`
  into the pure core, breaking ADR-001. IO stays at the adapter edge; the diff is pure.

## Consequences

| Layer | Path | Change |
|---|---|---|
| Domain types | `src/core/types.ts` | widen `RuleTier` → add `'T3'`; add `DetectionClass 'version-drift'`; add `Capability`/`CapabilitySet`/`LockFile`/`DriftFinding`/`DriftSummary`; `AuditReport.drift?` |
| Pure core | `src/core/lock.ts` (new) | `extractCapabilitySet` (the single fingerprint source of truth) + byte-stable `serialiseLock` |
| Pure core | `src/core/drift.ts` (new) | `diffCapabilities` — benign/escalation/invalidation classification + anti-laundering disclosure |
| Adapter | `src/adapters/lockfile.ts` (new) | `hashFiles` (sha256, self-excludes the lock), `readLock`/`writeLock` |
| Adapter | `src/adapters/enumerate.ts` | self-exclude `.skillsentry.lock` from the scan surface (mirrors the R3 ignore rule) |
| Edge | `src/cli.ts` | `--approve` flag; the additive-only fold + T3 temporal pass wiring |
| Report | `src/core/report.ts` | disclose the drift surface (changed-note, approved-HIGH, drift findings) in md + JSON |
| Versions | `src/core/ruleset.ts` | add `LOCKFILE_SCHEMA_VERSION = '1.0.0'` |
| Spec | `doc/SPECIFICATION.ears.md` | EARS-075–088 (the first temporal/two-input requirement family) |
| Docs | `doc/RULESET.md` | note T3/`version-drift` exists but is not a contributable `RuleSpec` |

### Zero new runtime dependency

sha256 via `node:crypto`; the diff and serialiser are pure structural operations. `dependencies` stays
`{}` — consistent with ADR-002–007 and the FOSS / no-backend trust thesis.

### Self-scan / dogfood

No `.skillsentry.lock` is committed to this repo, so the T3 pass is inert on `skillsentry .` (EARS-086)
and the dogfood audit stays **PASS** unchanged. The new pure-core and adapter sources contain no attack
patterns, so no `.skillsentryignore` change is required; the new `__tests__/` and `tests/integration/`
files fall under existing exclusion globs.

## Downstream instructions

- TEST-AGENT: author the two gating fixtures RED-first — **benign-drift** (bytes change, capability set
  unchanged → PASS + note) and **laundering** (a lock pre-approves a HIGH the fresh scan still raises →
  BLOCK + disclosure). Add escalation, approval-invalidation, no-lockfile, and byte-stable-approve
  coverage. Add the ADR-001 `core/*` no-`node:*` guard.
- IMPLEMENT-AGENT: keep `extractCapabilitySet` the single source of truth for both `--approve` and the
  diff; the fold MUST be a literal max over the finding union; the diff stays pure; IO stays in the
  adapter.
- STORY-AGENT: prove through the built CLI — `--approve` writes a byte-stable lock; a benign edit PASSes
  with the note; an escalation BLOCKs at tier T3 with ASI04; a laundering lock cannot lower the verdict
  and is disclosed; no lock is byte-identical to today. Dogfood `skillsentry .` stays PASS.

## Revision history

| Date | Change | Reason |
|---|---|---|
| 2026-06-07 | Initial decision | FOUNDRY cycle R9d — T3 temporal rug-pull / version-diff via the offline approval lockfile (the npm-publish gate) |
