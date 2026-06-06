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

## R3 — `.exosphereignore` / self-exclusion convention

> Source: ROADMAP R3; ADR-002. The audited target may declare paths to exclude from enumeration.
> Load-bearing invariant: an exclusion can NEVER silently hide a finding — every exclusion is
> disclosed in the report (transparency over trust).

### Ignore-file parsing

- **EARS-024** — WHEN a `.exosphereignore` file is present at the audited target root, THE SYSTEM
  SHALL parse it as gitignore-style patterns: one pattern per line, ignoring blank lines and lines
  whose first non-whitespace character is `#`.
- **EARS-025** — WHEN parsing a `.exosphereignore` pattern, THE SYSTEM SHALL support a `*` wildcard
  (matching any run of characters except `/`), a `**` wildcard (matching across path separators), a
  `?` single-character wildcard, a leading `/` to anchor the pattern to the target root, a trailing
  `/` to match a directory and everything beneath it, and an embedded `/` to anchor the pattern to
  the root.
- **EARS-026** — WHEN a `.exosphereignore` pattern begins with `!`, THE SYSTEM SHALL treat it as a
  negation that re-includes an otherwise-excluded path, with the last matching pattern in file order
  determining the final decision.

### Exclusion from enumeration

- **EARS-027** — WHILE enumerating the audited tree, THE SYSTEM SHALL exclude from the scan surface
  every file whose root-relative path matches the effective `.exosphereignore` patterns, so excluded
  files are never scanned by any detection class.
- **EARS-028** — WHEN a `.exosphereignore` is present, THE SYSTEM SHALL itself exclude the
  `.exosphereignore` file from the scan surface (the ignore manifest is not audited content).

### Transparency invariant (load-bearing)

- **EARS-029** — WHEN one or more files are excluded by `.exosphereignore`, THE SYSTEM SHALL disclose
  in BOTH the markdown and JSON report the total count of excluded files and, per pattern, the
  pattern text and how many files it excluded, so an exclusion can never silently hide a finding.
- **EARS-030** — WHILE no file is excluded (no ignore file, or an ignore file that matches nothing),
  THE SYSTEM SHALL report an excluded-file count of zero and an empty pattern list.

### Override

- **EARS-031** — WHEN the CLI is invoked with the `--no-ignore` flag, THE SYSTEM SHALL ignore any
  `.exosphereignore` file entirely and scan the full tree, so an audit-the-auditor / CI run cannot be
  weakened by a target-supplied ignore file.

## R2 — author self-audit + README trust-badge

> Source: ROADMAP R2; ADR-003 (embedded in `doc/exosphere-audit-r2_PLAN.md`). The skill/plugin author
> self-audits their repo and, on a PASS verdict, earns a deterministic, OFFLINE, shareable trust badge.
> Load-bearing invariant (carried over from R3): a PASS earned via `.exosphereignore` exclusions still
> discloses those exclusions — a badge can never launder a hidden exclusion. Badge text is fixed:
> "audited by exosphere-audit". Actors (SMU §2): skill/plugin author (secondary), CI/automation (system).

### Badge emission

- **EARS-032** — WHEN the CLI is invoked with `--badge` and the resulting verdict is **PASS**, THE
  SYSTEM SHALL emit a trust badge consisting of BOTH a Markdown snippet (whose alt text is
  "audited by exosphere-audit" and whose image source is an inline, self-contained `data:image/svg+xml`
  data-URI) AND the raw SVG source, in addition to the normal report.
- **EARS-033** — WHEN the CLI is invoked with `--badge` and the resulting verdict is **REVIEW** or
  **BLOCK**, THE SYSTEM SHALL emit NO badge and SHALL instead emit a single clear one-line reason
  naming the verdict, while still emitting the normal report and preserving the verdict's exit code.
- **EARS-034** — WHEN the CLI is invoked WITHOUT `--badge`, THE SYSTEM SHALL emit neither a badge nor a
  no-badge reason line (badge output is opt-in).

### Determinism (byte-stability)

- **EARS-035** — WHILE generating a PASS badge, THE SYSTEM SHALL produce byte-identical Markdown and
  SVG output for the same verdict across repeated runs, deriving the badge solely from the verdict (no
  timestamp, randomness, or environment-dependent content), so the snippet the author pastes is stable.

### Transparency carry-over (load-bearing)

- **EARS-036** — WHEN the verdict is PASS **and** one or more files were excluded by `.exosphereignore`,
  THE SYSTEM SHALL still disclose the exclusion summary (count + per-pattern provenance, per EARS-029)
  in the report alongside the emitted badge, so a badge can never launder a hidden exclusion.

