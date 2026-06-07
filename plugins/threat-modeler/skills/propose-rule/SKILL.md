---
name: propose-rule
description: Draft a new deterministic skillsentry detection rule from a gap and open a PR for human review. Use after the gap ritual when the user wants to actually CLOSE a coverage gap — "add a rule for X", "propose the next rule", "close the publisher-spoofing gap", "implement the DoS detection". Authors RuleSpec data + fixtures + corpus, runs every gate, and opens a PR. It NEVER self-merges and NEVER weakens a test — the covenant proposes, the deterministic core + a human dispose.
---

# propose-rule — the covenant's act step

Turn a confirmed gap (from `doc/threat-model/gaps.json`) into a deterministic, zero-dependency,
never-executing rule and open a PR. Binding governance: `knowledge/covenant-governance.md`.

## The rule you cannot break
> The covenant proposes; the deterministic core + a human dispose.

Open a PR on a branch. Never self-merge. Never weaken, skip, or delete a test, the precision budget, or
the layering / threat-map / wall invariants. If a draft rule cannot pass the gates honestly, tighten the
rule — do not loosen the gate.

## Procedure
1. **Pick** the highest-priority unshipped gap from `gaps.json` (or the one the user names). Verify it is
   static · pre-execution · deterministic · never-executing. Reject runtime/network/parser/LLM-semantic
   candidates and record why.
2. **Branch**: `slice/rule-<class>`.
3. **Author the data** following `src/core/rules/dangerous-bash.rules.ts`: a `RuleSpec[]` with framework
   `{ owasp, atlas, stride|axis }`, a matcher, pass/fail fixtures, and a `precisionBudget` (prefer 0). For
   a new class, extend the `DetectionClass` union (`src/core/types.ts`), register it in
   `src/core/ruleset.ts`, and bump `RULESET_VERSION`. Add corpus fixtures + `tests/corpus/manifest.ts`
   entries (malicious BLOCK + benign near-miss PASS).
4. **Gate** (all green, see covenant-governance.md): `npm run build && npm run test:cov && npx vitest run
   tests/story && node dist/bin.js .`, then `npm run build:plugin` to re-sync the vendored CLI.
5. **Update the ledger**: mark the gap `SHIPPED` in `gaps.json`, refresh `GAP_ANALYSIS.md` with the new
   coverage matrix (`node plugins/threat-modeler/scripts/coverage-matrix.mjs`).
6. **Open the PR** with `gh` — describe the gap closed, the matrix delta, and the evidence. Hand back to
   the human. Do not merge.

## Today's next target
The two P1 ABSENT cells (D, R) are shipped. The next-highest gap is **P2 · S — `publisher-spoofing`**
(the THIN Spoofing cell): typosquat names, false provenance, MCP tools mimicking a built-in. It needs a
small shipped popular-name allow-list and a vetted builtin matcher (closed registry) — no network.
