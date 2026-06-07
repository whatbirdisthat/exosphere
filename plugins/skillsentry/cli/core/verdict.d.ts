import type { Finding, Verdict } from './types.js';
/** Aggregate findings to a verdict: PASS (none) / REVIEW (low–med) / BLOCK (any high). */
export declare function aggregate(findings: readonly Finding[]): Verdict;
/** Exit code for a verdict: non-zero only on BLOCK. */
export declare function exitCodeFor(verdict: Verdict): number;
