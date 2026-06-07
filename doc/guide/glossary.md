# Glossary

Terms used across skillsentry's code and docs, in plain language. Where a word has a precise meaning here
that differs from everyday use, that meaning is given.

### Agent skill (skill / plugin)
Executable markdown plus scripts, hooks, and tool/MCP configuration that an AI coding agent loads and runs
with the user's authority. The thing skillsentry audits.

### Detection class
A category of problem a rule looks for. The seven: `dangerous-bash`, `prompt-injection`,
`over-broad-perms`, `committed-secrets`, `tool-description-poisoning` (all T0), `dataflow-taint` (T1), and
`version-drift` (T3). See [How detection works](./how-detection-works.md).

### Tier (T0 / T1 / T3)
*How* a finding is produced, not *what* it finds. **T0** = per-file pattern/structural rules. **T1** =
multi-line shell dataflow/taint. **T3** = temporal diff against an approved baseline. (**T2** is reserved,
unbuilt: a semantic/LLM tier would break the offline+deterministic guarantee, so it could only ever be
opt-in.)

### Verdict (PASS / REVIEW / BLOCK)
The single result of a scan, set by the highest-severity finding: none → PASS, low/medium → REVIEW, any
high → BLOCK. Only BLOCK exits non-zero. See [Reading a report](./threat-model.md#reading-a-report).

### Severity (low / medium / high)
A finding's seriousness. The verdict is the max severity across all findings; a single high → BLOCK.

### Finding
One detected issue: `{ rule, detectionClass, severity, file, line, excerpt, why, tier, owasp, atlas }`.
Every field is there so you can verify the finding yourself.

### Framework mapping (OWASP / MITRE ATLAS)
Two standard identifiers carried by every rule — an [OWASP](https://owasp.org/) Agentic/MCP/LLM Top-10 id
and a [MITRE ATLAS](https://atlas.mitre.org/) technique id — so a finding connects to frameworks security
teams already track. Mandatory on every rule (a missing mapping fails the build).

### Taint / SOURCE / SINK (dataflow)
Taint analysis tracks **untrusted data** (taint) from where it enters (a **SOURCE** — e.g. a network
fetch) to where it becomes dangerous (a **SINK** — e.g. a pipe into `sh`). T1 follows taint across lines
and files in shell scripts, statically, without running them.

### Rug-pull / version drift
An attack where a skill is clean at approval and gains dangerous capability afterward. Detected by T3 by
comparing the current scan to a recorded baseline.

### Capability fingerprint
The trust-relevant *set* of a skill's capabilities at approval time (its findings + permissions + scripts +
hooks), stored in the lockfile. T3 diffs *this set* — not raw file bytes — so benign edits don't false-fire.

### `.skillsentry.lock` (approval lockfile)
A deterministic, byte-stable file written by `--approve` recording the capability fingerprint and per-file
hashes. On later runs it's the baseline for T3 drift detection. It can only **add** findings, never suppress
one (the *additive-only* invariant).

### Additive-only invariant
The rule that a lockfile can raise a verdict but never lower it: `verdict = aggregate(fresh ∪ drift)`. It's
what makes laundering a BLOCK through a permissive lockfile structurally impossible.

### `.skillsentryignore`
A gitignore-style file letting a target exclude paths from the scan (e.g. rule sources, fixtures). Every
exclusion is disclosed in the report; `--no-ignore` overrides it. Transparency over trust.

### Precision budget
The maximum corpus false-positive rate a rule is allowed. A rule that exceeds it is reverted, not merged —
precision is the bar. Defined per rule alongside its fixtures.

### Rule / RuleSpec / matcher / builtin
A **RuleSpec** is the declarative *data* for a detector (id, severity, tier, framework, matcher, fixtures,
budget). It compiles to a runnable **Rule**. A **matcher** is either a `line-pattern` (a regex) or a
**builtin** (a vetted function chosen from a closed registry). Data, never executable code.

### Fixtures (pass / fail)
Labelled examples shipped with a rule: **fail fixtures** must match (hostile inputs), **pass fixtures** must
not (benign near-misses). They pin the rule's behaviour as a test.

### Pure core / adapters
The architectural split: the **pure core** (`src/core/*`) imports no `node:*` and does no I/O; **adapters**
(`src/adapters/*`) are the only code that touches the filesystem, network, or crypto. This is what makes
"never execute" structural. See [Architecture](./architecture.md).

### EARS
*Easy Approach to Requirements Syntax* — the structured "WHEN … THE SYSTEM SHALL …" format used in
[`doc/SPECIFICATION.ears.md`](../SPECIFICATION.ears.md) to write testable requirements.

### ADR
*Architecture Decision Record* — a short document capturing one significant decision and its rationale.
skillsentry's are in [`doc/architecture/`](../architecture/).

### SMU
*Subject Matter Understanding* — [the domain foundation doc](../SUBJECT_MATTER_UNDERSTANDING.md): the
vocabulary, design values, and constraints every contributor (human or agent) shares.
