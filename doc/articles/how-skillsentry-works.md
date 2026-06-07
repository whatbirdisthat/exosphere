# How skillsentry works

*A build-log, not a brochure. This is the reasoning behind a small static auditor for AI-agent skills —
what problem it solves, the one principle everything else follows from, and where it deliberately stops.*

---

## The problem: code that runs as you, vouched for by nobody

An **agent skill** — a Claude Code skill or plugin — is executable markdown bundled with scripts, hooks,
and tool/MCP configuration. When you install one, it doesn't run in a box. It runs with **your shell's full
authority**: your files, your credentials, your network, your cloud. And the bar to publish one is a
`SKILL.md` and an account. No mandatory review, no signing, no sandbox by default.

That is a supply chain, and supply chains get attacked. It's the same shape as a malicious npm or PyPI
package, with a few twists specific to agents:

- **Install-time RCE** — a hook that fetches and runs code the moment the skill is set up.
- **Prompt injection** — instructions aimed at the *model*, not the human: hidden in invisible unicode, in
  HTML comments, in encoded blobs, or in the tool **descriptions** you never actually read.
- **Over-broad permissions** — allow-all shell, or one MCP server fusing filesystem, network, and secrets,
  so a single compromise is total.
- **Committed secrets** — credentials shipped inside the skill.
- **The rug-pull** — a skill that's clean when you review it and turns dangerous in an update, exploiting
  the fact that nobody re-audits version 1.4.1.

This isn't hypothetical. The ClawHub campaign shipped 30+ malicious skills; Snyk's *ToxicSkills* research
found prompt injection in more than a third of the skills it tested. What was missing was the boring,
obvious thing: a way to *look at a skill before you run it*. skillsentry is that — built because it should
exist, not to be sold. It's MIT-licensed and free for the simple reason that a tool for deciding whether
something is safe to run shouldn't put that decision behind a paywall.

## The one principle: never execute what you audit

Every interesting decision in skillsentry falls out of a single rule: **the auditor must never execute,
fetch, or be influenced by the thing it audits.** A scanner that runs the payload to understand it has
already lost.

Taken seriously, that rule shapes the whole pipeline. An audit is a straight line from a target to a
verdict, and no stage ever runs audited code:

<p align="center">
  <img src="../guide/diagrams/pipeline-overview.svg" width="820" alt="The scan pipeline">
</p>

You give it a target — a local folder, or a git URL. For a URL it does a shallow, **read-only** clone:
`--depth 1 --no-checkout`, git hooks disabled (`core.hooksPath=/dev/null`), submodules off, LFS smudge
skipped. Nothing in the repository is permitted to run. It then walks the tree into a list of in-memory
file records, applies any `.skillsentryignore` (disclosing every exclusion), runs a ruleset over the files,
optionally diffs against an approved baseline, and aggregates the findings into one verdict. Markdown and
JSON come out the other end.

### Making "never execute" structural, not aspirational

A comment that says *"don't run the payload"* is worth nothing. So skillsentry doesn't rely on discipline —
it relies on **where code is allowed to live.** The codebase is three layers, and the dependency rule
between them is the entire safety argument:

<p align="center">
  <img src="../guide/diagrams/architecture-boundaries.svg" width="880" alt="Architecture boundaries">
</p>

- The **pure core** (`src/core/*`) — engine, rules, matchers, verdict, drift, report — imports `node:*`
  **nothing**. No `fs`, no `child_process`, no `crypto`, no network. It only ever sees in-memory data and
  returns plain data. A pure function can't shell out, so it can't be tricked into running a payload.
- The **adapters** (`src/adapters/*`) are the *only* code that touches the outside world: cloning, reading
  files, hashing, the lockfile. All I/O is quarantined here.
- The **CLI** wires adapters to the core and formats output.

This is the hexagonal / ports-and-adapters shape (ADR-001), and it is enforced by a test that scans every
core source file and **fails the build** if one imports a `node:` builtin. The guarantee is mechanical.

Two more properties follow from the same principle:

