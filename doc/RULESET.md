# Contributing rules to the skillsentry ruleset

> The detection ruleset is **data, not code** (ADR-005 / ROADMAP R4). You add a rule by writing a
> self-describing `RuleSpec` record and its fixtures — **without touching the engine**. This document
> is the schema, the matcher vocabulary, and the workflow.
>
> **Load-bearing safety invariant:** a rule is never *executed*. A `line-pattern` source is only ever
> compiled to a *matching* `RegExp`; a `builtin` name only ever selects a pre-existing, code-reviewed
> structural function. There is no `eval`, no `Function`, no dynamic `require`/`import`, and no shell
> anywhere in the rule-loading path. A rule-data file that tries to smuggle executable code is
> structurally inert.

## Versions

| Constant (`src/core/ruleset.ts`) | Meaning | When to bump |
|---|---|---|
| `RULESET_SCHEMA_VERSION` | The version of the `RuleSpec` schema / matcher vocabulary | only on a **breaking** schema change (new required field, changed matcher shape) |
| `RULESET_VERSION` | The version of the curated rule **content** | every time you add / change / remove a rule (semantic-version the content) |

A contributor targets a stable `RULESET_SCHEMA_VERSION`; the content version moves underneath it.

## The rule record (`RuleSpec`)

A rule is a plain TypeScript data object (validated by the compiler at load time). Defined in
`src/core/types.ts`:

```ts
interface RuleSpec {
  id: string;                 // unique, namespaced: "<detection-class>/<short-name>"
  detectionClass: DetectionClass;   // one of the six classes (below)
  severity: 'low' | 'medium' | 'high';  // 'high' forces a BLOCK verdict
  tier: 'T0' | 'T1';          // T0 = pattern/structural; T1 = shell dataflow/taint (ADR-006/007). Both
                              // are deterministic + offline + never-executing and run by default. The
                              // union is the ADR-004 extension point. (T3 — the R9d temporal/drift tier,
                              // ADR-008 — also exists, but is NOT a contributable rule: it is a temporal
                              // pass over (freshScan, .skillsentry.lock) wired at the engine/adapter edge,
                              // not a per-file matcher, so it never appears in a RuleSpec.)
  framework: { owasp: string; atlas: string };  // BOTH required — OWASP + MITRE ATLAS ids
  why: string;                // the human-readable reason a reviewer sees on the finding
  matcher: MatcherSpec;       // how the rule matches (the vocabulary below)
  passFixtures: RuleFixture[];// benign inputs this rule MUST NOT match (≥1 required)
  failFixtures: RuleFixture[];// hostile inputs this rule MUST match (≥1 required)
  precisionBudget: number;    // max corpus false-positive rate this rule may add (use 0)
}

interface RuleFixture { kind: ComponentKind; content: string; }
```

`detectionClass` is one of: `dangerous-bash`, `prompt-injection`, `over-broad-perms`,
`committed-secrets`, `tool-description-poisoning`, `dataflow-taint` (R9b — the T1 shell taint class).
(A seventh class, `version-drift`, exists for the R9d T3 temporal tier — ADR-008 — but it is raised by
the drift pass, not by a contributable `RuleSpec`, so a rule author never sets it.)

`framework.owasp` is an OWASP ASI / MCP / LLM Top-10 id (e.g. `ASI04`, `MCP-T01`, `LLM01`);
`framework.atlas` is a MITRE ATLAS technique id (e.g. `AML.T0051`). Both are **required** — the type
system rejects a rule that omits either, so framework coverage is a compile-time invariant.

## The matcher vocabulary (`MatcherSpec`)

A matcher is a **closed** discriminated union. You pick one of two kinds:

### 1. `line-pattern` — a declarative per-line regex (the common case)

```ts
{ kind: 'line-pattern', pattern: string, flags?: string, appliesTo?: ComponentKind[] }
```

- `pattern` is a **regex source string** (escape backslashes for the string literal, e.g. `'\\bAKIA'`).
  The compiler builds `new RegExp(pattern, flags)` and tests it against each line. The `g` flag is
  stripped (matching is per-line and stateless).
- `flags` — optional regex flags (e.g. `'i'` for case-insensitive). Omit if none.
- `appliesTo` — optional list of `ComponentKind`s the rule is restricted to (e.g.
  `['settings', 'mcp-config', 'hook']`). Omit to apply to every file.

Most rules are line-patterns — you can add one as **data only**.

