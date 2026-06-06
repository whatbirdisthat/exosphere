# ADR-005: External, declarative, contributable ruleset

**Status:** Accepted
**Date:** 2026-06-06
**Roadmap item:** ROADMAP R4 (Externalise the community ruleset)
**Spawning agent:** lifecycle-orchestrator (embodying handler-architect) at run top
**Supersedes/extends:** ADR-001 (Pipeline + pure-scan-core) and ADR-004 (tier-pluggable rule record).
The pure-core / never-execute boundary (ADR-001) and the tier-pluggable `Rule` record + framework
metadata (ADR-004) are unchanged. This ADR records how rules move *out of compiled scanner code* into a
versioned, externally-declared, contributable **data** ruleset that the engine loads.

## Context

R4 turns "my tool" into "the ecosystem's ruleset". The detection rules today live as compiled-in
TypeScript across five scanner modules (`src/core/scanners/*`). To let a contributor add a rule
**without touching engine code**, the rules must become a **versioned, externally-declared,
contributable ruleset** the engine loads — each rule a self-describing record carrying its own
pass/fail fixtures and a precision budget.

Two load-bearing constraints shape the decision:

1. **The ruleset is DATA, never code.** This is a security tool. Rule content must never be `eval`'d,
   `Function`-constructed, dynamically `require`d, or otherwise *executed*. A contributor-supplied
   rule file that attempts code execution must be structurally impossible to execute — the worst
   outcome for a security auditor is executing attacker-controlled rule data. (SMU §6 / ADR-001
   never-execute invariant, now extended to the rule data itself.)
2. **Behaviour preservation.** Externalisation is a refactor: every existing detection (all 5 classes,
   all current corpus fixtures) must produce **identical verdicts** loaded from the external ruleset.
   Parity is proven, not assumed.

The tension: most rules are line-regex patterns that *are* expressible as pure data, but a minority
need genuine structural logic (settings/MCP JSON scope parsing, frontmatter description extraction,
homoglyph/base64 decode-then-match, ANSI line-jump detection) that cannot be expressed as a single
regex over a line.

## Decision

**Split the rule into (a) a declarative `RuleSpec` data record and (b) a `compileRule` compiler that
turns data into the runtime `Rule`. A small fixed registry of named built-in structural matchers
covers the rules that genuinely need structural logic; the ruleset references them by name.**

### The data shape (`RuleSpec` — pure JSON-serialisable data)

```ts
interface RuleSpec {
  readonly id: string;
  readonly detectionClass: DetectionClass;
  readonly severity: Severity;
  readonly tier: RuleTier;             // 'T0' today (ADR-004 extension point preserved)
  readonly framework: FrameworkMapping;// OWASP + ATLAS (ADR-004 — required)
  readonly why: string;                // the human "why"
  readonly matcher: MatcherSpec;       // the declarative matcher vocabulary (below)
  readonly passFixtures: readonly RuleFixture[]; // benign inputs that MUST NOT match
  readonly failFixtures: readonly RuleFixture[]; // hostile inputs that MUST match
  readonly precisionBudget: number;    // max allowed corpus false-positive rate this rule may add (0 = none)
}

interface RuleFixture { readonly kind: ComponentKind; readonly content: string; }
```

### The matcher vocabulary (documented, closed set)

```ts
type MatcherSpec =
  | { readonly kind: 'line-pattern'; readonly pattern: string; readonly flags?: string;
      readonly appliesTo?: readonly ComponentKind[] }
  | { readonly kind: 'builtin'; readonly name: BuiltinMatcherName;
      readonly appliesTo?: readonly ComponentKind[] };
```

- **`line-pattern`** — a per-line regex. `pattern` is a regex *source string* and `flags` an optional
  flag string; the compiler builds a `RegExp` from them. A `RegExp` **matches** text — it never
  *executes* it. This covers the bulk of the rules declaratively: a contributor adds a pattern rule
  by writing data only.
- **`builtin`** — references one of a **fixed, named set** of structural matchers by string name. The
  contributor cannot define a new builtin in data; they choose from the documented vocabulary. The
  named builtins (`src/core/matchers/builtins.ts`) are the pre-existing structural functions:
  `zero-width-unicode`, `html-comment-instruction`, `homoglyph-override`, `encoded-override-payload`,
  `ansi-line-jumping`, `mcp-combined-scopes`, `frontmatter-coercive-description`,
  `mcp-tool-coercive-description`. Each is a pure function over a `FileRecord` (decode helpers stay in
  pure string space — ADR-004 — and never reach an execution sink).

### Why this is structurally incapable of executing rule data (the security core)

- **`pattern` is a string compiled with `new RegExp(source, flags)`.** A `RegExp` is a *matcher*,
  not an evaluator: it tests text against a pattern. There is no `eval`, no `Function`, no
  `require`/`import` of rule content anywhere in `compileRule`. A rule that tried to smuggle
  `"); doSomething(("` as its pattern is just an (invalid or literal) regex — at worst it fails to
  compile or matches nothing; it cannot run.
- **`builtin` selects a function by name from a closed registry.** The name indexes a fixed
  `Record<BuiltinMatcherName, …>`; an unknown name is a load-time validation error. Data cannot
  introduce new behaviour — only select from vetted, code-reviewed builtins.
- **Catastrophic-regex guard.** `compileRule` rejects an invalid regex source at load time with a
  typed `RulesetError` (never a raw throw mid-scan), so a malformed contributor pattern fails the
  build, not the audit.
