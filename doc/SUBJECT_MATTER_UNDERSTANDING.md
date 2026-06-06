# Subject Matter Understanding — skillsentry

> *This document is the philosophical and domain foundation for all FOUNDRY
> agents operating on skillsentry. Read it before taking any action.*
>
> Source IDEA package: `doc/idea/skillsentry/brief.md` (source of truth),
> `smu-seed.md`, `first-slice.md`, `handoff.md`. ROADMAP item under build: **R1**.

---

## 1. What This Product Is

A FOSS command-line **security auditor for the Claude Code skill/plugin supply chain** —
"`npm audit` / Semgrep for agent skills." It statically analyses a skill / subagent / plugin
(local directory, or fetched **read-only** from a git URL) and returns an explained trust
verdict — **PASS / REVIEW / BLOCK** — *before* the user installs or runs it. Distributed as a
zero-install one-liner: `npx skillsentry <git-url | local-dir>`.

---

## 2. Who It Is For

| Actor | Role | Core need |
|---|---|---|
| **The cautious installer** (primary) | A developer about to install/run a third-party Claude Code skill or plugin | A one-line, trustworthy, explained safety check before they grant the artefact ambient shell authority |
| **The skill/plugin author** (secondary) | A developer publishing a skill/plugin | Self-audit (`audit .`) before publishing + a trust signal — *the badge is roadmap (R2), not v1; v1 supports the `audit .` path* |
| **CI / automation** (system) | A pipeline gating installs or merges | A machine-readable JSON verdict and a **non-zero exit on BLOCK** so it can fail a build |

---

## 3. The Problem It Solves

Agent skills are **executable markdown + scripts with ambient authority** — they run in the
developer's shell with the developer's permissions. The publishing bar is near-zero
(a SKILL.md + a week-old GitHub account) and there is **no install-time review or sandbox by
default**. The threat is live and current: real malware campaigns (ClawHub, 30+ malicious
skills) and Snyk's ToxicSkills study (prompt injection in 36% of skills, 1,467 malicious
payloads). skillsentry removes the friction of "is this skill safe?" by giving a
frictionless, explainable, low-false-positive static verdict before execution.

---

## 4. Core Domain Concepts

Every agent must use these terms consistently. Where a term has a precise meaning here that
differs from everyday usage, it is defined explicitly.

