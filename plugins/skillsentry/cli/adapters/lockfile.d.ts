import type { FileRecord, LockFile } from '../core/types.js';
/** The approval-baseline manifest name, self-excluded from its own enumeration/hashing (EARS-078). */
export declare const LOCK_FILE = ".skillsentry.lock";
/**
 * Compute a per-file sha256 (hex) over the in-memory records (EARS-077). The `.skillsentry.lock`
 * manifest is self-excluded — it is the baseline, never part of its own fingerprint. Pure over the
 * passed records aside from `node:crypto`; no filesystem read happens here (the enumerator already read
 * the content).
 */
export declare function hashFiles(files: readonly FileRecord[]): Record<string, string>;
/** Write `.skillsentry.lock` at the target root as byte-stable serialised JSON (EARS-075/076). */
export declare function writeLock(root: string, lock: LockFile): Promise<void>;
/**
 * Read and parse `.skillsentry.lock` at the target root. Returns `undefined` if absent OR malformed —
 * a bad lockfile is treated as "no baseline" (the T3 pass stays inert), never a mid-audit throw. The
 * lockfile is parsed as inert DATA (`JSON.parse`), never executed (EARS-088).
 */
export declare function readLock(root: string): Promise<LockFile | undefined>;
