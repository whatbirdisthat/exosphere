# EARS Specification — exosphere-audit (R1)

> EARS (Easy Approach to Requirements Syntax) requirements for ROADMAP-1, the first vertical slice.
> Source of truth: `doc/idea/exosphere-audit/brief.md`; domain: `doc/SUBJECT_MATTER_UNDERSTANDING.md`.
> Each statement is uniquely IDed, independently testable, and covers exactly one behaviour.
> Actors (SMU §2): cautious installer (primary), skill/plugin author (secondary), CI/automation (system).

## Input resolution

- **EARS-001** — WHEN the CLI is invoked with a single target argument that is an existing local
  directory, THE SYSTEM SHALL resolve the target as a **local-dir** input and read it in place.
- **EARS-002** — WHEN the CLI is invoked with a single target argument matching a git URL form
  (`https://`, `http://`, `git@`, `ssh://`, or a `.git` suffix), THE SYSTEM SHALL resolve the target
  as a **git-url** input.
- **EARS-003** — IF the CLI is invoked with no target argument, THEN THE SYSTEM SHALL exit non-zero
  with a usage error and SHALL NOT perform any acquisition.
- **EARS-004** — IF the target argument is neither an existing local directory nor a recognised git
  URL, THEN THE SYSTEM SHALL exit non-zero with an explained "cannot resolve input" error.

## Safe acquisition (the never-execute invariant)

- **EARS-005** — WHEN the input is a git-url, THE SYSTEM SHALL acquire the source via a shallow
  `git clone --depth 1` into a temporary directory with git hooks disabled
  (`core.hooksPath=/dev/null`) and SHALL NOT run any build, install, post-install, submodule, or hook
  step.
- **EARS-006** — WHILE auditing any artefact, THE SYSTEM SHALL NEVER execute the audited code, its
  scripts, or its hooks (no shell-out to audited content is permitted at any point).
- **EARS-007** — WHEN the input is a local-dir, THE SYSTEM SHALL read the directory in place and
  SHALL NOT mutate any audited file.
- **EARS-008** — WHEN an audit over a git-url acquisition completes (success or failure), THE SYSTEM
  SHALL remove the temporary clone directory.
- **EARS-009** — IF the shallow clone fails (unreachable URL, git error), THEN THE SYSTEM SHALL exit
  non-zero with an explained acquisition error and SHALL clean up any partial temp directory.

## Enumeration (skill SBOM)

- **EARS-010** — WHEN acquisition succeeds, THE SYSTEM SHALL enumerate the audited tree into a skill
  SBOM identifying skills (`SKILL.md`), agent definitions, `plugin.json`, `settings.json`, hook
  configs, bundled scripts (`.sh`/`.bash`), and MCP server configs.
- **EARS-011** — WHILE enumerating, THE SYSTEM SHALL skip version-control and dependency directories
  (`.git`, `node_modules`) so they are not scanned.

## Detection class: dangerous-bash

- **EARS-012** — WHEN a bundled script or instruction body contains a dangerous-bash exfiltration or
  RCE pattern (pipe-to-shell such as `curl … | sh`, a `/dev/tcp` reverse shell, a read of a known
  secret path such as `~/.aws` / `~/.ssh`, or a base64-piped payload), THE SYSTEM SHALL raise a
  finding of detection class `dangerous-bash` citing the file and line.

## Detection class: prompt-injection

- **EARS-013** — WHEN an instruction body (`SKILL.md`, agent, `CLAUDE.md`) contains a coercive
  prompt-injection pattern ("ignore previous instructions", tool-coercion directives, instructions
  hidden inside HTML comments, or zero-width unicode characters), THE SYSTEM SHALL raise a finding of
  detection class `prompt-injection` citing the file and line.

## Detection class: over-broad-perms

- **EARS-014** — WHEN a `settings.json`, hook, or MCP config grants an over-broad permission
  (an allow-all `Bash(*)` permission, a hook running a network command, or an MCP server combining
  filesystem + network + secret access in one scope), THE SYSTEM SHALL raise a finding of detection
  class `over-broad-perms` citing the file and line.

## Detection class: committed-secrets

- **EARS-015** — WHEN any audited file contains a committed secret (a recognised API key/token form or
  a private-key block), THE SYSTEM SHALL raise a finding of detection class `committed-secrets` citing
  the file and line.

## Finding shape & explainability

- **EARS-016** — WHEN the system raises a finding, THE SYSTEM SHALL populate it with
  `{ rule, severity, file, line, excerpt, why }`, where `file` and `line` locate the matched text and
  `why` is a human-readable explanation.
- **EARS-017** — WHILE scanning a benign artefact that contains no rule match, THE SYSTEM SHALL raise
  zero findings (precision over recall at the BLOCK threshold).

## Verdict aggregation

- **EARS-018** — WHEN scanning completes with no findings, THE SYSTEM SHALL produce the verdict
  **PASS**.
- **EARS-019** — WHEN scanning completes with findings whose maximum severity is low or medium, THE
  SYSTEM SHALL produce the verdict **REVIEW**.
- **EARS-020** — WHEN scanning completes with at least one high-severity finding, THE SYSTEM SHALL
  produce the verdict **BLOCK**.

## Output & exit code

- **EARS-021** — WHEN an audit completes, THE SYSTEM SHALL emit the verdict and findings as both a
  human-readable **markdown** report and a machine-readable **JSON** report.
- **EARS-022** — WHEN the verdict is BLOCK, THE SYSTEM SHALL exit with a non-zero status code; WHEN
  the verdict is PASS or REVIEW, THE SYSTEM SHALL exit with status zero.
- **EARS-023** — WHILE scanning (after acquisition completes), THE SYSTEM SHALL make no network calls
  (offline-after-fetch).

## ID register

Highest existing ID: **EARS-023**. Next new ID starts at EARS-024. IDs are permanent; never reuse.