- **Zero runtime dependencies.** `package.json` has `dependencies: {}`. A tool that audits *your* supply
  chain having a supply chain of its own would be self-defeating — every transitive package is attack
  surface and a reason to doubt the verdict. Everything skillsentry needs is the Node standard library.
- **Deterministic and offline.** No clocks, no randomness, no network in the scan path, no model in the
  loop. Same input → same verdict, reproducible by anyone, including in air-gapped CI. (It's also what lets
  the trust badge and the approval lockfile be byte-stable.)

## How it actually detects things: the tiers

Detection is layered. Everything on by default stays deterministic, offline, and never-executing — so any
technique that would break those properties (an LLM judge, say) is reserved as a *future opt-in*, never a
default.

<p align="center">
  <img src="../guide/diagrams/tier-model.svg" width="880" alt="The detection tiers">
</p>

There are seven detection classes across three tiers:

- **T0 — pattern** (`dangerous-bash`, `prompt-injection`, `over-broad-perms`, `committed-secrets`,
  `tool-description-poisoning`): per-file regex and a closed set of vetted structural matchers, for the
  things a regex can't express cleanly — invisible-unicode tricks, homoglyphs, encoded payloads, JSON scope
  analysis.
- **T1 — dataflow / taint** (`dataflow-taint`): multi-line analysis of bundled shell scripts.
- **T3 — temporal / rug-pull** (`version-drift`): a diff against a previously approved baseline.

(There is no T2. The number is held for a possible future semantic tier; it's deliberately unbuilt because
it would break the offline/deterministic guarantee.)

Every finding carries its tier, a severity, and a **framework mapping** — an OWASP (Agentic / MCP / LLM
Top-10) id and a MITRE ATLAS technique id — so it lands in the vocabulary security teams already use.

### T1: when the payload is assembled in pieces

A single-line regex can't see this:

```sh
URL=$(get_secret)          # tainted: from a sensitive source
PAYLOAD=$(curl "$URL")     # still tainted: fetched with a tainted value
echo "$PAYLOAD" | sh       # SINK: tainted data piped into a shell
```

So T1 tracks **taint** — untrusted data — from a SOURCE, through variable assignments, to a dangerous SINK,
across lines and (via `source`) across files. It runs entirely in string space: tokenizing, never
executing, never fetching.

<p align="center">
  <img src="../guide/diagrams/taint-flow.svg" width="740" alt="T1 taint flow">
</p>

A `source ./lib.sh` is resolved *in memory and path-safely* — never fetched, never run — and tainted
variables flow in from the sibling; an include that escapes the target root is itself a finding (ADR-006,
ADR-007). It's honest about its edges: taint through shell *function parameters* isn't modelled, and
languages other than shell aren't covered — JS/TS interprocedural taint would need a parser, which would
mean a dependency, so it's deferred rather than faked.

### T3: catching the rug-pull

The rug-pull is the attack a stateless scanner *cannot* see: clean at approval, dangerous later. T3 closes
that gap with an approval baseline. You run `skillsentry <target> --approve` once, which writes a
`.skillsentry.lock` recording the skill's **capability fingerprint**. On later runs, if the lockfile is
present, skillsentry diffs the current scan against it.

<p align="center">
  <img src="../guide/diagrams/drift-classification.svg" width="680" alt="Drift classification">
</p>

The crucial design choice: the diff keys on the **capability set** (the findings, permissions, scripts,
hooks), *not* on raw file bytes. A documentation edit or a version bump changes the bytes but not the
capabilities — so it's reported as a benign, informational note, not a finding. A *new* sink, permission,
or hook is an escalation: the rug-pull signal.

Two properties make this trustworthy rather than gameable (ADR-008):

- **Additive-only.** The verdict is `aggregate(fresh ∪ drift)`. The lockfile can only *add* findings, never
  remove one — the fresh scan always runs and sets the floor. So a permissive lockfile **cannot lower a
  verdict.** Laundering a BLOCK through a hand-crafted lockfile is structurally impossible, not merely
  discouraged.
