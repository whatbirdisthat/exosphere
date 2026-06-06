import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashFiles, readLock, writeLock, LOCK_FILE } from '../../src/adapters/lockfile.js';
import { serialiseLock } from '../../src/core/lock.js';
import type { FileRecord, LockFile } from '../../src/core/types.js';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'exo-lock-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function rec(path: string, content: string): FileRecord {
  return { path, content, kind: 'other' };
}

const sampleLock: LockFile = {
  schemaVersion: '1.0.0',
  approvedVerdict: 'PASS',
  fileHashes: { 'a.txt': 'aaa' },
  capabilities: [],
  exclusions: { excludedCount: 0, patterns: [] },
};

describe('hashFiles — deterministic sha256 over in-memory records (EARS-077)', () => {
  it('produces a stable hex sha256 per file path', () => {
    const h = hashFiles([rec('a.txt', 'hello'), rec('b.txt', 'world')]);
    // sha256("hello") is well-known
    expect(h['a.txt']).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    expect(h['b.txt']).toBeDefined();
  });

  it('is deterministic: same content → same hash across calls', () => {
    expect(hashFiles([rec('x', 'k')])).toEqual(hashFiles([rec('x', 'k')]));
  });

  it('self-excludes the .skillsentry.lock manifest from its own hash set (EARS-078)', () => {
    const h = hashFiles([rec('SKILL.md', 'ok'), rec(LOCK_FILE, '{"any":"lock"}')]);
    expect(h[LOCK_FILE]).toBeUndefined();
    expect(h['SKILL.md']).toBeDefined();
  });
});

describe('writeLock / readLock — byte-stable round-trip over real disk (EARS-076)', () => {
  it('writes the serialised lock and reads it back as an equal parsed object', async () => {
    await writeLock(root, sampleLock);
    const written = await readFile(join(root, LOCK_FILE), 'utf8');
    expect(written).toBe(serialiseLock(sampleLock));
    const parsed = await readLock(root);
    expect(parsed).toEqual(sampleLock);
  });

  it('returns undefined when no lockfile is present', async () => {
    expect(await readLock(root)).toBeUndefined();
  });

  it('returns undefined for a malformed lockfile (never throws mid-audit)', async () => {
    await writeFile(join(root, LOCK_FILE), 'not json {');
    expect(await readLock(root)).toBeUndefined();
  });
});