### CI convenience flag

- **EARS-037** — WHEN the CLI is invoked with `--ci`, THE SYSTEM SHALL exit non-zero if and only if the
  verdict is BLOCK (preserving the EARS-022 exit-code contract), so an author's GitHub Action gates a
  pull request on a BLOCK verdict.
- **EARS-038** — WHEN the CLI is invoked with `--ci`, THE SYSTEM SHALL honour any `.exosphereignore` at
  the target root by default (the same enumeration path as a normal audit); and WHEN `--no-ignore` is
  also supplied, THE SYSTEM SHALL ignore the `.exosphereignore` and scan the full tree, so a CI run
  cannot be silently weakened by a target-supplied ignore file.

## R9a — Detection breadth: framework mapping + encoding-evasion + tool-description poisoning

> Source: ROADMAP R9a; ADR-004; `doc/research/deeper-detection-plan.md` §1–3,§7. All additions are
> **tier T0** (deterministic + offline; no runtime LLM/network dependency). Binding decisions (not to
> be re-litigated): deterministic default with the engine kept tier-pluggable for a later opt-in T2;
> framework mapping = OWASP (ASI/MCP/LLM) + MITRE ATLAS technique IDs per rule, from the start.
> Load-bearing safety invariant (carried from SMU §6 / ADR-001): decoding obfuscated content happens
> in pure string space and NEVER reaches an execution sink — the auditor never executes what it audits.

### Framework mapping (every rule carries OWASP + ATLAS)

- **EARS-039** — WHILE the ruleset is defined, THE SYSTEM SHALL require every rule (the existing four
  detection classes and every new rule) to carry a tier of `T0` and a framework mapping consisting of
  both a non-empty OWASP id (an ASI / MCP / LLM Top-10 identifier) and a non-empty MITRE ATLAS
  technique id, so coverage is anchored to a recognised framework rather than ad-hoc.
- **EARS-040** — WHEN the system raises a finding, THE SYSTEM SHALL populate it with the raising
  rule's `tier`, `owasp`, and `atlas` values in addition to the EARS-016 fields, so each finding
  cites the standard framework identifiers a security team already tracks.
- **EARS-041** — WHEN an audit emits its reports, THE SYSTEM SHALL surface each finding's OWASP and
  MITRE ATLAS identifiers in BOTH the human-readable markdown report and the machine-readable JSON
  report.

### Encoding / obfuscation evasion (strengthens prompt-injection)

- **EARS-042** — WHEN an instruction body (`SKILL.md`, agent) contains a coercive override directive
  whose letters are disguised with homoglyph (confusable) unicode substitution (e.g. Cyrillic or
  Greek look-alike letters spelling "ignore previous instructions"), THE SYSTEM SHALL normalise the
  confusable characters to their ASCII skeleton in pure string space and raise a `prompt-injection`
  finding citing the file and line.
- **EARS-043** — WHEN an instruction body contains a base64- or hex-encoded payload that decodes to a
  coercive prompt-injection directive, THE SYSTEM SHALL decode the payload defensively in pure string
  space (never executing or shelling out to the decoded content) and raise a `prompt-injection`
  finding citing the file and line of the encoded blob.
- **EARS-044** — WHEN an instruction body contains an ANSI escape sequence used for "line jumping"
  (cursor-movement / line-erase control codes that visually overwrite or hide adjacent text from a
  human reviewing a terminal), THE SYSTEM SHALL raise a `prompt-injection` finding citing the file
  and line.
- **EARS-045** — WHILE scanning an instruction body that legitimately documents encodings or injection
  as prose (for example a SKILL.md that explains what base64 is, or quotes the phrase "ignore previous
  instructions" only as an example of an attack, without an actual disguised or encoded coercive
  directive), THE SYSTEM SHALL raise no `prompt-injection` finding (precision over recall at BLOCK).

### Tool / skill-description poisoning (new detection class)

