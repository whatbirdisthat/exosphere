# skillsentry trust pillars (and the agentic firewall)

skillsentry is the **trust anchor** of the threat-stack platform. Its value is that you can read it in
an afternoon and verify it cannot betray you. These pillars are load-bearing — the whole platform is
designed so that adding agentic, non-deterministic capability around the auditor never weakens them.

## The five pillars (the pure CLI — `src/` + `dist/`, vendored here as `cli/`)
1. **Never executes audited content.** It reads files as text and matches patterns. It never runs a
   target's code and never feeds target content to an LLM to "judge" it. Enforced structurally by the
   pure-core / adapters layering (ADR-001) and a build-time test.
2. **Zero runtime dependencies.** The auditor of a supply chain has no supply chain of its own.
3. **Deterministic + offline.** Same input → same verdict, everywhere, with no network and no model in
   the scan path. A verdict is reproducible and reviewable.
4. **100% test coverage.** Every line, branch, and function is pinned.
5. **Transparency.** Every `.skillsentryignore` exclusion is counted and disclosed in the report — a
   suppression can never silently hide a finding.

## The agentic firewall (why the threat-modeler can't corrupt the auditor)
The threat-modeler and the gap ritual are **non-deterministic** (they are agents). They live in
separate plugins, never inside `src/`/`dist/`. The covenant is one-directional:

> **The covenant proposes; the deterministic core + a human dispose.**

- The agentic layer NEVER decides a verdict and NEVER ships a rule directly.
- It only *writes a draft artifact* (a gap analysis) and *opens a PR* proposing new `RuleSpec` **data**.
- That PR must pass the existing deterministic gates — 100% coverage, corpus false-positive budget,
  the never-`node:` layering test, the self-audit, and the threat-map invariant — and be merged by a
  human. It never self-merges.

This is what lets a non-deterministic agent *improve* a deterministic product without ever being able
to compromise its guarantees. STRIDE and the Elevation-of-Privilege deck are, in this frame, simply
**another threat-intelligence source** feeding that covenant — never a brand, never an authority that
bypasses the gates.

## The opt-in pre-tool audit (off by default)
A pre-tool audit hook ships **disabled** as `hooks/hooks.json.example`. Enabling the plugin never
auto-audits; a user opts in explicitly by copying it to `hooks/hooks.json`. This keeps the auditor from
silently running inside arbitrary repos until the user asks for it.
