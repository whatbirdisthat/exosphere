# Changelog

All notable changes to skillsentry are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project aims to follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

The `0.1.0` line below is built and merged to `main` but not yet published to npm.

### Documentation
- An educational guide set under [`doc/guide/`](./doc/guide/) — architecture, how-detection-works, threat
  model + how to read a report, and a glossary — with seven diagrams (source + rendered SVG).
- README retoned toward a how-and-why voice; `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` added.

## [0.1.0] — 2026-06-07

The first complete vertical slice of the auditor, built and merged across several increments.

### Added
- **Static skill auditor** — `npx skillsentry <git-url | local-dir>`: fetches a target read-only (shallow
  clone, hooks disabled, never executes), scans it, and emits a PASS / REVIEW / BLOCK verdict as markdown +
  JSON, non-zero exit on BLOCK. (R1)
- **Detection — tier T0 (pattern):** `dangerous-bash`, `prompt-injection`, `over-broad-perms`,
  `committed-secrets`, and `tool-description-poisoning`, each finding mapped to OWASP (Agentic/MCP/LLM) +
  MITRE ATLAS, including encoding/obfuscation evasion (homoglyphs, base64/hex, ANSI line-jumping,
  zero-width unicode). (R1, R9a)
- **Detection — tier T1 (dataflow/taint):** deterministic, dependency-free shell taint analysis tracking a
  tainted source to a dangerous sink across lines (R9b) and across files via `source` (R9b.1).
- **Detection — tier T3 (rug-pull / version-drift):** `--approve` records a `.skillsentry.lock` capability
  fingerprint; later runs diff against it to flag post-approval escalation, with an additive-only invariant
  (a lockfile can never lower a verdict) and anti-laundering disclosure. (R9d)
- **`.skillsentryignore`** — gitignore-style excludes, with every exclusion counted and disclosed;
  `--no-ignore` forces a full scan. (R3)
- **`--badge`** — a deterministic, offline "audited by skillsentry" trust badge on a clean PASS; **`--ci`**
  — non-zero exit only on BLOCK for pipelines. (R2)
- **Externalised, contributable ruleset** — rules as declarative data with per-rule fixtures, framework
  IDs, and a precision budget that reverts any rule which regresses corpus false-positives. (R4)

### Engineering
- Zero runtime dependencies; pure-core / adapter split with a build-time layering test enforcing
  never-execute (ADR-001); 100% test coverage against a labelled malicious + benign corpus; CI matrix
  (Node 18/20/22), pack smoke test, and self-audit dogfooding.

### Notes
- Renamed from `exosphere-audit` to **skillsentry** during this line. (R10)

[Unreleased]: https://github.com/whatbirdisthat/skillsentry/compare/main...HEAD
[0.1.0]: https://github.com/whatbirdisthat/skillsentry/releases/tag/v0.1.0
