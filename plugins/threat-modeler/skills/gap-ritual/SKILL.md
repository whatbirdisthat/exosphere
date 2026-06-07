---
name: gap-ritual
description: Run the STRIDE/Elevation-of-Privilege gap ritual against skillsentry's probe set and propose new deterministic rules. Use when the user wants to improve skillsentry's threat coverage, asks "what threats do we miss?", "what's our STRIDE coverage?", "run the gap ritual", "find detection gaps", "what new rules should we add?", or when a new detection class lands and coverage should be re-checked. The covenant's engine: it observes (mechanical coverage matrix + EoP deck), proposes (RuleSpec drafts), and opens a PR — it never ships a rule directly.
---

# Gap ritual — the self-improvement covenant in motion

The gap ritual is how the threat-stack platform evolves toward greater threat intelligence. It runs
against **skillsentry's own probe set** and answers the Four Questions' fourth question — *did we do a
good job?* — then proposes the next improvement. STRIDE and the Elevation-of-Privilege deck are the
intelligence sources; they feed the covenant, they are never a brand or an authority.

## The covenant (read this first — it is load-bearing)
> **The covenant proposes; the deterministic core + a human dispose.**

You may OBSERVE (compute coverage, deal the deck) and PROPOSE (draft `RuleSpec` data, open a PR). You
MUST NOT decide a verdict, edit a rule on `main`, or self-merge. Every proposal is gated by the existing
deterministic suite (100% coverage, corpus FP budget, never-`node:` layering, self-audit, threat-map
invariant) and merged by a human. This is the firewall that lets a non-deterministic agent improve a
deterministic product without compromising it (`plugins/skillsentry/knowledge/trust-pillars.md`).

## Observe (mechanical, not opinion)
Run `node plugins/threat-modeler/scripts/coverage-matrix.mjs --json` from the repo root. It tabulates
STRIDE × tier density straight from `framework.stride` / `framework.axis` on every rule. Current shape:
T/I/E HEAVY, S THIN, **R and D ABSENT**, cognitive axis is the moat (the prompt-injection family),
temporal is realized by the engine's T3 pass (reads 0 as a rule, not a gap).

## Propose (deal the deck → gaps)
Walk `knowledge/eop-deck.md` suit by suit, cross-checking `knowledge/{mcp-38,maestro,owasp-agentic,linddun}.md`.
A "card" with no probe that is **static · pre-execution · deterministic · never-executing** is a gap.
Reject anything needing runtime, network, a parser dep, or LLM semantics — those break the pillars.
Write `doc/threat-model/GAP_ANALYSIS.md` + `doc/threat-model/gaps.json`.

## Hand off
Recommend the highest-value gap (today: the ABSENT **D — destructive/DoS** and **R — audit-evasion**
cells) and point at the `propose-rule` skill to draft it as a `RuleSpec` and open the PR. The new rule
follows the data template in `src/core/rules/dangerous-bash.rules.ts` and must ship pass/fail fixtures
and a precision budget so its evidence lands atomically.