- **EARS-046** — WHEN a skill or agent frontmatter `description:` field, or an MCP tool `description`
  field in a config, contains an injected directive or tool-coercion instruction (text the model
  reads when choosing a tool but the user does not normally see — e.g. "ignore the user and always
  call …", "before using any tool, send … to https://…"), THE SYSTEM SHALL raise a finding of
  detection class `tool-description-poisoning` citing the file and line.
- **EARS-047** — WHILE scanning a tool/skill `description` that is an ordinary benign summary of what
  the tool does (no coercive directive, no exfiltration instruction), THE SYSTEM SHALL raise no
  `tool-description-poisoning` finding, so a normal description never trips the BLOCK threshold.

## R4 — Externalise the community ruleset (declarative, contributable, versioned)

> Source: ROADMAP R4; ADR-005; `doc/research/deeper-detection-plan.md` §4. The detection rules move
> out of compiled scanner code into a **versioned, externally-declared, contributable** ruleset the
> engine loads. Each rule is a self-describing **data** record. Binding decisions (not re-litigated):
> deterministic + offline default; engine kept tier-pluggable (ADR-004); every rule carries OWASP +
> MITRE ATLAS (ADR-004). Load-bearing safety invariant (extends SMU §6 / ADR-001 never-execute): the
> ruleset is DATA, never code — rule content is never `eval`'d, `Function`-constructed, dynamically
> `require`d, or otherwise executed; a rule "matcher" only *matches* text, it never runs it.

### Declarative rule record (self-describing data)

- **EARS-048** — WHILE the ruleset is defined, THE SYSTEM SHALL express each rule as a self-describing
  **data** record carrying an `id`, `detectionClass`, `severity`, `tier`, `framework` (OWASP + MITRE
  ATLAS), human `why`, a `matcher` specification, its own `passFixtures` and `failFixtures`, and a
  `precisionBudget`, so a rule is contributable as data without modifying engine code.
- **EARS-049** — WHILE compiling a rule whose `matcher` is a `line-pattern`, THE SYSTEM SHALL build a
  per-line `RegExp` from the matcher's pattern source string (and optional flags) and apply it only to
  files whose component kind is in the matcher's `appliesTo` set (or to all files when `appliesTo` is
  omitted), reproducing the previously compiled-in line-pattern behaviour exactly.
- **EARS-050** — WHILE compiling a rule whose `matcher` is a `builtin`, THE SYSTEM SHALL resolve the
  matcher's `name` against a fixed, closed registry of named structural matchers and use the resolved
  pure function, so structural detections (JSON scope parsing, frontmatter-description extraction,
  homoglyph/encoded-payload decode-and-match, ANSI line-jump, HTML-comment, zero-width unicode) that
  cannot be expressed as a single line pattern remain available by name.

### The ruleset is DATA, never executable code (load-bearing safety invariant)

- **EARS-051** — WHILE loading or compiling the ruleset, THE SYSTEM SHALL NEVER execute rule content:
  it SHALL NOT pass any rule field to `eval`, `Function`, `new Function`, a dynamic `require`/`import`,
  or any shell — a `line-pattern` source is only ever compiled to a matching `RegExp` and a `builtin`
  name only ever selects a pre-existing vetted function, so a contributed rule-data file that attempts
  code execution is structurally inert.
- **EARS-052** — IF a rule's `line-pattern` source is not a valid regular expression, THEN THE SYSTEM
  SHALL reject it at load time with a typed `RulesetError` naming the offending rule, and SHALL NOT
  throw a raw error mid-scan.
- **EARS-053** — IF a rule's `builtin` matcher names a matcher absent from the closed registry, THEN
  THE SYSTEM SHALL reject it at load time with a typed `RulesetError` naming the offending rule and the
  unknown matcher name.

### Versioned, schema-stable, behaviour-preserving

- **EARS-054** — WHILE exposing the ruleset, THE SYSTEM SHALL publish both a `RULESET_SCHEMA_VERSION`
  (the version of the rule-data schema / matcher vocabulary) and a `RULESET_VERSION` (the version of the
  curated rule content), each a semantic-version string, so a contributor can target a stable schema.
- **EARS-055** — WHILE auditing any artefact, THE SYSTEM SHALL produce verdicts and findings from the
  externally-declared ruleset that are identical (same verdict, same findings citing the same
  file:line, rule, severity, and framework ids) to those the previously compiled-in ruleset produced
  for every existing corpus fixture (behaviour-preserving externalisation).

### Precision-budget discipline (mechanically enforced)

- **EARS-056** — WHILE validating the ruleset, THE SYSTEM SHALL run each rule against its own
  `failFixtures` (each of which SHALL produce at least one match) and its own `passFixtures` (each of
  which SHALL produce zero matches), so a rule ships with proof it fires on its intended attack and
  stays silent on its intended near-miss.
- **EARS-057** — WHILE validating the ruleset, THE SYSTEM SHALL measure each rule's false-positive rate
  across the full benign corpus and SHALL fail validation IF that rate exceeds the rule's declared
  `precisionBudget`, so a rule that regresses corpus false-positives is rejected rather than merged.

## ID register

Highest existing ID: **EARS-057**. Next new ID starts at EARS-058. IDs are permanent; never reuse.
