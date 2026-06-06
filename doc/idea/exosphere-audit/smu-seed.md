# SMU-seed — exosphere-audit

> Subject-matter-understanding seed for FOUNDRY's builder-lead to expand into the full SMU.

## What it is
A FOSS command-line **security auditor for the Claude Code skill/plugin supply chain** — "`npm audit` /
Semgrep for agent skills." It statically analyses a skill/subagent/plugin (local or fetched read-only from
git) and returns a trust verdict before the user installs or runs it.

## Who it's for
The **cautious installer** (primary) and the **skill/plugin author** (secondary). Both are developers in
the Claude Code / agent-tooling ecosystem; both are reachable through that ecosystem's channels
(awesome-lists, marketplaces, the idea-to-production marketplace audience, CI).

## The problem (domain framing)
Agent skills are **executable markdown + scripts with ambient authority** — they run in the developer's
shell with their permissions. The publishing bar is near-zero and there is no install-time review or
sandbox by default. The attack surface: malicious Bash (exfiltration, reverse shells), prompt-injection
hidden in instruction prose, over-broad declared permissions, and committed secrets.

## Core domain concepts / terms
- **Skill / subagent / plugin / marketplace** — the artefacts under audit (SKILL.md frontmatter + body,
  agent definitions, `plugin.json`, `settings.json`, hooks, bundled scripts, MCP server configs).
- **Detection class** — a family of checks (dangerous-bash, prompt-injection, over-broad-permission,
  committed-secret). Each maps to a set of **rules**.
- **Rule** — a single named, versioned matcher (pattern / AST / heuristic) with a severity and an
  explanation. The **ruleset** is the curated, community-contributable collection.
- **Finding** — a rule hit: `{rule, severity, file, line, excerpt, why}`.
- **Verdict** — `PASS` (no findings) / `REVIEW` (low–medium findings, human judgement) / `BLOCK` (a
  high-severity finding; non-zero exit).
- **Read-only fetch** — shallow clone with **no hook/build execution**; the audit treats the source as
  hostile.

## Design values (tie-breakers, in order)
1. **Trust through low false-positives** — a noisy verdict is worse than no tool; precision over recall at
   the BLOCK threshold.
2. **Explainability** — every finding cites the matched line + rule + why; no opaque scores.
3. **Frictionless reach** — zero-install `npx`; the ruleset is open and forkable.
4. **Safety of the auditor itself** — it must never execute what it audits.

## Hard constraints
Never execute audited code/hooks · TS/Node + `npx` · offline after fetch · markdown + JSON output ·
non-zero exit on BLOCK · low-FP ruleset · findings explainable.

## Success / failure
- **Success:** a developer runs one line before installing a skill and gets a trustworthy, explained
  verdict; the tool (and its open ruleset) is adopted and contributed to across the ecosystem.
- **Failure:** false-positives erode trust; or it executes a hostile payload during "audit"; or it adds
  enough friction that people skip it.
