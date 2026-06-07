---
description: Draft a new deterministic detection rule from a gap and open a PR — the covenant's act step (never self-merges).
argument-hint: "[candidateClass from gaps.json, e.g. publisher-spoofing] (defaults to the top unshipped P-priority gap)"
allowed-tools: Bash(node:*), Bash(npm:*), Bash(git:*), Bash(gh:*), Read, Write, Edit, Glob
---

# /threat-modeler:propose-rule

Turn a gap into a deterministic rule and open a PR. This is the covenant's **act** step. Read
`knowledge/covenant-governance.md` first — it is binding.

> The covenant proposes; the deterministic core + a human dispose. You open a PR; you NEVER self-merge.

## 1 — pick the gap
Read `doc/threat-model/gaps.json`. Use `$1` if given, else the highest-priority gap whose `status` is
not `SHIPPED`/`PARKED`. Confirm it is static · pre-execution · deterministic · never-executing — if it
needs runtime, network, a parser dependency, or LLM semantics, STOP (it breaks the pillars; record why).

## 2 — branch
```bash
git checkout -b "slice/rule-$1"
```

## 3 — draft the rule as DATA
Follow the template in `src/core/rules/dangerous-bash.rules.ts`. Create
`src/core/rules/<class>.rules.ts` exporting a `readonly RuleSpec[]`, each with: id, detectionClass,
severity, tier, `framework { owasp, atlas, stride|axis }`, why, matcher (line-pattern or a vetted
builtin), **passFixtures + failFixtures**, and `precisionBudget` (prefer 0 — be precision-first). If the
class is new, add it to the `DetectionClass` union in `src/core/types.ts` and register the module in
`src/core/ruleset.ts`, bumping `RULESET_VERSION`. Add malicious + benign near-miss fixtures under
`tests/corpus/` and entries in `tests/corpus/manifest.ts`.

## 4 — pass every gate (see covenant-governance.md)
```bash
npm run build && npm run test:cov && npx vitest run tests/story && node dist/bin.js .
npm run build:plugin   # keep the vendored auditor CLI in sync (the wall)
```
All must be green and the self-audit must PASS. If a rule is too loose (corpus FP > budget), TIGHTEN it
— never widen the budget to pass.

## 5 — update the ledger + open the PR
Mark the gap `SHIPPED` in `gaps.json` and refresh `GAP_ANALYSIS.md` (re-run the coverage matrix).
Commit, push, and open a PR with `gh` describing the gap closed, the matrix delta, and the evidence:
```bash
gh pr create --title "🛡️ rule: <class> (STRIDE <portal>)" --body "Closes gap <id> from gaps.json. Matrix: <portal> ABSENT/THIN → covered. All gates green; self-audit PASS."
```
**Do not merge.** Hand back to the human for review.
