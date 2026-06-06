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
