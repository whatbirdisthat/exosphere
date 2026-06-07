---
description: Threat-model a system (or skillsentry itself) with the Four Questions + STRIDE portals + agentic axes.
argument-hint: "[what to threat-model] (defaults to skillsentry's own probe set)"
allowed-tools: Bash(node:*), Read, Glob
---

# /threat-modeler:threat-model

Walk the Four-Question Framework over a target. Default target: skillsentry's own probe set (the
self-reflection that feeds the covenant). Give a target in `$1` to threat-model something else.

Read `knowledge/four-questions.md` and `knowledge/stride-portals.md` first, then:

1. **What are we working on?** — state the system, its components, and its trust boundary.
2. **What can go wrong?** — enumerate threats by walking all six STRIDE portals AND the two EXTRA
   agentic axes (temporal, cognitive). For skillsentry, run `node
   plugins/threat-modeler/scripts/coverage-matrix.mjs` to ground this in the mechanical matrix.
3. **What are we going to do about it?** — for each threat, name the existing probe/mitigation, or mark
   it a gap. For skillsentry gaps, point at `/threat-modeler:gap-ritual` to formalise them.
4. **Did we do a good job?** — assess coverage honestly; name what is NOT covered and why (runtime,
   semantic, network, parser-dependency threats are deliberately out of the deterministic scope).

Output a concise threat model: a portal-by-portal table (covered / gap), the EXTRA-axis notes, and the
top unmitigated risks. Treat STRIDE as one intelligence source among several — never the only lens.
