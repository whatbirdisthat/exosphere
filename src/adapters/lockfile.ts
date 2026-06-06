// R9d / ADR-008 — the IO/adapter edge for the T3 approval lockfile. ALL filesystem and crypto access
// for the lockfile lives HERE (per ADR-001 the pure `core/*` never imports `node:fs`/`node:crypto`).
// The adapter computes sha256 over the in-memory FileRecords the enumerator already read, and
// reads/writes `.skillsentry.lock`. The lockfile is DATA the tool reads, never executes.

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FileRecord, LockFile } from '../core/types.js';
import { serialiseLock } from '../core/lock.js';

/** The approval-baseline manifest name, self-excluded from its own enumeration/hashing (EARS-078). */
export const LOCK_FILE = '.skillsentry.lock';

/**
 * Compute a per-file sha256 (hex) over the in-memory records (EARS-077). The `.skillsentry.lock`
 * manifest is self-excluded — it is the baseline, never part of its own fingerprint. Pure over the
 * passed records aside from `node:crypto`; no filesystem read happens here (the enumerator already read
 * the content).
 */
export function hashFiles(files: readonly FileRecord[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const file of files) {
    if (file.path === LOCK_FILE) {
      continue;
    }
    out[file.path] = createHash('sha256').update(file.content, 'utf8').digest('hex');
  }
  return out;
}

/** Write `.skillsentry.lock` at the target root as byte-stable serialised JSON (EARS-075/076). */
export async function writeLock(root: string, lock: LockFile): Promise<void> {
  await writeFile(join(root, LOCK_FILE), serialiseLock(lock), 'utf8');
}

/**
 * Read and parse `.skillsentry.lock` at the target root. Returns `undefined` if absent OR malformed —
 * a bad lockfile is treated as "no baseline" (the T3 pass stays inert), never a mid-audit throw. The
 * lockfile is parsed as inert DATA (`JSON.parse`), never executed (EARS-088).
 */
export async function readLock(root: string): Promise<LockFile | undefined> {
  let text: string;
  try {
    text = await readFile(join(root, LOCK_FILE), 'utf8');
  } catch {
    return undefined;
  }
  try {
    return JSON.parse(text) as LockFile;
  } catch {
    return undefined;
  }
}