- **Disclosure.** Any high-severity finding the lockfile *pre-approved* is surfaced in the report. A
  baseline that once blessed something dangerous is shown, not trusted blindly.

## Rules are data, not code

There's a tension in a tool like this: you want a growing, community-contributable ruleset, but every rule
is a place where attacker-controlled-looking text meets your engine. skillsentry resolves it by making
rules **declarative data** that the engine *interprets* — never code it runs.

<p align="center">
  <img src="../guide/diagrams/rule-compilation.svg" width="760" alt="How a rule compiles">
</p>

A `RuleSpec` declares an id, severity, tier, framework mapping, a matcher, pass/fail fixtures, and a
precision budget. At load time it compiles to a runnable matcher in exactly two ways: a `line-pattern`
becomes a `RegExp` (which *matches* text — it never executes it), or a `builtin` selects a vetted,
code-reviewed function from a **closed registry**. A rule cannot invent new behaviour; data cannot define
logic. There is no `eval`, no `Function`, no dynamic `import`, no shell anywhere in the loading path (ADR-005).
The worst a malicious rule pattern can do is fail to compile.

This is also where quality is enforced. Each rule ships with **fail fixtures** (hostile inputs that must
match) and **pass fixtures** (benign near-misses that must not), plus a **precision budget** — the maximum
corpus false-positive rate it's allowed. A rule that pushes false positives over budget is reverted, not
merged. The bias is explicit: at BLOCK, *precision over recall*. A false alarm that blocks a good skill
erodes trust faster than a miss.

## The verdict, and telling you the truth

Findings collapse to a single verdict — the highest severity present wins:

<p align="center">
  <img src="../guide/diagrams/verdict-model.svg" width="720" alt="Verdict model">
</p>

- **PASS** (exit `0`) — no findings.
- **REVIEW** (exit `0`) — the highest finding is low or medium; read them and decide.
- **BLOCK** (exit `1`) — at least one high-severity finding; the non-zero exit gates CI.

Only BLOCK is non-zero, so skillsentry drops into a pipeline without failing builds on advisory findings.
And there's no opaque "risk score": every finding gives you the rule id, the exact `file:line`, the
matched excerpt, a plain-language *why*, and the framework ids — enough to verify the verdict yourself.

Transparency is load-bearing in the other direction too. A `.skillsentryignore` can narrow a scan — for a
repo (like skillsentry's own) that legitimately contains attack patterns in its fixtures and docs — but the
report still **counts and discloses every exclusion**, and `--no-ignore` re-scans everything. An ignore
file, like a lockfile, can never *silently* bury a finding. A clean verdict whose basis you can't see is
worthless.

## What it does *not* catch

The fastest way to lose trust is to imply you catch everything, so here is the boundary, plainly:

- **It is not a sandbox or a runtime guard.** It informs a decision *before* you run a skill and does
  nothing while it runs.
- **PASS is not a proof of safety.** It means "no rule matched." Novel attacks, clever natural-language
  injection, and obfuscation beyond the modelled tiers can pass. Absence of evidence isn't evidence of
  absence.
- **Coverage is partial by language.** T1 dataflow is shell; JS/TS taint is deferred (it needs a parser
  dependency).
- **Secret detection is format-based** and scans the working tree, not git history.
- **Threats outside the skill's files are out of scope** — a compromised model, a malicious MCP server you
  connect to at runtime, social engineering.

Treat a clean verdict as one strong input to your judgement, not a substitute for it. That honesty *is* the
security posture.

## Where to go next

- The [guide](../guide/) — [architecture](../guide/architecture.md),
  [how detection works](../guide/how-detection-works.md),
  [threat model & reading a report](../guide/threat-model.md), and a [glossary](../guide/glossary.md).
- The [ADRs](../architecture/) — the recorded rationale for each decision above.
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) and the [ruleset guide](../RULESET.md) — to add a detector.

skillsentry is small on purpose. The interesting part isn't the line count; it's that one principle —
*never execute what you audit* — taken seriously enough to shape the architecture, the rule system, and the
honesty about limits. Read it before you trust it. 🛸