### 2. `builtin` — a named structural matcher (when a regex over one line is not enough)

```ts
{ kind: 'builtin', name: BuiltinMatcherName, appliesTo?: ComponentKind[] }
```

Use this only when the detection needs structural logic a single line-regex cannot express (JSON scope
parsing, frontmatter extraction, decode-then-match, multi-character control-code analysis). You choose
from the **closed registry** (`src/core/matchers/builtins.ts`); you cannot define a new builtin in data.
The vocabulary today:

| `name` | What it detects |
|---|---|
| `zero-width-unicode` | zero-width / bidi-control characters hiding instructions in `skill`/`agent` bodies |
| `html-comment-instruction` | a directive hidden inside an HTML comment in `skill`/`agent` bodies |
| `homoglyph-override` | a coercive override disguised with confusable (homoglyph) unicode |
| `encoded-override-payload` | a base64/hex-encoded override decoded **defensively** (never executed) |
| `ansi-line-jumping` | ANSI cursor-movement / line-erase escapes that visually hide text |
| `mcp-combined-scopes` | an MCP server combining filesystem + network + secret scopes |
| `frontmatter-coercive-description` | a coercive directive in a `skill`/`agent` frontmatter `description:` |
| `mcp-tool-coercive-description` | a coercive directive in an MCP tool `description` field |
| `shell-taint-to-sink` *(T1)* | a tainted SOURCE (command-sub / fetch / decode / sensitive env / stdin) flowing **across lines** into a dangerous SINK (pipe-to-shell, `eval`/`exec`, `source`, autorun write) in a `script`/`hook` — multi-line obfuscation the single-line regex misses (ADR-006). A rule using it sets `tier: 'T1'`. |

**Adding a new builtin is a code change** (write a new pure, vetted, code-reviewed matcher function and
register it under its name), not a data change. That is the security boundary: data selects from vetted
functions; only review adds new behaviour.

## The precision budget (mechanically enforced)

Every rule ships with its own `passFixtures` (must NOT match), `failFixtures` (must match), and a
`precisionBudget`. The guard in `src/core/__tests__/precision-budget.test.ts` runs on every build and:

1. asserts each `failFixture` produces ≥1 match and each `passFixture` produces 0, and
2. measures each rule's false-positive rate across the **full benign corpus** and fails the build if it
   exceeds the rule's `precisionBudget`.

**A rule that regresses corpus false-positives fails the build — tighten it, do not merge it.** The
guard's own bite is proven by a test that constructs a deliberately-loose rule and asserts it is caught.

Set `precisionBudget: 0` unless you have a documented reason a rule may add a small, bounded FP rate.

## Behaviour-preservation / parity

`src/core/__tests__/parity.test.ts` asserts the compiled-from-data ruleset reproduces the committed
baseline (`tests/corpus/parity-baseline.json`) verdict-and-finding-for-finding across the whole corpus.
If you change an existing rule's behaviour intentionally, re-capture the baseline; otherwise parity
protects you from an accidental regression.

## Workflow: add a rule

1. Pick the detection class and open its data file: `src/core/rules/<class>.rules.ts`.
2. Append a `RuleSpec`: a namespaced `id`, `severity`, `tier: 'T0'`, the `framework` ids (OWASP +
   ATLAS), a clear `why`, the `matcher` (prefer `line-pattern`), and **at least one** `failFixture` and
   one `passFixture`. Set `precisionBudget: 0`.
3. If the detection genuinely needs structure no single line-regex can express, and an existing
   `builtin` does not fit, add a new pure matcher to `src/core/matchers/builtins.ts`, register it under
   a name, and reference it as `{ kind: 'builtin', name: '<your-name>' }`. (Add unit coordinates for
   both arms of its kind guard.)
4. If your rule is a new attack family, add a labelled corpus fixture under
   `tests/corpus/malicious/<id>/…` (and a benign near-miss under `tests/corpus/benign/…` if relevant),
   and register it in `tests/corpus/manifest.ts`.
5. Bump `RULESET_VERSION` (content). Bump `RULESET_SCHEMA_VERSION` only if you changed the schema.
6. Run `npm run typecheck && npm run build && npm run test:cov && npx vitest run tests/story`. The
   precision-budget guard, the parity test, and the 100% coverage floor must all stay green.
7. Open a PR. The reviewer panel + the SENTINEL `/security-gate` run before merge (governance:
   `pr-approval` — the project never self-merges).
