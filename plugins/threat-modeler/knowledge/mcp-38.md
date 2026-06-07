# MCP-38 — a threat taxonomy for the Model Context Protocol (2026)

A comprehensive taxonomy of Model Context Protocol threats, each mapped to STRIDE + OWASP LLM/Agentic.
Use it to sanity-check that a candidate gap is a recognised MCP attack, and to find statically-detectable
ones skillsentry could add. (arXiv:2603.18063 and related MCP threat-modelling work.)

Four MCP attack surfaces:
1. **Tool-interface surface** — the boundary between the agent and tool DEFINITIONS. ← statically
   detectable: **tool-description poisoning** (✓ have it), **spoofed-tool-identity** (gap), over-broad
   tool scopes (✓ `over-broad-perms`).
2. **Transport surface** — client↔server channel. *Mostly runtime; out of static scope.*
3. **Server surface** — the MCP server implementation. *Runtime; out of scope.*
4. **Composition surface** — emergent behaviour when multiple tools/servers/agents interact. ←
   **parasitic tool chaining** and **cross-file/cross-tool taint** (✓ partial via cross-file taint).

Statically detectable / pre-execution MCP threats (candidate skillsentry probes):
- **Tool poisoning** — coercive directives in a tool/skill description. ✓ covered.
- **Indirect prompt injection** — hostile instructions in data the model reads. ✓ partly (cognitive class).
- **Dynamic trust / rug-pull** — capability grows after approval. ✓ T3 temporal pass.
- **Parasitic tool chaining** — one tool's output coerces another tool's use. *gap* (cognitive DoS / loop).
- **Spoofed tool identity** — a tool mimics a trusted built-in. *gap* (Spoofing).

The taxonomy reinforces our gap list: Spoofing (identity), composition-surface chaining, and the loop /
DoS coercion are the under-covered MCP-specific surfaces.
