---
name: threat-model
description: Threat-model a system or design using the Four-Question Framework + STRIDE + the two agentic axes (temporal, cognitive). Use when the user asks to "threat model" something, wants a STRIDE analysis, "what can go wrong with this design?", or to reason about an agentic/LLM/MCP system's risks. Grounded in named sources (STRIDE, MAESTRO, OWASP, MCP-38), not vibes.
---

# threat-model — structured, multi-source threat analysis

Produce a real threat model for a target by walking the Four Questions, using STRIDE as one of several
intelligence sources (peer to MAESTRO, OWASP, MCP-38, LINDDUN), never as the only lens.

## Procedure
1. Read `knowledge/four-questions.md` and `knowledge/stride-portals.md`. For agentic/LLM/MCP targets
   also read `knowledge/maestro.md` and `knowledge/mcp-38.md`; for data/privacy concerns, `knowledge/linddun.md`.
2. **What are we working on?** — name components, data flows, and trust boundaries. Draw the boundary
   explicitly (what is trusted, what crosses it).
3. **What can go wrong?** — enumerate threats across all six STRIDE portals (S/T/R/I/D/E) and the two
   EXTRA agentic axes (temporal trust-drift, cognitive coercion of the model). For agentic systems,
   map each to a MAESTRO layer and an OWASP/MCP-38 id.
4. **What are we going to do about it?** — propose a mitigation per real threat; rank by impact.
5. **Did we do a good job?** — call out residual risk and what is explicitly out of scope.

## For skillsentry itself
Use `node plugins/threat-modeler/scripts/coverage-matrix.mjs` to ground "what can go wrong" in the
mechanical STRIDE matrix, then hand to the `gap-ritual` skill to formalise and propose fixes.

## Output
A portal-by-portal table (threat · mitigation/gap · framework id), the agentic-axis notes, and a
ranked list of top unmitigated risks. Keep STRIDE honest: prefer concrete "an attacker can …" threats
over category names.
