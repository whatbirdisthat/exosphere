# STRIDE — six conceptual portals (just another threat-intelligence source)

STRIDE is a checklist of six threat categories. We use it as *one* intelligence source feeding the
covenant — peer to OWASP ASI/LLM, MITRE ATLAS, MAESTRO, MCP-38 and LINDDUN — never as an authority that
bypasses the deterministic gates. Its real value here is **negative space**: it mechanically reveals the
cells our probe set does NOT cover.

| Portal | Property violated | Reads as, for an agent skill |
|---|---|---|
| **S** Spoofing | Authenticity | impersonating a trusted publisher/tool/instruction (typosquat, homoglyph, fake provenance) |
| **T** Tampering | Integrity | modifying the system or the agent's instruction stream (RCE, taint-to-sink, self-modifying skill) |
| **R** Repudiation | Non-repudiation / auditability | erasing the trail (history clearing, log tampering) |
| **I** Information disclosure | Confidentiality | leaking secrets/data (committed creds, secret-path read, exfil channel) |
| **D** Denial of service | Availability | destroying or exhausting resources (rm -rf, fork-bomb, disk-fill, runaway loop) |
| **E** Elevation of privilege | Authorization | gaining capability beyond grant (Bash(*), sudo/setuid, persistence) |

## The two EXTRA agentic axes (classic STRIDE has no cell for these)
- **temporal** — trust that changes *across time*. STRIDE models one system at one instant; the T3
  rug-pull (capability growth since an approved `.skillsentry.lock`) lives off the STRIDE grid. NOTE:
  this is realized by the engine's T3 *temporal pass*, not a `RuleSpec`, so it reads 0 in a
  rule-tabulation yet is NOT a coverage gap.
- **cognitive** — the attack target is the LLM's *cognition*, not a deterministic boundary (the
  prompt-injection family). STRIDE assumes deterministic data/control boundaries; instruction-following
  is probabilistic.

STRIDE is the platform's **organising lens** — the one framework we name in the UI and use to structure
the gap ritual: **"STRIDE + 2 agentic axes (temporal, cognitive)."** It organises; it does not override
the gates, and OWASP/ATLAS/MAESTRO/MCP-38/LINDDUN feed the same covenant alongside it.
