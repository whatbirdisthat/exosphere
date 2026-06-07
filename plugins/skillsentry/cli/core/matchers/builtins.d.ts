import type { CrossFileBuiltinName, FileRecord, PerFileBuiltinName, RuleMatch } from '../types.js';
/** A built-in structural matcher: a pure function from a file record to zero or more matches. */
export type BuiltinMatcher = (file: FileRecord) => RuleMatch[];
/**
 * A CROSS-FILE built-in matcher (ADR-007 / R9b.1): a pure function from one file record PLUS the whole
 * in-memory file set to zero or more matches. It resolves `source`d siblings IN MEMORY — never fs/exec/
 * fetch. Routed by the compiler to the engine's `detectCrossFile` channel, never the per-file one.
 */
export type CrossFileBuiltinMatcher = (file: FileRecord, files: readonly FileRecord[]) => RuleMatch[];
/**
 * The closed registry of PER-FILE builtins: a rule's `{ kind: 'builtin', name }` selects one of these
 * by name (when the name is a per-file matcher). An unknown name is rejected at compile time
 * (EARS-053). Adding a builtin is a code change (a new vetted matcher), never a data change — that is
 * the security boundary. The cross-file matcher lives in its OWN map below (different signature).
 */
export declare const BUILTIN_MATCHERS: Readonly<Record<PerFileBuiltinName, BuiltinMatcher>>;
/**
 * The closed registry of CROSS-FILE builtins (ADR-007 / R9b.1). A rule whose builtin name is one of
 * these resolves to the engine's `detectCrossFile` channel (it needs the whole file set). Same security
 * boundary: a contributor selects by name; the analyzer logic is vetted code, never data.
 */
export declare const CROSSFILE_BUILTIN_MATCHERS: Readonly<Record<CrossFileBuiltinName, CrossFileBuiltinMatcher>>;