| Term | Definition (precise, domain) |
|---|---|
| **Audited artefact** | A Claude Code skill / subagent / plugin / marketplace: SKILL.md frontmatter + body, agent definitions, `plugin.json`, `settings.json`, hooks, bundled scripts, MCP server configs. The thing under audit. |
| **Read-only fetch** | For a git URL: shallow `git clone --depth 1` into a temp dir with hooks **disabled** and **no** build/install/post-install step ever run. The source is treated as **hostile**. |
| **Skill SBOM** | The enumerated inventory of files/components the auditor identifies in the tree (skills, agents, manifests, hooks, scripts, MCP configs) — the scan surface. |
| **Detection class** | A family of checks. v1 shipped four: `dangerous-bash`, `prompt-injection`, `over-broad-perms`, `committed-secrets`. R9a adds a fifth: `tool-description-poisoning` (malicious instructions hidden in tool/skill descriptions the model reads but the user doesn't). Each maps to a set of rules. |
| **Rule** | A single named, **versioned** matcher (pattern / AST / heuristic) carrying a `severity`, a human `why`, a `tier` (R9a/ADR-004 — `T0` deterministic+offline today; the union is the extension point for a future opt-in semantic tier), and a `framework` mapping (OWASP ASI/MCP/LLM id + MITRE ATLAS technique id, required). The curated, community-contributable collection is the **ruleset**. |
| **Finding** | One rule hit: `{ rule, severity, file, line, excerpt, why, tier, owasp, atlas }` (R9a added `tier`/`owasp`/`atlas`). Every finding must cite `file:line` and its framework ids. |
| **Tier** | A rule's detection depth (R9a/ADR-004, extended R9b/ADR-006). `T0` = pattern/structural. `T1` (R9b) = **intra-file shell taint/dataflow** — a deeper static technique that tracks a tainted SOURCE flowing across lines into a dangerous SINK. **Both T0 and T1 are deterministic + offline + never-executing and run by default** (T1 is additive, labelled `tier:'T1'`). A future opt-in semantic tier (T2) would break offline/deterministic and is gated at the edge; the engine plugs it in without reworking the rule record. No runtime LLM/network dependency in the default. |
| **SOURCE / SINK (T1)** | In T1 shell dataflow: a **SOURCE** is a tainted-input origin (command substitution `$(...)`/backticks, network fetch, decode, sensitive-env read, stdin `read`). A **SINK** is a dangerous use (pipe-to-shell, `eval`/`exec`, `source`, or a write to an autorun location). A `dataflow-taint` finding is raised when a tainted SOURCE reaches a SINK across lines — caught **without executing** the script. |
| **Framework mapping** | The OWASP (ASI/MCP/LLM) + MITRE ATLAS technique ids every rule carries (R9a), anchoring each detection to a recognised standard a security team already tracks. |
| **Severity** | The weight of a finding (e.g. low / medium / high). A **high** finding forces BLOCK. |
| **Verdict** | The aggregate trust decision: **PASS** (no findings) · **REVIEW** (low–medium findings; human judgement) · **BLOCK** (any high-severity finding → non-zero exit). |
| **False positive (FP)** | A finding raised against a benign artefact. The product's central risk; precision is favoured over recall at the BLOCK threshold. |
| **Corpus** | The labelled fixture set (malicious + benign artefacts) that *is* the success gate. Built test-first. |

---

## 5. Design Values

These are the tie-breakers, **in order**, when trade-offs arise:

1. **Trust through low false-positives** — a noisy verdict is worse than no tool. Precision over
   recall at the BLOCK threshold; REVIEW is the soft tier that absorbs uncertainty.
2. **Explainability** — every finding cites the matched `file:line` + rule + why. No opaque scores.
3. **Frictionless reach** — zero-install `npx`; the ruleset is open and forkable. npm + GitHub
   are the reach channel.
4. **Safety of the auditor itself** — it must **never execute** what it audits, including hooks.

---

## 6. Constraints Every Agent Must Honour

- **Never execute the audited code or its hooks.** No build, install, post-install, or hook run —
  ever. The clone is hostile. This is a hard safety invariant, not a preference.
- **Read-only acquisition.** git URLs are fetched via shallow clone with hooks disabled; local
  dirs are read in place, never mutated.
- **Stack:** TypeScript / Node, distributed as a `npx` one-liner. FOUNDRY stack handler = `handler-js`.
- **Offline after fetch.** The scan itself makes no network calls.
- **Output contract:** both **markdown** (human) and **JSON** (machine); **non-zero exit on BLOCK**.
- **Low-false-positive ruleset.** Curated and versioned; precision-first.
- **Findings are explainable.** Each cites the matched line + rule + why.
- **Temp clones are cleaned up** after the audit.
- **Scope discipline:** build **R1 only**. Do NOT build R2–R7 (badge, registry, runtime guard,
  drift checks, cross-harness, auto-fix) until the slice ships green.

---

## 7. What Success Looks Like

- A developer runs **one line** before installing a skill and gets a trustworthy, explained verdict.
- On the labelled corpus: **≥ 90% correct classification at ≤ 10% false-positive rate**.
- Every **BLOCK** cites `file:line` + the triggering rule.
- The tool (and its open ruleset) is adopted and contributed to across the ecosystem
  (reach/reputation: npm installs + GitHub stars trending up — a product goal, not a build gate).

---

## 8. What Failure Looks Like

- **False positives erode trust** — the tool cries wolf on benign skills and people stop using it.
- **The auditor executes a hostile payload** during "audit" — the single worst outcome; a total
  trust and safety failure.
- **Friction** — the check adds enough overhead that people skip it.
- **Unexplained verdicts** — opaque scores nobody can act on.
- **Scope creep** — pulling roadmap (Tier-2) work into the slice and never shipping the spine.

---

## 9. Revision History

| Date | Change | Reason |
|---|---|---|
| 2026-06-06 | Initial creation from `smu-seed.md` | FOUNDRY cycle start (R1) |
| 2026-06-06 | Added `tool-description-poisoning` class; `tier`/`framework` on Rule + Finding; Tier/Framework-mapping concepts | FOUNDRY cycle R9a (detection breadth; ADR-004) |
| 2026-06-06 | Added the **T1 tier** (`dataflow-taint` class) — intra-file shell taint/dataflow; SOURCE/SINK concepts; `RuleTier` widened to `'T0'|'T1'`. Dependency-free; JS-AST deferred | FOUNDRY cycle R9b (ADR-006) |
