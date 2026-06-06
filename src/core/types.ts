// Domain types for the pure scan core. No IO — these are plain data shapes and typed errors.
// Per ADR-001, `core/*` depends on this module only and never imports node:fs / node:child_process.

export type Severity = 'low' | 'medium' | 'high';

export type DetectionClass =
  | 'dangerous-bash'
  | 'prompt-injection'
  | 'over-broad-perms'
  | 'committed-secrets'
  | 'tool-description-poisoning';

/**
 * Detection tier (ADR-004). Only the deterministic, offline `T0` tier exists today. The union is
 * the documented extension point: a future opt-in semantic tier is added by widening this union
 * (e.g. `'T0' | 'T2'`) and gating the new rules at the adapter/CLI edge — no change to `Rule`,
 * the engine, or any existing rule. The default ruleset stays 100% deterministic + offline.
 */
export type RuleTier = 'T0';

/**
 * Framework mapping carried by every rule (ADR-004 / R9a). Anchors each detection to a recognised
 * standard so a finding cites an ID a security team already tracks. Both ids are required — a rule
 * that omits a mapping does not compile, making framework coverage a compile-time invariant.
 */
export interface FrameworkMapping {
  /** OWASP ASI / MCP / LLM Top-10 identifier, e.g. "ASI04", "MCP-T01", "LLM01". */
  readonly owasp: string;
  /** MITRE ATLAS technique id, e.g. "AML.T0051". */
  readonly atlas: string;
}

export type Verdict = 'PASS' | 'REVIEW' | 'BLOCK';

export type InputKind = 'local-dir' | 'git-url';

/** A single named, versioned matcher. `detect` returns the 1-based match columns per line. */
export interface Rule {
  readonly id: string;
  readonly detectionClass: DetectionClass;
  readonly severity: Severity;
  readonly why: string;
  /** Detection tier (ADR-004). T0 today; the extension point for a future opt-in tier. */
  readonly tier: RuleTier;
  /** OWASP + MITRE ATLAS mapping (required — framework coverage is a compile-time invariant). */
  readonly framework: FrameworkMapping;
  /** Given one file record, return zero or more matches (1-based line + matched excerpt). */
  readonly detect: (file: FileRecord) => RuleMatch[];
}

export interface RuleMatch {
  /** 1-based line number of the match. */
  readonly line: number;
  /** The matched text excerpt (trimmed of surrounding whitespace). */
  readonly excerpt: string;
}

// ── R4: the externalised, declarative, contributable rule DATA shape (ADR-005) ──────────────
//
// A `RuleSpec` is pure, JSON-serialisable DATA — the self-describing record a contributor authors
// without touching engine code. The compiler (`core/compile.ts`) turns a `RuleSpec` into the runtime
// `Rule` above. LOAD-BEARING SAFETY INVARIANT (SMU §6 / ADR-001 / ADR-005, EARS-051): rule data is
// never executed. A `line-pattern` source is only ever compiled to a *matching* `RegExp`; a `builtin`
// name only ever selects a pre-existing vetted function from a closed registry. Nothing in a rule
// field is ever passed to `eval`, `Function`, a dynamic `require`/`import`, or a shell.

/** The closed, documented vocabulary of named built-in structural matchers (ADR-005, EARS-050). */
export type BuiltinMatcherName =
  | 'zero-width-unicode'
  | 'html-comment-instruction'
  | 'homoglyph-override'
  | 'encoded-override-payload'
  | 'ansi-line-jumping'
  | 'mcp-combined-scopes'
  | 'frontmatter-coercive-description'
  | 'mcp-tool-coercive-description';

/**
 * The declarative matcher vocabulary (ADR-005). A closed discriminated union so rule data can express
 * a matcher WITHOUT carrying executable logic:
 *  - `line-pattern` — a per-line regex (pattern source string + optional flags), the declarative bulk.
 *  - `builtin`      — selects a named structural matcher from the closed registry by name.
 */
export type MatcherSpec =
  | {
      readonly kind: 'line-pattern';
      /** Regex SOURCE string — compiled with `new RegExp(...)`, only ever used to MATCH text. */
      readonly pattern: string;
      readonly flags?: string;
      readonly appliesTo?: readonly ComponentKind[];
    }
  | {
      readonly kind: 'builtin';
      readonly name: BuiltinMatcherName;
      readonly appliesTo?: readonly ComponentKind[];
    };

