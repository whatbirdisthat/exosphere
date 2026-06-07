export type Severity = 'low' | 'medium' | 'high';
export type DetectionClass = 'dangerous-bash' | 'prompt-injection' | 'over-broad-perms' | 'committed-secrets' | 'tool-description-poisoning' | 'dataflow-taint' | 'version-drift';
/**
 * Detection tier (ADR-004, extended by ADR-006/R9b, ADR-008/R9d). `T0` is the always-on
 * pattern/structural tier. `T1` (R9b) is the intra-file/cross-file shell taint/dataflow tier — a
 * DEEPER static technique that is still deterministic + offline + never-executing, so it runs
 * additively alongside T0 with no opt-in gate. `T3` (R9d) is the **temporal** tier: it reasons about a
 * target across TWO points in time (an approval `.skillsentry.lock` baseline vs the current tree),
 * flagging capability ESCALATION since approval (the rug-pull). T3 is **not** expressible as a `Rule`
 * (no per-file matcher signature can take two target-level inputs) — it is a temporal pass at the
 * engine/adapter edge (ADR-008). T3 ships BEFORE T2 on purpose: T3 holds deterministic + offline +
 * never-execute, whereas the semantic T2 would break those, so T3 is a default-eligible tier and T2
 * remains an unbuilt opt-in. The union remains the documented extension point — a future opt-in tier is
 * added by widening it again and gating those rules at the adapter/CLI edge. The default ruleset stays
 * 100% deterministic + offline.
 */
export type RuleTier = 'T0' | 'T1' | 'T3';
/**
 * A STRIDE "conceptual portal" — one of the six classic threat categories used here as JUST ANOTHER
 * threat-intelligence source (peer to OWASP/ATLAS), never as a brand. Tagging every probe with the
 * portal(s) it covers turns coverage of the threat map into data the gap ritual can reason over
 * MECHANICALLY (which portals are HEAVY, THIN, ABSENT) — see `doc/threat-model/`.
 *   S Spoofing · T Tampering · R Repudiation · I Information disclosure · D Denial of service · E Elevation of privilege
 */
export type StridePortal = 'S' | 'T' | 'R' | 'I' | 'D' | 'E';
/**
 * An EXTRA agentic axis — a threat dimension that classic STRIDE was never designed to name, carried
 * by the probes that are this product's differentiators:
 *   • `temporal`  — trust changing ACROSS TIME (the T3 rug-pull: trustworthy-then, hostile-now). STRIDE
 *     models one system at one instant; it has no time axis.
 *   • `cognitive` — the attack target is the LLM's COGNITION (the prompt-injection family), not a
 *     deterministic software trust boundary. STRIDE assumes deterministic data/control boundaries.
 * A probe escapes STRIDE iff it is tagged with an `axis` (it may ALSO carry a loose `stride`).
 */
export type AgenticAxis = 'temporal' | 'cognitive';
/**
 * Framework mapping carried by every rule (ADR-004 / R9a). Anchors each detection to a recognised
 * standard so a finding cites an ID a security team already tracks. `owasp` + `atlas` are required — a
 * rule that omits them does not compile, making framework coverage a compile-time invariant. `stride`
 * and `axis` are OPTIONAL on the type (so the existing invariant is preserved and no rule breaks), but
 * are made DE-FACTO REQUIRED by a test (`__tests__/threat-map.test.ts`): every rule must declare a
 * `stride` portal OR an `axis` — so the threat-map classification cannot silently rot.
 */
