// Domain types for the pure scan core. No IO — these are plain data shapes and typed errors.
// Per ADR-001, `core/*` depends on this module only and never imports node:fs / node:child_process.

export type Severity = 'low' | 'medium' | 'high';

export type DetectionClass =
  | 'dangerous-bash'
  | 'prompt-injection'
  | 'over-broad-perms'
  | 'committed-secrets';

export type Verdict = 'PASS' | 'REVIEW' | 'BLOCK';

export type InputKind = 'local-dir' | 'git-url';

/** A single named, versioned matcher. `detect` returns the 1-based match columns per line. */
export interface Rule {
  readonly id: string;
  readonly detectionClass: DetectionClass;
  readonly severity: Severity;
  readonly why: string;
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
