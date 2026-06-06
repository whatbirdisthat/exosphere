# IDEA brief — exosphere-audit

- **TITLE:** exosphere-audit — a supply-chain safety auditor for Claude Code skills & plugins
- **SLUG:** exosphere-audit
- **DATE:** 2026-06-06
- **PROBLEM:** Developers install third-party Claude Code skills/subagents/plugins that can run arbitrary
  Bash, carry prompt-injection payloads, request over-broad permissions, or ship committed secrets — and
  there is no frictionless, trustworthy way to check a skill is safe *before* you run it. The barrier to
  publishing is a SKILL.md + a week-old GitHub account; real malware campaigns (ClawHub, 30+ malicious
  skills) and Snyk's ToxicSkills study (prompt injection in 36% of skills, 1,467 malicious payloads)
  confirm the threat is live and current.
- **ACTORS:**
  - *Primary:* **the cautious installer** — a developer about to install/run a third-party skill or
    plugin who wants a one-line safety check first.
  - *Secondary:* **the skill/plugin author** — self-audits before publishing and earns a trust signal
    (README badge). Drives the viral distribution loop. (v1 supports `audit .`; the badge is roadmap.)
- **IN-SCOPE (v1):**
  - One CLI: `npx exosphere-audit <git-url | local-dir>` (auto-detect input).
  - Remote input fetched **read-only** (shallow clone to temp; **no build/install/post-install hooks ever
    run**; assume the source is hostile).
  - Four detection classes: **dangerous Bash/exfiltration**, **prompt-injection in instruction bodies**,
    **over-broad permissions/scopes** (settings.json / MCP / hooks), **committed secrets**.
  - Output: a **PASS / REVIEW / BLOCK** verdict + per-finding **severity + `file:line` + rule + why**,
    rendered as **markdown and JSON**, **non-zero exit on BLOCK** for CI use.
- **OUT-OF-SCOPE (v1):** spec/quality "drift" checks; runtime/execution-time guarding; a hosted
  registry / continuous-monitoring / trust-badge service; auto-fix/remediation; non-Claude-Code harnesses
  (Cursor/Codex/Gemini) — all explicit roadmap, not v1.
- **CONSTRAINTS:** TypeScript/Node, distributable as a zero-install `npx` one-liner (npm = the reach
  channel); the audit must **never execute** the audited code or its hooks; runs offline after fetch;
  ruleset tuned for **low false-positives** (a noisy security tool loses trust and reach); findings must
  be explainable (cite the matched line + rule).
- **SUCCESS-METRIC (testable):** On a labelled seed corpus of malicious + benign skills/plugins, v1
  **correctly classifies ≥ 90% at ≤ 10% false-positive rate**, and **every BLOCK cites `file:line` + the
  triggering rule**. (Product/reach goal, not a build gate: npm installs + GitHub stars trending up.)
- **PRICE-BAND:** **FOSS / $0.** Objective is **reach & reputation**, not revenue. Open-core monetisation
  is explicitly deferred and not a success metric.
- **LANGUAGE/STACK:** TypeScript / Node → FOUNDRY **handler-js**.
- **WILD-CARD:** ship a **curated, versioned, open ruleset** (Semgrep-style) as the artefact the community
  contributes to — the ruleset, not the binary, becomes the thing people reach for and trust.
