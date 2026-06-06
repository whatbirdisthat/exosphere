# R9d — Rug-pull / version-diff (T3) · BRIEF

> Agent-facing brief for the R9d slice. Refined to knowledge-parity 2026-06-07 via `/ideator:ideate`.
> Source of truth for scope: `ROADMAP.md` → "Tier 1d — NEXT SLICE". This brief satisfies FOUNDRY's
> discovery exit criteria.

## Problem (actionable)
A skill/plugin a user audited and approved as clean can **mutate later** to gain dangerous capability —
a new `curl|sh` in `install.sh`, a broadened `Bash(*)` permission, a script that gains a sink, a new
hook. One-shot scanners (skillsentry today, and every incumbent) only ever see the **current** state, so
they cannot tell *"this was clean when you trusted it and is dangerous now."* This is the **rug-pull**,
and it is the supply-chain risk most specific to long-lived agent skills. skillsentry has no temporal
axis today.

## Actors (named)
- **Skill/plugin author** — runs `skillsentry <target> --approve` once a target is trusted, commits the
  resulting `.skillsentry.lock` alongside the skill.
- **Consumer / CI pipeline** — runs `skillsentry <target>` in CI; with a lockfile present, gets the T3
  drift verdict on every run ("has anything I trusted changed?").
- **Attacker** — ships a malicious mutation after approval, and/or ships a permissive `.skillsentry.lock`
  attempting to launder a BLOCK. Both must fail (see constraints).

## Scope (explicit)
**IN:**
- `skillsentry <target> --approve` writes a deterministic, byte-stable **`.skillsentry.lock`** at the
  target root capturing the **capability fingerprint** (the decided diff basis — see SMU-seed): the
  detection/capability SET (current findings + declared perms/allow-lists + MCP scope combos + bundled-
  script inventory + hooks), each file's sha256 (`node:crypto`), the approval verdict, and disclosed
  `.skillsentryignore` provenance. Schema-versioned.
- A subsequent `skillsentry <target>` with a lockfile present runs the **T3 temporal pass**: re-scan
  fresh, diff the **capability set** against the lockfile, classify mutations:
  - **benign drift** (file hash changed, capability set unchanged — doc edit, version bump, reorder) →
    **PASS**, disclosed as an informational note ("N files changed since approval").
  - **capability escalation** (the set GREW — new sink/perm/hook/script) → **REVIEW/BLOCK**, `tier:'T3'`,
    OWASP **ASI04** + MITRE ATLAS, citing the escalated file:line + the lockfile delta.
  - **approval invalidation** (a file that previously carried an accepted finding changed) → re-surface.
- New `DetectionClass` `version-drift`; new closed-registry builtin `lockfile-drift`; `RuleTier` widened
  `'T0'|'T1'` → add **`'T3'`**.
- `.skillsentry.lock` is self-excluded from its own hashing/enumeration.

**OUT:**
- git-ref `--since` diffing (rejected in favour of the offline lockfile).
- Cryptographically signed/trusted lockfiles (a later slice — additive-only already defeats laundering).
- Hosted/remote baseline trust policies. The T2 semantic tier. Auto-remediation.

## Success (testable)
New corpus fixtures, all holding the existing gates:
1. approved-then-escalated target (lockfile clean → adds reverse shell) → **BLOCK**, tier T3, correct
   file:line, OWASP ASI04 + ATLAS, lockfile delta shown.
2. benign drift (doc edit / version bump / reordered files, capability set identical) → **PASS** with the
   "changed since approval" note. ← the false-positive line that must hold.
3. permissive/laundering lockfile (pre-approves a HIGH finding) → the fresh scan **still BLOCKs**, and the
   report **discloses** "lockfile approved N high-severity findings". Lockfile never lowers a verdict.
4. no lockfile present → behaviour byte-identical to today (T3 is inert without a baseline).
5. `--approve` output is byte-stable for a given target state.
Plus: full corpus 100%/≤10%-FP; **100% coverage floor held**; **zero new runtime deps**; `skillsentry .`
on this repo stays PASS.

## Constraints (concrete, load-bearing)
- **Additive-only invariant:** `verdict = max(fresh T0/T1 scan, T3 drift signal)`. The lockfile can ADD a
  finding, **never subtract one.** A HIGH finding from the fresh deterministic scan BLOCKs regardless of
  any lockfile — so laundering a BLOCK through a permissive lockfile is **structurally impossible**.
- **Capability-fingerprint diff basis** (not raw byte-hash): benign content drift must not BLOCK.
- **Transparency (R3 carry-over):** a lockfile cannot silently suppress; any approval-of-HIGH or any
  exclusion it carries is disclosed in the report. Mirrors the `.skillsentryignore` security rule exactly.
- **Invariants unchanged:** deterministic · offline · never-execute · never-fetch · zero new runtime deps
  (sha256 via `node:crypto` + structural diff only).

## Open questions — RESOLVED
1. Diff basis → **capability fingerprint** (raw-hash rejected: trips on every benign edit). ✅
2. Anti-laundering → **additive-only invariant** (signing deferred to a later slice). ✅
3. Architecture → T3 is **NOT a `Rule`** (matchers only see current state); it is a new temporal pass over
   `(freshScanResult, lockfile)` wired at the engine/adapter edge. ✅ (see SMU-seed + first-slice)
