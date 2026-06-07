import type { ExclusionSummary } from './types.js';
export interface IgnorePattern {
    /** The original pattern text (without a leading `!`), used for provenance reporting. */
    readonly source: string;
    /** Whether this is a negation (`!`) pattern that re-includes a match. */
    readonly negate: boolean;
    /** Compiled matcher over a POSIX root-relative path. */
    readonly regex: RegExp;
}
/** Parse `.skillsentryignore` text into ordered patterns, dropping blanks and `#` comments. */
export declare function parseIgnore(text: string): IgnorePattern[];
/** True if `path` (POSIX, root-relative) is excluded by the patterns. Last match wins (negation). */
export declare function isExcluded(path: string, patterns: readonly IgnorePattern[]): boolean;
/**
 * Partition paths into kept vs excluded and build the transparency summary.
 * `patterns` in the summary lists only patterns that actually excluded a file; a path
 * re-included by a negation is attributed to no pattern.
 */
export declare function applyIgnore(paths: readonly string[], ignoreText: string): {
    kept: string[];
    summary: ExclusionSummary;
};