export interface FrameworkMapping {
    /** OWASP ASI / MCP / LLM Top-10 identifier, e.g. "ASI04", "MCP-T01", "LLM01". */
    readonly owasp: string;
    /** MITRE ATLAS technique id, e.g. "AML.T0051". */
    readonly atlas: string;
    /** STRIDE portal(s) this probe covers — "just another intel source". Empty/omitted iff `axis` is set. */
    readonly stride?: readonly StridePortal[];
    /** EXTRA agentic axis(es) for probes that ESCAPE classic STRIDE (temporal / cognitive). */
    readonly axis?: readonly AgenticAxis[];
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
    /**
     * OPTIONAL cross-file channel (ADR-007 / R9b.1). When present, the engine ALSO calls this with the
     * analysed file plus the whole in-memory file set, so a matcher can resolve a `source`d sibling's
     * taint (cross-file dataflow). Existing rules leave this `undefined` — their `detect` and the
     * line-pattern compiler path are unchanged; the cross-file pass is purely additive. The analyzer it
     * points to operates in pure string space over in-memory records (never fs/exec/fetch).
     */
    readonly detectCrossFile?: (file: FileRecord, files: readonly FileRecord[]) => RuleMatch[];
}
export interface RuleMatch {
    /** 1-based line number of the match. */
    readonly line: number;
    /** The matched text excerpt (trimmed of surrounding whitespace). */
    readonly excerpt: string;
}
/**
 * The closed vocabulary of PER-FILE named structural matchers (ADR-005, EARS-050). Each resolves to a
 * pure `(file) => RuleMatch[]` in the `BUILTIN_MATCHERS` registry.
 */
export type PerFileBuiltinName = 'zero-width-unicode' | 'html-comment-instruction' | 'homoglyph-override' | 'encoded-override-payload' | 'ansi-line-jumping' | 'mcp-combined-scopes' | 'frontmatter-coercive-description' | 'mcp-tool-coercive-description' | 'shell-taint-to-sink';
/**
 * The closed vocabulary of CROSS-FILE named matchers (ADR-007, EARS-067). Each resolves to a pure
 * `(file, files) => RuleMatch[]` in the `CROSSFILE_BUILTIN_MATCHERS` registry — it needs the whole
 * in-memory file set to resolve a `source`d sibling's taint, so the engine routes it to the optional
 * `Rule.detectCrossFile` channel. Same security boundary: data selects by name; logic is vetted code.
 */
export type CrossFileBuiltinName = 'shell-crossfile-taint-to-sink';
/** The full closed vocabulary a rule's `{ kind: 'builtin', name }` may name (per-file ∪ cross-file). */
export type BuiltinMatcherName = PerFileBuiltinName | CrossFileBuiltinName;
/**
 * The declarative matcher vocabulary (ADR-005). A closed discriminated union so rule data can express
 * a matcher WITHOUT carrying executable logic:
 *  - `line-pattern` — a per-line regex (pattern source string + optional flags), the declarative bulk.
 *  - `builtin`      — selects a named structural matcher from the closed registry by name.
 */