- The default ruleset is shipped **in-repo as a typed `RuleSpec[]`** (`src/core/rules/*.rules.ts`):
  data the TypeScript compiler validates, requiring no parser and no filesystem read at scan time —
  so the offline + deterministic guarantees are unchanged and there is **no new runtime dependency**.
  An external JSON-loading path (reading a contributor file from disk) is an *adapter* concern for a
  later slice; v1 of R4 externalises the rules into a data layer with a stable schema + version and a
  documented contribution workflow, keeping rule *data* and engine *code* cleanly separated.

### Precision-budget discipline (mechanically enforced)

Each `RuleSpec` carries `passFixtures` (benign — must NOT match), `failFixtures` (hostile — MUST
match), and a `precisionBudget` (the max corpus false-positive rate the rule may introduce). A
dedicated test (`precision-budget.test.ts`) mechanically:

1. runs **every rule's own** pass/fail fixtures (fail-fixtures must each produce ≥1 match; pass-fixtures
   must produce 0), and
2. runs **every rule against the full benign corpus** and asserts the rule's measured false-positive
   rate ≤ its `precisionBudget`.

A rule that regresses corpus FP fails the build and must be tightened, not merged. The guard's own
correctness is proven by a test that constructs a deliberately-loose rule (a broad pattern that fires
on benign corpus files) and asserts the budget check **catches** it.

## Consequences

### Files & layers

| Layer | Path | Owns |
|---|---|---|
| Data schema | `src/core/types.ts` (`RuleSpec`, `MatcherSpec`, `RuleFixture`, `BuiltinMatcherName`, `RulesetError`) | the declarative rule data shape |
| Named builtins | `src/core/matchers/builtins.ts` | the closed registry of structural matchers (moved out of scanners) |
| Compiler | `src/core/compile.ts` (`compileRule`, `compileRuleset`) | `RuleSpec` (data) → `Rule` (runtime); regex + builtin lookup; load-time validation |
| Rule data | `src/core/rules/{dangerous-bash,prompt-injection,over-broad-perms,committed-secrets,tool-description-poisoning}.rules.ts` | the five detection classes as `RuleSpec[]` data |
| Ruleset | `src/core/ruleset.ts` | versioned union of all rule data → compiled `Rule[]`; `RULESET_VERSION`, `RULESET_SCHEMA_VERSION` |
| Contribution doc | `doc/RULESET.md` | the schema, matcher vocabulary, and the add-a-rule workflow |

The old `src/core/scanners/*` modules and `match-helpers.ts` are removed; their declarative patterns
become `line-pattern` data and their structural logic moves verbatim into the named builtins (behaviour
preserved — the matching functions are the same code, only relocated and selected by name).

### Schema version vs ruleset version

- `RULESET_SCHEMA_VERSION` — the version of the `RuleSpec` schema / matcher vocabulary (bumped only on
  a breaking schema change). Stable contract for contributors.
- `RULESET_VERSION` — the version of the curated rule *content* (already exists; R4 bumps it).

### No new runtime dependency

The compiler uses only `RegExp` (global) and the pre-existing pure builtins. **Zero runtime
dependencies added** — consistent with ADR-002/003/004 and the FOSS/no-backend thesis.

### Rejected alternatives

- **Load rules from an external JSON/YAML file at scan time (v1)** — deferred, not rejected in
  principle. It adds an IO/parse step (and a YAML parser would be a new runtime dep) for no R4-required
  value: the R4 gate is *externalised, declarative, contributable, versioned, schema'd, precision-
  budgeted* rule data — all achievable with in-repo typed data that the compiler validates with zero
  new deps and zero scan-time IO. The on-disk contributor-file loader is a clean future adapter slice
  on top of this schema.
- **`eval`/`Function`/`new Function` to let rules carry logic** — rejected outright and permanently:
  it would make rule data executable, the single worst outcome for a security auditor. The
  builtin-by-name registry gives structural power without executable data.
- **A `matcher` that is an arbitrary JS predicate string** — rejected: same executable-data hazard.
  The closed `line-pattern` + named-`builtin` vocabulary is the whole point — power without execution.
- **Keep a side-table of fixtures separate from the rule** — rejected: a rule must be self-describing
  (carry its own fixtures + budget) so a contributor lands a rule and its evidence atomically.

## Downstream instructions

- TEST-AGENT: place a parity coordinate that asserts the compiled-from-data ruleset reproduces the
  baseline oracle (`/tmp/parity-baseline.json`) verdict-and-finding-for-finding. Unit-pin `compileRule`
  (line-pattern + each builtin name), the load-time validation (invalid regex, unknown builtin name →
  `RulesetError`), and the precision-budget guard (including the deliberately-loose-rule catch). Add an
  abuse coordinate proving rule data carrying a code-exec string is treated as inert pattern data.
- IMPLEMENT-AGENT: move the structural functions into `matchers/builtins.ts` verbatim; convert the
  declarative patterns to `line-pattern` data; write `compileRule`; rebuild `ruleset.ts` to compile the
  data. Do not change any rule's matching behaviour. `core/*` still imports only `core/types` and never
  `node:fs` / `node:child_process`.
- STORY-AGENT: prove parity through the built CLI over the full corpus (identical verdicts), assert the
  precision-budget guard runs in the suite, and keep `exosphere-audit .` PASS.

## Revision history

| Date | Change | Reason |
|---|---|---|
| 2026-06-06 | Initial decision | FOUNDRY cycle R4 — external declarative contributable ruleset |
