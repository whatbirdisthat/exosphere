import type { FileRecord, RuleMatch } from '../types.js';
/** A parsed literal include directive: the 1-based line and the literal relative path it names. */
export interface ParsedInclude {
    readonly line: number;
    readonly rawPath: string;
}
/**
 * Parse `source <path>` / `. <path>` directives whose target is a LITERAL relative path (EARS-067).
 * A dynamic target (`source "$F"`, `source $F`, `. "${LIB}"`) is NOT a resolvable literal include —
 * it is the R9b *intra-file* "source of a tainted target" SINK and is left to that analyzer. A
 * process-substitution / remote target (`source <(curl …)`) likewise names no literal sibling path.
 * Comment lines are ignored.
 */
export declare function parseIncludes(content: string): ParsedInclude[];
/**
 * Resolve a literal include path against the analysed file's directory, in PURE STRING SPACE (EARS-067/
 * 069). Returns the normalised in-tree POSIX path, or `{ kind: 'escape' }` when the path leaves the
 * audited root (a `..` that climbs above the root, or an absolute path). Never touches the filesystem.
 */
export declare function resolveInclude(fromPath: string, includePath: string): {
    readonly kind: 'in-tree';
    readonly path: string;
} | {
    readonly kind: 'escape';
};
/** A sibling's EXPORTED tainted variable names: the final taint set after the R9b forward pass (EARS-068). */
export declare function exportedTaint(file: FileRecord): Set<string>;
/**
 * The T1 cross-file analyzer (R9b.1). Given the analysed file and the whole in-memory file set, it:
 *  1. reports any include that escapes the audited root as a path-traversal finding (EARS-069);
 *  2. imports the tainted exports of the in-tree siblings it `source`s, transitively (EARS-068/070);
 *  3. runs the R9b forward pass with that imported seed and reports the sinks that fire ONLY because
 *     of the imported taint — the cross-file flow the intra-file pass misses (EARS-071/072). Sinks
 *     that would fire without any import are the R9b rule's job and are NOT duplicated here.
 * Pure string space over in-memory records; never executes, reads disk, or fetches (EARS-074).
 */
export declare function shellCrossfileTaintToSink(file: FileRecord, files: readonly FileRecord[]): RuleMatch[];