/** A labelled fixture a rule ships with: a benign (pass) or hostile (fail) input. */
export interface RuleFixture {
  readonly kind: ComponentKind;
  readonly content: string;
}

/**
 * A single rule as externalised DATA (ADR-005). Self-describing: it carries its identity, framework
 * mapping, the matcher spec, its OWN pass/fail fixtures, and a precision budget — so a contributor
 * lands a rule and its evidence atomically, and the precision-budget guard can enforce quality
 * mechanically.
 */
export interface RuleSpec {
  readonly id: string;
  readonly detectionClass: DetectionClass;
  readonly severity: Severity;
  readonly tier: RuleTier;
  readonly framework: FrameworkMapping;
  readonly why: string;
  readonly matcher: MatcherSpec;
  /** Benign inputs this rule MUST NOT match (EARS-056). */
  readonly passFixtures: readonly RuleFixture[];
  /** Hostile inputs this rule MUST match (EARS-056). */
  readonly failFixtures: readonly RuleFixture[];
  /** Max corpus false-positive rate this rule may add (0 = none). Enforced mechanically (EARS-057). */
  readonly precisionBudget: number;
}

/** An in-memory file as seen by the pure scan core. `kind` comes from enumeration (the SBOM). */
export interface FileRecord {
  /** Path relative to the audited root (POSIX separators). */
  readonly path: string;
  readonly content: string;
  readonly kind: ComponentKind;
}

export type ComponentKind =
  | 'skill'
  | 'agent'
  | 'plugin-manifest'
  | 'settings'
  | 'hook'
  | 'script'
  | 'mcp-config'
  | 'other';

export interface Finding {
  readonly rule: string;
  readonly detectionClass: DetectionClass;
  readonly severity: Severity;
  readonly file: string;
  readonly line: number;
  readonly excerpt: string;
  readonly why: string;
  /** R9a framework metadata copied from the raising rule (ADR-004). */
  readonly tier: RuleTier;
  readonly owasp: string;
  readonly atlas: string;
}

/**
 * Disclosure of what `.exosphereignore` removed from the scan surface (R3).
 * Load-bearing transparency invariant: an exclusion can never silently hide a finding,
 * so every excluded file is accounted for here and surfaced in both report formats.
 */
export interface ExclusionSummary {
  /** Total number of files removed from the scan surface by the ignore file. */
  readonly excludedCount: number;
  /** Per-pattern provenance: which pattern excluded how many files (only patterns that hit). */
  readonly patterns: readonly { readonly pattern: string; readonly count: number }[];
}

export interface AuditReport {
  readonly verdict: Verdict;
  readonly findings: readonly Finding[];
  readonly exclusions: ExclusionSummary;
}

/**
 * Outcome of a `--badge` request (R2). On a PASS verdict the author earns a deterministic,
 * offline trust badge (raw SVG + a self-contained Markdown data-URI snippet). On REVIEW/BLOCK
 * no badge is issued — only a one-line reason. The badge derives solely from the verdict, so it
 * is byte-stable; a PASS earned via `.exosphereignore` still discloses its exclusions upstream
 * in the report (the badge cannot launder a hidden exclusion).
 */
export type BadgeResult =
  | { readonly kind: 'badge'; readonly svg: string; readonly markdown: string }
  | { readonly kind: 'no-badge'; readonly reason: string };

// ── Typed errors (never throw raw strings) ──────────────────────────────────

export type AuditErrorCode =
  | 'NO_TARGET'
  | 'UNRESOLVABLE_INPUT'
  | 'ACQUISITION_FAILED';

export class AuditError extends Error {
  readonly code: AuditErrorCode;
  constructor(code: AuditErrorCode, message: string) {
    super(message);
    this.name = 'AuditError';
    this.code = code;
  }
}

/**
 * Raised at ruleset LOAD/COMPILE time (never mid-scan) when a `RuleSpec` is malformed: an invalid
 * `line-pattern` regex source (EARS-052) or an unknown `builtin` matcher name (EARS-053). Typed so a
 * bad contributor rule fails the build with a clear cause, not a raw throw during an audit.
 */
export type RulesetErrorCode = 'INVALID_PATTERN' | 'UNKNOWN_BUILTIN';

export class RulesetError extends Error {
  readonly code: RulesetErrorCode;
  /** The id of the offending rule. */
  readonly ruleId: string;
  constructor(code: RulesetErrorCode, ruleId: string, message: string) {
    super(message);
    this.name = 'RulesetError';
    this.code = code;
    this.ruleId = ruleId;
  }
}
