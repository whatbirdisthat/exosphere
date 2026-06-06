# R9d — First (and only) vertical slice

> The thin end-to-end increment FOUNDRY builds. R9d is itself already one slice; this names the
> build order so it stays vertical (CLI → core diff → report) and the FP/security gates are pinned
> test-first.

## The slice
`skillsentry <target> --approve` writes `.skillsentry.lock`; a later `skillsentry <target>` with that
lockfile present emits a T3 drift verdict. End to end, deterministic, offline, zero new deps.

## Build order (test-first; 100% coverage floor held at every step)
1. **Lockfile schema + writer (core + adapter).** Define the versioned `.skillsentry.lock` shape (capability
   set + per-file sha256 + verdict + exclusions). Pure serialiser in core; the file write + sha256 in the
   IO/adapter layer (ADR-001: core never imports `node:fs`/`node:crypto` — pass hashes in). Pin byte-stability.
2. **`--approve` CLI wiring.** Flag parses, runs a normal scan, persists the lockfile. Fixture: approve a
   clean target → byte-stable lock; re-approve identical state → identical bytes.
3. **Capability-set diff (pure core).** `diff(freshScan, lockfile) → DriftFinding[]`. Pure function over
   already-parsed records. Classify benign-drift / escalation / approval-invalidation. This is where the
   FP line lives — unit-test each class exhaustively.
4. **T3 temporal pass wiring.** After the T0/T1 engine produces the fresh result, if a lockfile was read,
   run the diff and fold `version-drift` findings in under the **additive-only** rule
   (`verdict = max(freshVerdict, driftVerdict)`). New `DetectionClass 'version-drift'`, `RuleTier 'T3'`,
   builtin `lockfile-drift`, OWASP ASI04 + ATLAS.
5. **Report surface (md + JSON).** Render the lockfile delta, the "N files changed since approval" note,
   and — load-bearing — the "lockfile approved N high-severity findings" disclosure.
6. **Corpus fixtures** (the success gate in `brief.md`): escalation→BLOCK, benign-drift→PASS+note,
   laundering→BLOCK+disclosed, no-lockfile→unchanged, byte-stable approve.
7. **ADR-008** recording: T3 tier; capability-fingerprint diff basis; additive-only invariant;
   lockfile-as-data security boundary; T3-before-T2 ordering rationale; git-ref `--since` rejected.
8. `skillsentry .` on this repo stays PASS (dogfood). Update `doc/RULESET.md` if the rule record gains
   fields. Security-gate PASS.

## Definition of done
All `brief.md` success-gate fixtures green · 100% coverage · 0 new runtime deps · SENTINEL PASS ·
`skillsentry .` PASS · ADR-008 merged · ROADMAP R9d marked COMPLETE with the PR/merge ref.
