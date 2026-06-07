# The self-improvement covenant — governance

This is how the threat-modeler adds detection coverage **without ever** being able to compromise the
deterministic auditor. It extends the repo's existing `.foundry/governance.md` (`merge-mode:
pr-approval` — never self-merge to main) to the threat-modeler.

## The one rule
> **The covenant proposes; the deterministic core + a human dispose.**

The threat-modeler (agent / gap-ritual / propose-rule) may:
- **observe** — compute the coverage matrix, deal the EoP deck, read rule data;
- **propose** — on a branch, author rule modules and register them (new `RuleSpec` data + fixtures +
  corpus, plus the `DetectionClass` union and ruleset wiring) and open a PR.

The threat-modeler may **never**:
- decide an audit verdict;
- edit detection on `main`;
- weaken, delete, or skip a test, the precision budget, or the layering/threat-map invariants;
- self-merge a PR.

## The acceptance gate (a PR must pass ALL of these before a human merges)
1. `npm run build` — clean.
2. `npm run test:cov` — **100%** lines/branches/functions/statements.
3. Precision-budget guard — every new rule fires on its fail fixtures, is silent on its pass fixtures,
   and adds **0** false positives on the benign corpus (or stays within its declared budget).
4. Parity — no baseline corpus fixture regresses.
5. `node dist/bin.js .` (self-audit) — **PASS**.
6. Layering test — `src/core/*` imports no `node:` builtin.
7. Threat-map invariant — every rule declares a `stride` portal or an `axis`.
8. The 🧱 wall job — zero runtime deps, vendored CLI in sync, auditor plugin still a thin wrapper.

These gates are the firewall: a non-deterministic agent can only ever *suggest* data that the
deterministic suite and a human accept. That is what lets the platform self-improve safely.

## Tie to the FOUNDRY / SOLID covenant
The standing flag in `FOUNDRY_PLAN.md` ("always seed a laundering/suppression test when a data artifact
is added") generalises here to: **whenever a detection class is added, re-run the gap ritual and record
the matrix delta.** The ritual is the recurring "Did we do a good job?" station (Four Questions, Q4),
feeding the scorecard. Every merged proposal makes every future audit, for every user, sharper.
