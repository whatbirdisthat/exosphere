# Deeper-detection research plan (ROADMAP R9)

> A plan to evolve `exosphere-audit` from v1's four deterministic regex classes into a layered,
> framework-mapped detection engine — **without breaking the three invariants that earn trust:**
> **never-execute**, **low-false-positive** (precision over recall at BLOCK), and **transparency**
> (R3 — nothing is excluded silently). Status: PLAN (not yet built). Grounded in the mid-2026 threat
> literature cited inline.

## 1 · Threat taxonomy & framework mapping

Anchor every detection rule to a recognised framework so coverage is auditable, not ad-hoc, and so a
finding can cite a standard ID a security team already tracks:

- **OWASP ASI / Agentic Top 10 (2026):** Agent Goal Hijack, Tool Misuse & Exploitation, Agent Identity &
  Privilege Abuse, **Agentic Supply-Chain Compromise**. <https://owasp.org/www-project-mcp-top-10/>
- **OWASP MCP Top 10** and **OWASP LLM Top 10.** <https://blog.alexewerlof.com/p/owasp-top-10-ai-llm-agents>
- **MITRE ATLAS** technique IDs per rule (optional second axis — more rigorous, more upkeep).
- Reference corpus / literature: <https://github.com/LLMSecurity/awesome-agent-skills-security>,
  the agentic prompt-injection systematisation <https://arxiv.org/pdf/2601.17548>, and the neuro-symbolic
  malicious-skill work <https://arxiv.org/pdf/2603.27204>.

| v1 class | Frameworks covered | Principal gap to close |
|---|---|---|
| `dangerous-bash` | Supply-chain, Tool Misuse | bundled-script **dataflow** (taint→sink), not just regex |
| `prompt-injection` | Goal Hijack | **tool/skill-description poisoning**, encoding/unicode obfuscation, "line jumping" |
| `over-broad-perms` | Privilege Abuse | MCP scope **combinations**, capability **deltas** across versions |
| `committed-secrets` | Supply-chain | entropy/format breadth (solid today) |

## 2 · New detection classes (prioritised)

- **P0 — Tool/skill-description poisoning** — malicious instructions embedded in tool/skill descriptions
  the model reads but the user never sees. <https://owasp.org/www-community/attacks/MCP_Tool_Poisoning>
- **P0 — Encoding / obfuscation evasion** — zero-width unicode (deepen), homoglyphs, base64/hex-encoded
  instructions, ANSI-escape "line jumping". (Strengthens the existing `prompt-injection` class.)
- **P1 — Rug-pull / version drift** — diff a skill/plugin across versions or commits; flag behaviour,
  schema, permission, or script changes that mutate **after** a user approved an earlier version.
- **P1 — Tool shadowing / name collision** — duplicate or typosquatted skill/tool names that intercept
  calls intended for a trusted one.
- **P1 — Skill dependency supply chain** — audit the skill's *own* declared deps (npm/pip referenced by
  bundled scripts) — supply-chain risk nested inside the supply-chain artefact.
- **P2 — Data-exfil via tool chaining / cross-tool contamination** — harder; likely needs the semantic
  tier (§3 T2).

## 3 · Detection-technique evolution — a tiered engine (deterministic core stays the default)

Each tier is **additive and labelled in the report**; the user chooses their depth. The deterministic
core is always the default floor so the never-execute + offline + reproducible guarantees hold by default.

- **T0 — Pattern (have).** Fast, deterministic, offline regex/structural rules. Keep as default.
- **T1 — AST + interprocedural dataflow** for bundled scripts: track tainted input → dangerous sink
  *without executing*, catching what regex misses. (Current static-analysis practice:
  <https://blogs.cisco.com/ai/ciscos-mcp-scanner-introduces-behavioral-code-threat-analysis>.)
- **T2 — Semantic "claims-vs-behaviour" judge (OPT-IN only).** An LLM / neuro-symbolic check for
  "the tool says X but does Y." **Breaks the offline + deterministic guarantees**, so it is never the
  default — explicit opt-in, clearly labelled, and never gates a BLOCK on its own without a deterministic
  corroborator.
- **T3 — Temporal / version-diff** engine powering rug-pull detection (P1 above).

## 4 · Ruleset architecture (unlocks the parked R4 — community ruleset)

Move rules out of compiled code into a **versioned, community-contributable ruleset** (Semgrep/YARA-style).
Each rule is a self-describing record:

```
id · framework-mapping (OWASP ASI/MCP/LLM, MITRE ATLAS) · severity · rationale (the "why")
  · tier (T0–T3) · pass-fixtures[] · fail-fixtures[] · precision-budget
```

A rule ships with its **own** labelled fixtures and a **precision budget** — a rule that regresses the
corpus false-positive rate is reverted, not merged. This is the open artefact the community reaches for
(the FOSS-reach thesis) and the mechanism that keeps quality high as contributors add rules.

## 5 · Evaluation & false-positive management (the bar that earns reach)

- Grow the labelled corpus per class; track **precision/recall per rule**, not just the aggregate gate.
- Wire a red-team benchmark as a CI **regression gate**
  (<https://www.trydeepteam.com/docs/frameworks-owasp-top-10-for-agentic-applications>).
- Hold the FP line as coverage grows via: the **REVIEW** tier (uncertain → REVIEW, never auto-BLOCK),
  per-finding **confidence scores**, and the R3 exclusion mechanism (transparent by construction).
- Keep `exosphere-audit .` on this repo green throughout (dog-fooding the gate).

## 6 · Phased roadmap

> **Sequencing note (2026-06-06):** the externalise-the-ruleset work shipped under its own id **R4**
> (PR #6), so the slice labels were re-used: **R9b is the T1 shell dataflow/taint slice** (this is the
> "T1 AST/dataflow for bundled scripts" item below), delivered dependency-free per **ADR-006**. The
> JS-AST sub-case (which would need a parser runtime dependency) is **deferred to an opt-in future
> slice** (provisionally R9c). The authoritative sequencing is `ROADMAP.md`.

1. **R9a** — framework mapping + encoding/obfuscation + tool-description poisoning (all T0; low risk, high value). ✅
2. **R4** — externalise the ruleset with per-rule fixtures + framework IDs. ✅
3. **R9b** — **T1 dataflow/taint for bundled shell scripts (dependency-free; ADR-006).** ← this slice.
4. **R9c** — JS-AST dataflow (opt-in; needs a parser dep — deferred per ADR-006) + further tiers.
5. **R9d** — T3 rug-pull / version-diff.
6. **R9e** — opt-in T2 semantic tier.

## 7 · Open questions — RESOLVED (product-owner sign-off, 2026-06-06)

1. **Semantic tier (T2):** ✅ **Deterministic default; architect for an opt-in T2 later.** Every default
   stays 100% deterministic + offline; the rule/scanner interface must leave room to add an opt-in
   semantic tier later **without rework** — but T2 is not built now.
2. **Externalise the ruleset (R4):** ✅ **After R9a.** Ship more built-in detection first (R9a), then
   externalise (R4).
3. **Framework mapping:** ✅ **OWASP (ASI/MCP/LLM) + MITRE ATLAS** technique IDs per rule, from the start.

> All three resolved → **R9a is the active next slice** (deterministic T0; OWASP+ATLAS-tagged rules;
> framework mapping + encoding-evasion + tool-description poisoning; engine kept tier-pluggable for a
> future opt-in T2). See ROADMAP R9a.
