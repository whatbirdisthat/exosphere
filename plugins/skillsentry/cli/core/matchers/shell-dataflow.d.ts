import type { FileRecord, RuleMatch } from '../types.js';
/** The component kinds that are bundled shell scripts (EARS-060). */
declare const SHELL_KINDS: ReadonlySet<FileRecord['kind']>;
/**
 * Strip a trailing `#` comment from a shell line, conservatively. A `#` starts a comment when it is at
 * the start of the (trimmed) line or preceded by whitespace AND not inside single/double quotes. We
 * scan left-to-right tracking quote state so a `#` inside a quoted string (or a `$#`/`${#x}`) is kept.
 */
export declare function stripComment(line: string): string;
/**
 * Does a right-hand side contain a tainted SOURCE? (EARS-060)
 *  - command substitution `$(...)` or backticks
 *  - a network fetch (curl/wget/fetch)
 *  - a decode (base64 -d / --decode / -D, xxd, openssl ... -d/enc -d)
 *  - a read of a sensitive environment variable
 * (the `read VAR` stdin SOURCE is handled separately, since it has no RHS).
 */
export declare function rhsHasSource(rhs: string): boolean;
/** Parse an assignment line into `{ name, rhs }`, or undefined if it is not a simple assignment. */
export declare function parseAssignment(line: string): {
    name: string;
    rhs: string;
} | undefined;
/** The variable names referenced (`$VAR` / `${VAR}`) within a string. */
export declare function referencedVars(text: string): string[];
/**
 * Given a line and the current taint set, return the SINK kind reached by a tainted variable, or
 * undefined. A SINK only fires when a TAINTED variable participates (EARS-062). Sink shapes:
 *  - pipe into a shell: `... "$VAR" | sh|bash|zsh`
 *  - eval / exec / source / `.` of a tainted value
 *  - write/append a tainted value into an autorun location
 */
export declare function sinkForLine(line: string, tainted: ReadonlySet<string>): boolean;
/** The component kinds the T1 shell analyzers apply to (script/hook). Exported for the cross-file pass. */
export { SHELL_KINDS };
/**
 * The forward-pass result: the SINK matches found, plus the FINAL taint set after the whole file. The
 * final taint set is what a sourced sibling "exports" to a file that includes it (R9b.1 / EARS-068).
 */
export interface ForwardPassResult {
    readonly matches: RuleMatch[];
    readonly tainted: Set<string>;
}
/**
 * The shared T1 forward pass (R9b core, reused cross-file in R9b.1). A single forward scan over the
 * script's lines: seed + propagate taint through assignments and report a finding at each SINK line a
 * tainted variable reaches. `seed` provides an INITIAL taint set — empty for intra-file analysis
 * (EARS-061), or a sourced sibling's exported taint for cross-file analysis (EARS-068). Pure string
 * space; never an execution sink (EARS-066/074).
 */
export declare function forwardPass(file: FileRecord, seed?: ReadonlySet<string>): ForwardPassResult;
/**
 * The T1 intra-file analyzer (R9b): a single forward pass over the script's lines, with no imported
 * taint. Seeds + propagates taint through assignments and reports a finding at each SINK line a tainted
 * variable reaches.
 */
export declare function shellTaintToSink(file: FileRecord): RuleMatch[];
