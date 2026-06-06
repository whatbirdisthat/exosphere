---
name: project-exosphere
description: exosphere-audit project — binding governance, test stack, and the R1 dogfood/corpus-exclusion residual for R3
metadata:
  type: project
---

exosphere is a FOUNDRY-built FOSS CLI (`npx exosphere-audit`) — a static supply-chain
auditor for Claude Code skills/plugins. R1 (first vertical slice) shipped to a PR
(AWAITING MERGE) on branch `slice/exosphere-audit-v1`.

**Binding governance** (`.foundry/governance.md`): merge-mode = **pr-approval** — never
self-merge to main; build, pass the reviewer panel + SENTINEL security-gate, then open a PR
for the human. Test-runner = **Vitest + v8 coverage, 100% line+branch floor** (non-negotiable).
ADR required for cross-boundary work. npm package name is a placeholder until publish.

**Why:** the user decided pr-approval on 2026-06-06; the product's whole thesis is trust, so
the 100% floor and security-gate are load-bearing, not ceremony.

**How to apply:** any future cycle (R2–R7) drives through the same lifecycle-orchestrator loop,
holds at AWAITING MERGE under pr-approval, and must keep the 100% coverage floor.

**R3 SHIPPED (2026-06-06):** `.exosphereignore` self-exclusion convention delivered to PR #2
(AWAITING MERGE) on branch `slice/r3-exosphereignore`. Resolves the R1 self-scan residual:
`exosphere-audit .` now PASSes. Key design choice recorded in ADR-002 (embedded as a section in
`doc/exosphere-audit-r3_PLAN.md`, NOT a standalone `doc/architecture/ADR-002-*.md` file — R3's
convention is plan-doc-embeds-ADR): the gitignore-subset matcher is in the **pure core**
(`src/core/ignore.ts`) with **ZERO new runtime deps** — rejected the `ignore` npm package because
a security auditor's own dep tree is attack surface. The transparency invariant is load-bearing —
an exclusion must ALWAYS be disclosed in md+JSON (`AuditReport.exclusions`); `--no-ignore`
re-surfaces hidden findings.

**R9a MERGED (2026-06-06):** PR #4 merged (`b931538`). Branch `fix/ci-build-order` (PR #5, base main,
OPEN) is stacked on the merged R9a and reorders CI to build BEFORE tests (story suite needs `dist/bin.js`).
So `fix/ci-build-order` carries the full R1+R3+R2+R9a codebase + the CI fix — base new slices off ITS tip.

**R4 SHIPPED (2026-06-06):** externalise the community ruleset. PR #6 (AWAITING MERGE), **STACKED on
`fix/ci-build-order`** (branch `slice/r4-external-ruleset`, base = the fix branch so CI is green;
auto-retargets to main when PR #5 merges). Rules moved from compiled scanner code into declarative DATA:
`src/core/rules/*.rules.ts` = `RuleSpec[]` + a CLOSED registry of named structural matchers
(`src/core/matchers/builtins.ts`, the 8 rules needing structure) compiled by `src/core/compile.ts`.
**The ruleset is DATA, never code** — no eval/Function/dynamic-require of rule content (ADR-005 STANDALONE,
EARS-051); a `line-pattern` only ever compiles to a matching RegExp, a `builtin` only selects a vetted fn.
Behaviour-preserving: **parity proven** vs a committed baseline oracle (`tests/corpus/parity-baseline.json`)
finding-for-finding across all 18 fixtures. **Precision-budget guard** is mechanical (per-rule pass/fail
fixtures + per-rule corpus-FP ≤ budget, with a deliberately-loose-rule catch proving it bites). Two
versions: `RULESET_SCHEMA_VERSION` (1.0.0) + `RULESET_VERSION` (0.3.0); contribution workflow in
`doc/RULESET.md`. ZERO new runtime deps. Self-scan PASS — `.exosphereignore` updated `src/core/scanners/**`
→ `src/core/rules/**` + `src/core/matchers/**`. 241 tests / 100% cov. EARS 048–057 used; next is EARS-058.
**How to apply:** the old `src/core/scanners/**` modules + `match-helpers.ts` are GONE; rules live in
`src/core/rules/` (data) + `src/core/matchers/` (builtins). Adding a rule = data-only unless it needs a new
builtin (a code change). decode.ts moved to `src/core/matchers/decode.ts`.

**R9a (history):** detection breadth on branch `slice/r9a-detection-breadth` (off main
`c5916f5`). Three additions, all tier **T0** (deterministic+offline): (1) framework mapping — every rule
carries `tier`+`framework{owasp,atlas}`, surfaced per-finding md+JSON; (2) encoding-evasion on
prompt-injection (homoglyph normalise, base64/hex decode, ANSI line-jump — all decode in PURE STRING
SPACE, never an exec sink); (3) NEW `tool-description-poisoning` class (SKILL/agent frontmatter
`description:` + MCP tool descriptions). **ADR-004 is STANDALONE** (`doc/architecture/ADR-004-*.md`) —
records the tier-pluggable rule record: `RuleTier='T0'` union is the opt-in-T2 extension point (widen
union + edge-gate later, no rule/engine rework); required `framework` field makes mapping coverage a
compile-time invariant. **ZERO new runtime deps** (Buffer/regex/stdlib only). 188 tests / 100% cov,
corpus 100%/0%-FP across 18 fixtures, self-scan PASS (no `.exosphereignore` change — new files fall
under existing globs). EARS 039–047 used; next is EARS-048. R4 (externalise ruleset) is BLOCKED-BY R9a.

**R2 SHIPPED (2026-06-06):** author self-audit + README trust-badge delivered to PR #3
(AWAITING MERGE), **STACKED on `slice/r3-exosphereignore`** (branch `slice/r2-author-badge`, PR
base = the R3 branch so the diff is R2-only; auto-retargets to main when R3 merges). `--badge`
emits a deterministic/offline/byte-stable trust badge (md data-URI + raw SVG) on PASS, no-badge+
reason on REVIEW/BLOCK; `--ci` gates on BLOCK. ADR-003 (embedded in `doc/exosphere-audit-r2_PLAN.md`):
badge core is pure (`src/core/badge.ts`), **ZERO new runtime deps** — hand-generated static SVG,
rejected a badge/SVG package. Load-bearing: a badge can't launder a hidden `.exosphereignore`
exclusion (disclosure carries over). 151 tests / 100% coverage. EARS continues at EARS-039 next.
**How to apply:** the zero-runtime-dep posture now holds across R1+R3+R2 — keep it for R4+.

**Environment note (CORRECTED):** the `sentinel` companion plugin **IS** installed
(`/home/user/.claude/plugins/cache/idea-to-production/sentinel/1.1.0/`) — run the real
`/security-gate` (3 lenses: secret-scan, dependency-audit, pii-audit), NOT an inline substitute.
ESLint is NOT installed; the `lint` npm script has no binary — `tsc --noEmit` (`npm run typecheck`)
is the binding type gate. Untracked `.claude/` and `docs/marketing/` are out-of-scope; never stage
them (stage R2/R3 files explicitly, never `git add .`).
