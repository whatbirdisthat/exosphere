# OWASP — LLM Top-10 & Agentic Top-10 (the framework IDs every probe already cites)

skillsentry tags every finding with an OWASP id. These are the relevant lists; use them to keep the
`framework.owasp` mapping honest when drafting a new rule.

## OWASP Top-10 for LLM Applications (2025) — the ones we map to
- **LLM01 Prompt Injection** — direct & indirect. ← the entire `prompt-injection` class (cognitive axis).
- **LLM02 Sensitive Information Disclosure** — overlaps `committed-secrets`, exfil coercion.
- **LLM03 Supply Chain** — overlaps `dangerous-bash`, `dataflow-taint`, rug-pull.
- **LLM06 Excessive Agency** — overlaps `over-broad-perms`.

## OWASP Top-10 for Agentic Applications (2026) — the agentic surface
Covers tool misuse, identity/spoofing, memory poisoning, cascading multi-agent failures, and
**dynamic-trust / rug-pull** (our temporal axis). When a gap is agent-specific (e.g. publisher
spoofing, parasitic tool chaining), prefer an Agentic-Top-10 id; the codebase uses the ASI prefix
(`ASI03` excessive privilege, `ASI04` supply chain) and MCP ids (`MCP-T01` tool poisoning).

## How to pick an id for a new rule
- Privilege / authorization gap (sudo, persistence) → `ASI03`.
- Supply-chain / RCE / destructive → `ASI04`.
- Tool/description poisoning → `MCP-T01`.
- Cognitive coercion of the model → `LLM01`.
Always pair with a MITRE ATLAS technique id (see the codebase rules for the in-use set, e.g. AML.T0051
injection, AML.T0011 supply-chain user-execution, AML.T0053 privilege, AML.T0055 credential access).
