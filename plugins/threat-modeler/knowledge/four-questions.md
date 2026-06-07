# The Four-Question Framework (the spine of every threat-modelling pass)

A threat-modelling method, reduced to four questions you keep asking. Used here as the *shape* of the
gap ritual — not as a brand. (Shostack, *The Four Question Framework*.)

1. **What are we working on?** — name the system under analysis. For skillsentry: the **probe set** (the
   rules in `src/core/rules/*`), the **component kinds** they apply to (skill, agent, plugin-manifest,
   settings, hook, script, mcp-config), and the trust boundary (we read files as text; we never execute).
2. **What can go wrong?** — enumerate threats. We do this *mechanically* against the STRIDE portals plus
   the two EXTRA agentic axes, and *adversarially* by dealing the Elevation-of-Privilege deck against the
   probe set (see `eop-deck.md`). An empty/THIN cell is a candidate "what can go wrong" we don't yet catch.
3. **What are we going to do about it?** — for each real gap, draft a deterministic `RuleSpec` (data, with
   pass/fail fixtures + a precision budget) and **open a PR**. The covenant proposes; it never ships.
4. **Did we do a good job?** — measure: did coverage of the ABSENT cells improve? did the corpus
   false-positive rate stay within budget? did 100% coverage and the self-audit hold? Record it in the
   gap analysis and the scorecard. Then loop back to question 1.

These four questions map onto machinery skillsentry already has: enumeration (Q1), the ruleset (Q2),
the verdict/lockfile (Q3), and the corpus FP-rate + coverage gate + this ritual (Q4).
