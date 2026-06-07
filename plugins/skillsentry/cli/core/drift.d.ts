import type { DriftSummary, Finding, LockFile } from './types.js';
/**
 * Diff the fresh scan against an approval lockfile and classify drift (EARS-079–085). Pure: no IO.
 *
 * @param freshFindings the T0/T1 findings from the current scan.
 * @param freshHashes   the current per-file sha256 map (computed in the adapter, passed in).
 * @param lock          the parsed approval baseline.
 */
export declare function diffCapabilities(freshFindings: readonly Finding[], freshHashes: Readonly<Record<string, string>>, lock: LockFile): DriftSummary;
