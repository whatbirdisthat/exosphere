# R2 PLAN — author self-audit + README trust-badge

> Per-item plan for ROADMAP **R2**, driven by lifecycle-orchestrator through SDLC steps 0–9 + STORY.
> Extends R1 (the `exosphere-audit` CLI) and R3 (`.exosphereignore` self-exclusion). Source of truth:
> ROADMAP R2, `doc/SUBJECT_MATTER_UNDERSTANDING.md`, `doc/SPECIFICATION.ears.md` (EARS-032+),
> ADR-001 (pure-core boundary), ADR-002 (R3 ignore matcher, embedded in `exosphere-audit-r3_PLAN.md`).
> Governance: `.foundry/governance.md` — **pr-approval** (open a PR, never self-merge); Vitest + v8
> **100% coverage floor** (stmts/branches/funcs/lines).

## Branching (stacked PR)

- Branch `slice/r2-author-badge` is cut **off `slice/r3-exosphereignore`** (NOT off `main`), because R2
  depends on R3 (the author's own repo can only earn a PASS to badge once `.exosphereignore` exists).
- The PR base is set to `slice/r3-exosphereignore` so the diff shows ONLY R2's changes. When the human
  merges R3, GitHub auto-retargets this PR to `main`.

## Naming decision (binding, from the user)

- KEEP the placeholder name `exosphere-audit`. Do NOT rename anything. Badge text is
  **"audited by exosphere-audit"**.

## Objective

A skill/plugin author self-audits their repo and earns a shareable, **offline, deterministic** trust
signal:

- `exosphere-audit . --badge` → on a **PASS** verdict, emit a byte-stable badge snippet the author
  pastes into their README: a **Markdown** snippet (`![audited by exosphere-audit](<inline data-URI svg>)`)
  AND the raw **SVG** source. On **REVIEW** or **BLOCK**: emit **NO badge** + a clear one-line reason
  (and keep the normal report + exit code).
- `--ci` convenience flag for an author's GitHub Action: non-zero exit gates the PR; respects the R3
  `.exosphereignore` (and `--no-ignore` still overrides). Flag interactions stay coherent and tested.
- **Transparency carry-over (load-bearing):** a PASS achieved via `.exosphereignore` exclusions MUST
  still surface the exclusion disclosure — a badge must not launder a hidden exclusion.

## Architecture — embedded ADR-003

### ADR-003: README trust-badge — pure-core, hand-generated static SVG, zero new runtime deps

**Status:** Accepted · **Date:** 2026-06-06 · **Roadmap item:** R2
**Spawning agent:** lifecycle-orchestrator (embodying handler-architect)
**Extends:** ADR-001 (Pipeline + thin Hexagonal pure-scan-core), ADR-002 (R3 ignore matcher)

#### Context

R2 adds two CLI surfaces — `--badge` (emit a README badge on PASS) and `--ci` (a convenience that
gates a GitHub Action). Two decisions warrant a record: (1) **whether to add an SVG/badge npm
package**, and (2) **where badge generation lives** relative to the ADR-001 pure/adapter boundary.
Load-bearing product constraints: the badge must be **deterministic / byte-stable** for a given
verdict (so two runs of the same repo produce an identical snippet — testable), **offline** (no
hosted/dynamic endpoint, consistent with the FOSS/zero-backend posture), and it must **not launder a
hidden exclusion** (a PASS earned via `.exosphereignore` still discloses the exclusion).

#### Decision

1. **No new runtime dependency.** R1+R3 shipped with **zero runtime dependencies**; R2 keeps that
   posture. The badge SVG is **small and static** — hand-generate it as a template string. An SVG/
   badge library (e.g. `badge-maker`) would add a runtime dep purely to format ~12 lines of static
   XML, contradicting the zero-runtime-dependency pillar for no real benefit. The badge embeds **no
   author-controlled text** (fixed label "audited by", fixed message "exosphere-audit"), so there is
   **no XML-injection surface** to delegate to a library.
2. **Badge generation is pure** (IO-free), in `src/core/badge.ts`, depending on `core/types` only. It
   takes the `AuditReport` (verdict + exclusions) and returns a typed `BadgeResult`:
   - on PASS → `{ kind: 'badge', svg, markdown }` (raw SVG source + a Markdown snippet whose `src` is
     an inline `data:image/svg+xml;base64,…` data-URI, so the README needs **no hosted endpoint** and
     **no committed image file** — fully self-contained and offline).
   - on REVIEW/BLOCK → `{ kind: 'no-badge', reason }` (a single clear line naming the verdict and why
     no badge was issued).
   - Determinism: the SVG is computed **only** from the verdict (the sole input that varies a PASS
     badge — and a PASS badge is always the same green "audited by exosphere-audit"); base64 of a
     fixed byte string is itself fixed. No timestamps, no randomness, no environment reads.
3. **`--badge` and `--ci` are CLI-adapter concerns.** `src/cli.ts` parses the flags, runs the existing
   pipeline (acquire → enumerateWithIgnore → scan → aggregate → render), then:
   - `--badge`: append the badge block (or the no-badge reason) to the existing report output.
   - `--ci`: a convenience that selects a terse CI-oriented output line while preserving the exact
     existing exit-code contract (non-zero only on BLOCK). `--ci` honours `.exosphereignore` by
     default (it just runs the normal pipeline) and `--no-ignore` still overrides it.
4. **Transparency carry-over is structural, not bolted-on.** `--badge` renders the SAME report (which
   already discloses exclusions per ADR-002 / EARS-029) and THEN the badge. The disclosure cannot be
   suppressed by `--badge` because it is produced by the unchanged report renderer upstream of the
   badge block.

#### Why no badge/SVG package

- The artefact is ~12 lines of static, injection-free XML with two fixed strings. A dependency buys
  nothing and costs the zero-runtime-dependency posture (a stated pillar + a thing the auditor itself
  would flag as supply-chain surface).
- A hand-written SVG is trivially **deterministic** and **offline** — both are hard product
  constraints; a library's output formatting could drift across versions and break byte-stability.

#### Consequences

| Layer | Path | Owns | Depends on |
|---|---|---|---|
| Badge core (pure) | `src/core/badge.ts` | `AuditReport` → `BadgeResult` (SVG + markdown data-URI, or no-badge reason) | `core/types` |
| Domain types | `src/core/types.ts` | add `BadgeResult` union | nothing |
| CLI adapter | `src/cli.ts` | parse `--badge` / `--ci`; compose report + badge / no-badge; preserve exit-code contract | all above |

Dependency rule (unchanged from ADR-001): `core/badge.ts` imports `core/types` only; never `node:*`
or adapters. `--badge`/`--ci` argv parsing and output composition are adapter (CLI) concerns.

#### Rejected alternatives

- **`badge-maker` / `shields.io`-style endpoint** — rejected: a runtime dep (badge-maker) or a hosted
  dynamic endpoint (shields). Both violate zero-runtime-dependency / zero-backend. The badge here is
  fixed-content; no dynamic rendering is needed.
- **A committed `.svg` file + a relative-path markdown link** — rejected: it forces the author to
  commit a binary-ish asset and keep it in sync; the inline data-URI is self-contained and copy-paste
  friendly, and stays byte-stable.

#### Revision history

| Date | Change | Reason |
|---|---|---|
| 2026-06-06 | Initial decision | FOUNDRY cycle R2 |

## SDLC checklist (0–9 + STORY)

- [ ] **Step 0 — Plan:** this doc + ADR-003; DoD addendum for R2; resumption section. → `PLAN_COMPLETE`
- [ ] **Step 1 — EARS:** EARS-032+ for `--badge` (PASS emits / REVIEW-BLOCK suppresses), determinism,
      transparency carry-over, `--ci` gating + ignore interaction. EARS/SMU reviewer PASS. → `EARS_COMPLETE`
- [ ] **Step 2 — Feature docs:** ≥3 Gherkin scenarios per EARS family incl. the abuse case (an author
      badging a repo that only PASSes because a malicious `.exosphereignore` hid a finding — the
      disclosure defeats it). BDD reviewer PASS. → `FEATURE_COMPLETE`
- [ ] **Step 3 — Tests:** unit (badge core) + integration (CLI flags) + extend the story suite. RED for
      feature-gap reasons. TEST-DESIGN reviewer PASS. → `TESTS_WRITTEN::RED`
- [ ] **Step 4 — First run:** gap map; red reasons classified feature-gap vs infra. → `GAP_MAP_COMPLETE`
- [ ] **Step 5 — Implementation:** `core/badge.ts` + CLI wiring; minimal to green. DESIGN reviewer PASS.
      → `IMPL_COMPLETE::GREEN`
- [ ] **Step 6 — Green run:** full suite green; line=branch=funcs=stmts=100%; no R1/R3 regressions.
      REGRESSION reviewer PASS. → `GREEN_RUN_COMPLETE`
- [ ] **Step STORY:** built CLI over fixtures proves `--badge` (PASS emits byte-stable md+svg over two
      runs), BLOCK fixture (no badge + reason + non-zero exit), `--ci` gating, and exclusion disclosure
      when a badge is earned via ignores. Perf-delta sample. → `STORY_PROVEN`
- [ ] **Step 7 — Sync:** branch synced; tests re-run green. → `SYNC_COMPLETE`
- [ ] **Step 8 — Commit message:** WHY/WHAT/TESTING/ROADMAP. → `COMMIT_MSG_READY`
- [ ] **Step 9 — Commit/push + PR:** SENTINEL `/security-gate` PASS; push; open PR with base
      `slice/r3-exosphereignore`; ROADMAP R2 → AWAITING MERGE. → `DELIVERY_COMPLETE`

## Resumption

- If interrupted: re-read this plan + `doc/SPECIFICATION.ears.md` (R2 section) +
  `doc/spec/features/exosphere-audit.feature` (R2 section) to recover state. The branch
  `slice/r2-author-badge` carries all work; `git log slice/r3-exosphereignore..HEAD` shows R2-only
  commits. Baseline before R2: 128 tests, 100% coverage.

## Out of scope (do NOT build)

- Hosted/dynamic badge endpoint; public registry (parked platform play, R7).
- Renaming `exosphere-audit` (binding user decision: keep the name).
- DEPLOY/VERIFY — pure library/CLI; the line ends at DELIVERY.
