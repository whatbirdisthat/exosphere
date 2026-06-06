# ROADMAP — exosphere

> Agent-readable, tiered backlog. Source of truth for the IDEA: `doc/idea/exosphere-audit/brief.md`
> (+ `smu-seed.md`, `first-slice.md`, `handoff.md`). FOUNDRY ingests this; builder-lead tiers it.

## Tier 1 — FIRST VERTICAL SLICE (build now)

### R1 · `exosphere-audit` CLI — static supply-chain auditor (v1 slice)
- **STATUS:** ✅ COMPLETE — merged via PR #1 (merge `93d8bf0`, 2026-06-06). 100% coverage, corpus 100%/0%-FP, SENTINEL PASS. DELIVERY_COMPLETE.
- **PRIORITY:** P0 (the slice that proves the whole thesis end-to-end)
- **STACK:** TypeScript / Node → `handler-js`. Distributed as `npx exosphere-audit`.
- **OBJECTIVE:** A FOSS CLI `npx exosphere-audit <git-url | local-dir>` that fetches the source
  **read-only** (shallow clone to a temp dir; **never** runs build/install/post-install hooks),
  statically scans it across **four detection classes**, and emits an explained **PASS / REVIEW / BLOCK**
  verdict (markdown + JSON; **non-zero exit on BLOCK** for CI).
- **DETECTION CLASSES (v1):**
  1. `dangerous-bash` — exfiltration / RCE patterns (`curl … | sh`, `/dev/tcp` reverse shells,
     `cat ~/.aws` & secret reads, base64-piped payloads, writes outside the tree).
  2. `prompt-injection` — coercive/hidden instructions in SKILL.md / agent / CLAUDE.md bodies
     ("ignore previous instructions", tool-coercion, zero-width unicode, instructions in HTML comments).
  3. `over-broad-perms` — `"Bash(*)"` allow-all, hooks running network commands, MCP servers combining
     filesystem + network + secrets in one scope.
  4. `committed-secrets` — API keys / tokens / private keys committed in the audited files.
- **VERDICT MODEL:** per-finding `{rule, severity, file, line, excerpt, why}`; aggregate to
  PASS (no findings) / REVIEW (low–med) / BLOCK (any high → exit non-zero).
- **DESIGN VALUES (tie-breakers, in order):** (1) low false-positives (precision over recall at BLOCK);
  (2) explainability (every finding cites file:line + rule + why); (3) frictionless reach (`npx`, open
  ruleset); (4) the auditor never executes what it audits.
- **SUCCESS GATE (testable):** a labelled fixture corpus (malicious + benign): malicious → BLOCK with the
  correct file:line + rule; benign → PASS; aggregate **≥ 90% correct at ≤ 10% false-positive**. This
  corpus is built test-first alongside the scanner.
- **OUT-OF-SCOPE (v1 — do NOT build):** README trust-badge; hosted registry / continuous monitoring;
  runtime/execution-time guarding; auto-fix / remediation; spec/quality "drift" checks; non-Claude-Code
  harnesses (Cursor / Codex / Gemini).
- **ACCEPTED RISKS (do NOT re-litigate):** platform absorption (Anthropic may ship native review);
  existing incumbents (Sentry/AgentShield/Repello; Snyk researching). Objective is **reach & reputation**,
  FOSS/$0 — not a defended moat. Win on craft + distribution + native fit.

## Tier 2 — Backlog (after the slice ships green; not now)
- R2 · Author self-audit `audit .` + README trust-badge (the viral distribution loop).
- R3 · Curated/versioned community ruleset packaging (the "open ruleset" artefact).
- R4 · Spec/quality drift checks.
- R5 · Cross-harness support (Cursor/Codex/Gemini instruction files).
- R6 · Hosted registry / continuous monitoring (the platform play).
- R7 · Runtime/execution-time guard.

> Tier-2 items are explicitly parked. The cycle builds **R1 only**.