export type MatcherSpec = {
    readonly kind: 'line-pattern';
    /** Regex SOURCE string — compiled with `new RegExp(...)`, only ever used to MATCH text. */
    readonly pattern: string;
    readonly flags?: string;
    readonly appliesTo?: readonly ComponentKind[];
} | {
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
export type ComponentKind = 'skill' | 'agent' | 'plugin-manifest' | 'settings' | 'hook' | 'script' | 'mcp-config' | 'other';
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
 * Disclosure of what `.skillsentryignore` removed from the scan surface (R3).
 * Load-bearing transparency invariant: an exclusion can never silently hide a finding,
 * so every excluded file is accounted for here and surfaced in both report formats.
 */
export interface ExclusionSummary {
    /** Total number of files removed from the scan surface by the ignore file. */
    readonly excludedCount: number;
    /** Per-pattern provenance: which pattern excluded how many files (only patterns that hit). */
    readonly patterns: readonly {
        readonly pattern: string;
        readonly count: number;
    }[];
}
/**
 * One trust-relevant capability present in a target at approval time — the unit of the capability SET.
 * A capability is identified by its (rule, detectionClass, severity, file, line): a stable, structural
 * key that survives benign byte drift but changes when a NEW sink/perm/hook/finding appears. The set of
 * these IS the fingerprint the diff keys on. (Whitespace/reorder of the underlying file does not change
 * any field here — that is the FP-line guarantee.)
 */
export interface Capability {
    readonly rule: string;
    readonly detectionClass: DetectionClass;
    readonly severity: Severity;
    readonly file: string;
    readonly line: number;
}
/** The capability SET of a target — the order-independent fingerprint the drift diff keys on. */
export type CapabilitySet = readonly Capability[];
/**
 * The deterministic, byte-stable, schema-versioned approval baseline (`.skillsentry.lock`, ADR-008).
 * Written by `--approve` and committed alongside the skill. Read (never executed) on a later audit so
 * the T3 pass can answer "what changed since I trusted this?".
 */
export interface LockFile {
    /** Lockfile SCHEMA version — bumped only on a breaking change to this shape. */
    readonly schemaVersion: string;
    /** The approval verdict captured at lock time (informational; the fresh scan always re-decides). */
    readonly approvedVerdict: Verdict;
    /** Per-file sha256 at approval (POSIX rel path → hex). `.skillsentry.lock` is self-excluded. */
    readonly fileHashes: Readonly<Record<string, string>>;
    /** The approved capability SET (the fingerprint the diff keys on). */
    readonly capabilities: CapabilitySet;
    /** The `.skillsentryignore` exclusion provenance disclosed at approval (transparency carry-over). */
    readonly exclusions: ExclusionSummary;
}
/** Why a `version-drift` finding was raised — the structured drift classification (ADR-008). */
export type DriftKind = 'escalation' | 'approval-invalidation';
/**
 * A T3 temporal-pass finding: the capability set grew, or an approved file's bytes changed. Carries the
 * same shape as a scan `Finding` (so it folds into the same list and report) plus the drift kind. Tier
 * is always `'T3'`, class always `'version-drift'`.
 */
export interface DriftFinding extends Finding {
    readonly driftKind: DriftKind;
}
/**
 * The result of the T3 temporal pass — disclosed in both report formats (R3 transparency carry-over).
 * `changedSinceApproval` is the benign-drift note count (files whose hash changed); it is informational
 * and NEVER lowers a verdict. `approvedHighCount` is the load-bearing anti-laundering disclosure: how
 * many HIGH-severity findings the lockfile recorded as approved (a lock that pre-approved a HIGH is
 * itself exposed). `findings` are the escalation/invalidation drift findings folded into the verdict.
 */
export interface DriftSummary {
    readonly changedSinceApproval: number;
    readonly approvedHighCount: number;
    readonly findings: readonly DriftFinding[];
}
export interface AuditReport {
    readonly verdict: Verdict;
    readonly findings: readonly Finding[];
    readonly exclusions: ExclusionSummary;
    /**
     * R9d: the T3 drift summary when a `.skillsentry.lock` baseline was present; `undefined` when no
     * lockfile was read (the T3 pass is inert without a baseline, so a pre-R9d audit is byte-identical).
     */
    readonly drift?: DriftSummary;
}
/**
 * Outcome of a `--badge` request (R2). On a PASS verdict the author earns a deterministic,
 * offline trust badge (raw SVG + a self-contained Markdown data-URI snippet). On REVIEW/BLOCK
 * no badge is issued — only a one-line reason. The badge derives solely from the verdict, so it
 * is byte-stable; a PASS earned via `.skillsentryignore` still discloses its exclusions upstream
 * in the report (the badge cannot launder a hidden exclusion).
 */
export type BadgeResult = {
    readonly kind: 'badge';
    readonly svg: string;
    readonly markdown: string;
} | {
    readonly kind: 'no-badge';
    readonly reason: string;
};
export type AuditErrorCode = 'NO_TARGET' | 'UNRESOLVABLE_INPUT' | 'ACQUISITION_FAILED';
export declare class AuditError extends Error {
    readonly code: AuditErrorCode;
    constructor(code: AuditErrorCode, message: string);
}
/**
 * Raised at ruleset LOAD/COMPILE time (never mid-scan) when a `RuleSpec` is malformed: an invalid
 * `line-pattern` regex source (EARS-052) or an unknown `builtin` matcher name (EARS-053). Typed so a
 * bad contributor rule fails the build with a clear cause, not a raw throw during an audit.
 */
export type RulesetErrorCode = 'INVALID_PATTERN' | 'UNKNOWN_BUILTIN';
export declare class RulesetError extends Error {
    readonly code: RulesetErrorCode;
    /** The id of the offending rule. */
    readonly ruleId: string;
    constructor(code: RulesetErrorCode, ruleId: string, message: string);
}
