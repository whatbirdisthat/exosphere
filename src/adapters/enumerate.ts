import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ExclusionSummary, FileRecord } from '../core/types.js';
import { applyIgnore } from '../core/ignore.js';
import { classify } from './classify.js';

const SKIP_DIRS: ReadonlySet<string> = new Set(['.git', 'node_modules']);
const IGNORE_FILE = '.skillsentryignore';
/** The R9d approval baseline — data the tool reads, never audited content (EARS-078). Always removed. */
const LOCK_FILE = '.skillsentry.lock';

/** Walk the audited tree (read-only) into an in-memory skill SBOM of FileRecords. */
export async function enumerate(root: string): Promise<FileRecord[]> {
  const records: FileRecord[] = [];
  await walk(root, '', records);
  return records;
}

export interface EnumerateOptions {
  /** When true, ignore any `.skillsentryignore` and scan the full tree (audit-the-auditor). */
  readonly noIgnore: boolean;
}

export interface EnumerationResult {
  readonly files: FileRecord[];
  readonly exclusions: ExclusionSummary;
}

const NO_EXCLUSIONS: ExclusionSummary = { excludedCount: 0, patterns: [] };

/**
 * Enumerate the tree, applying `.skillsentryignore` at the IO edge (R3). The matcher itself is the
 * pure `core/ignore` module; this adapter only reads the manifest and threads the result through.
 * The `.skillsentryignore` manifest is always removed from the scan surface (it is not audited
 * content) regardless of `noIgnore`.
 */
export async function enumerateWithIgnore(
  root: string,
  options: EnumerateOptions,
): Promise<EnumerationResult> {
  const all = await enumerate(root);
  // The ignore manifest and the approval lockfile are tool DATA, not audited content — both are always
  // removed from the scan surface regardless of `noIgnore` (EARS-078, mirroring the R3 ignore rule).
  const candidates = all.filter((f) => f.path !== IGNORE_FILE && f.path !== LOCK_FILE);

  if (options.noIgnore) {
    return { files: candidates, exclusions: NO_EXCLUSIONS };
  }

  const ignoreText = await readIgnoreFile(root);
  if (ignoreText === undefined) {
    return { files: candidates, exclusions: NO_EXCLUSIONS };
  }

  const { kept, summary } = applyIgnore(
    candidates.map((f) => f.path),
    ignoreText,
  );
  const keptSet = new Set(kept);
  return { files: candidates.filter((f) => keptSet.has(f.path)), exclusions: summary };
}

/** Read the optional `.skillsentryignore` at the root; undefined if absent. */
async function readIgnoreFile(root: string): Promise<string | undefined> {
  try {
    return await readFile(join(root, IGNORE_FILE), 'utf8');
  } catch {
    return undefined;
  }
}

async function walk(root: string, rel: string, out: FileRecord[]): Promise<void> {
  const dir = rel === '' ? root : join(root, rel);
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const childRel = rel === '' ? entry.name : `${rel}/${entry.name}`;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      await walk(root, childRel, out);
    } else if (entry.isFile()) {
      const content = await readFile(join(root, childRel), 'utf8');
      out.push({ path: childRel, content, kind: classify(childRel) });
    }
  }
}

export { classify } from './classify.js';
