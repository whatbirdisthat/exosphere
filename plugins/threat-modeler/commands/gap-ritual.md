---
description: Run the STRIDE/EoP gap ritual against skillsentry's probe set — write a gap analysis and machine-readable gaps.json.
allowed-tools: Bash(node:*), Read, Write, Glob
---

# /threat-modeler:gap-ritual

Run the threat-modelling "poker" ritual against skillsentry's own probe set and produce the gap
artifacts. This is the covenant's **observe** step (Q4 of the Four Questions: *did we do a good job?*).
It is READ-ONLY over the codebase — it proposes, it does not change rules.

Run from the skillsentry repo root. Steps:

## 1 — mechanical coverage (not an opinion)
```bash
npm run build >/dev/null 2>&1
node plugins/threat-modeler/scripts/coverage-matrix.mjs --json
```
This tabulates STRIDE × tier density directly from `framework.stride` / `framework.axis` on every rule.
Note: the `temporal` axis reads 0 because the T3 rug-pull is the engine's temporal pass, not a
`RuleSpec` — that is NOT a gap.

## 2 — deal the deck
Read `knowledge/eop-deck.md` and `knowledge/stride-portals.md`. For each Elevation-of-Privilege "card"
(an "an attacker can …" prompt) in each suit, decide whether an existing probe catches it. Cross-check
against `knowledge/mcp-38.md`, `knowledge/maestro.md`, `knowledge/owasp-agentic.md`, `knowledge/linddun.md`.
A card with no probe — that is **static, pre-execution, deterministic, and never-executing** — is a gap.
Reject anything that would need runtime, network, a parser dependency, or LLM semantics (those break the
auditor's pillars and belong out of scope).

## 3 — write the artifacts
Write `doc/threat-model/GAP_ANALYSIS.md` (human-readable: the matrix, the ABSENT/THIN cells, each gap
with a candidate `detectionClass` and a one-line rule sketch) and `doc/threat-model/gaps.json` (machine:
an array of `{ portal, axis?, card, candidateClass, ruleSketch, owasp, atlas, priority }`). These drive
`/threat-modeler:propose-rule` (the covenant's act step) and Slice 4's new detection classes.

## 4 — close the loop
Summarise: which ABSENT cells were confirmed, how many gaps, the top-priority candidate. Recommend the
next `propose-rule` target. Do NOT edit any rule here — that is a separate, gated step.
