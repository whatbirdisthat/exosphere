# MAESTRO — layered threat modelling for agentic AI (CSA, 2025)

MAESTRO (Multi-Agent Environment, Security, Threat, Risk & Outcome) is a seven-layer threat model for
agentic systems from the Cloud Security Alliance. We use it to locate WHERE a skillsentry probe sits and
to spot layers we never look at. (CSA, *Agentic AI Threat Modeling Framework: MAESTRO*, 2025.)

The seven layers:
1. **Foundation models** — the LLM itself (jailbreaks, model poisoning). *Mostly out of skillsentry scope.*
2. **Data operations** — pipelines, RAG stores, labeling. *Out of static-skill scope.*
3. **Agent frameworks** — tool/skill definitions, orchestration. ← **skillsentry's home turf** (tool
   poisoning, over-broad perms, description poisoning).
4. **Deployment & infrastructure** — containers, hosting. *Partial: hooks/scripts.*
5. **Evaluation & observability** — monitoring, logging integrity. ← maps to the **Repudiation** gap
   (a skill that disables/erases logging attacks this layer).
6. **Security & compliance** — access control, privacy. ← maps to **over-broad-perms** + the LINDDUN axis.
7. **Agent ecosystem** — multi-agent + external interaction. ← maps to **cross-file taint**, MCP
   composition, and the **provenance/spoofing** gap.

Cross-layer threats are the dangerous ones. Use this when judging whether a candidate gap is real: a
threat that spans layers (e.g. a poisoned tool description at L3 that drives exfiltration at L7) is high
value. Static, pre-execution, deterministic slices of these belong in skillsentry; runtime/semantic ones
are explicitly out of scope (they would break the determinism pillar).
