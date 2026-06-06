import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FileRecord } from '../core/types.js';
import { classify } from './classify.js';

const SKIP_DIRS: ReadonlySet<string> = new Set(['.git', 'node_modules']);

/** Walk the audited tree (read-only) into an in-memory skill SBOM of FileRecords. */
export async function enumerate(root: string): Promise<FileRecord[]> {
  const records: FileRecord[] = [];
  await walk(root, '', records);
  return records;
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
