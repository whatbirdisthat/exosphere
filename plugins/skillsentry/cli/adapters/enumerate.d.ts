import type { ExclusionSummary, FileRecord } from '../core/types.js';
/** Walk the audited tree (read-only) into an in-memory skill SBOM of FileRecords. */
export declare function enumerate(root: string): Promise<FileRecord[]>;
export interface EnumerateOptions {
    /** When true, ignore any `.skillsentryignore` and scan the full tree (audit-the-auditor). */
    readonly noIgnore: boolean;
}
export interface EnumerationResult {
    readonly files: FileRecord[];
    readonly exclusions: ExclusionSummary;
}
/**
 * Enumerate the tree, applying `.skillsentryignore` at the IO edge (R3). The matcher itself is the
 * pure `core/ignore` module; this adapter only reads the manifest and threads the result through.
 * The `.skillsentryignore` manifest is always removed from the scan surface (it is not audited
 * content) regardless of `noIgnore`.
 */
export declare function enumerateWithIgnore(root: string, options: EnumerateOptions): Promise<EnumerationResult>;
export { classify } from './classify.js';
