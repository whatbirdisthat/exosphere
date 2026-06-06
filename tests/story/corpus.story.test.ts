import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile, mkdir, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { CORPUS } from '../corpus/manifest.js';
import type { Finding, Verdict } from '../../src/core/types.js';

const exec = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const BIN = join(repoRoot, 'dist', 'bin.js');
const corpusRoot = resolve(here, '..', 'corpus');

interface CliJson {
  verdict: Verdict;
  target: string;
  findings: Finding[];
}

/**
 * Spawn the BUILT CLI as a real subprocess — the unmocked full stack: real process,
 * real disk, real argv parsing, real exit code. Returns the parsed JSON + exit code.
 */
async function runCli(target: string, extra: string[] = []): Promise<{ code: number; json: CliJson }> {
  try {
    const { stdout } = await exec('node', [BIN, target, '--format', 'json', ...extra]);
    return { code: 0, json: JSON.parse(stdout) as CliJson };
  } catch (err) {
    const e = err as { code?: number; stdout?: string };
    return { code: e.code ?? 1, json: JSON.parse(e.stdout ?? '{}') as CliJson };
  }
}

beforeAll(() => {
  if (!existsSync(BIN)) {
    throw new Error(`Built CLI not found at ${BIN}. Run "npm run build" before the story suite.`);
  }
});

describe('STORY: exosphere-audit over the labelled fixture corpus (unmocked CLI)', () => {
  it('classifies every malicious fixture as BLOCK citing the right detection class at file:line', async () => {
    for (const entry of CORPUS.filter((e) => e.label === 'malicious')) {
      const { code, json } = await runCli(join(corpusRoot, entry.dir));
      expect(json.verdict, `${entry.dir} verdict`).toBe('BLOCK');
      expect(code, `${entry.dir} exit code`).toBeGreaterThan(0);
      const cite = entry.expectCite!;
      const hit = json.findings.find(
        (f) => f.detectionClass === cite.detectionClass && f.file === cite.file && f.line === cite.line,
      );
      expect(hit, `${entry.dir} expected ${cite.detectionClass} at ${cite.file}:${cite.line}`).toBeDefined();
      expect(hit!.why.length).toBeGreaterThan(0);
    }
  });

  it('classifies every benign fixture as PASS with exit zero and zero findings', async () => {
    for (const entry of CORPUS.filter((e) => e.label === 'benign')) {
      const { code, json } = await runCli(join(corpusRoot, entry.dir));
      expect(json.verdict, `${entry.dir} verdict`).toBe('PASS');
      expect(code, `${entry.dir} exit code`).toBe(0);
      expect(json.findings, `${entry.dir} findings`).toEqual([]);
    }
  });

  it('meets the success gate: >= 90% correct classification at <= 10% false-positive rate', async () => {
    let correct = 0;
    let benignTotal = 0;
    let falsePositives = 0;
    for (const entry of CORPUS) {
      const { json } = await runCli(join(corpusRoot, entry.dir));
      if (json.verdict === entry.expectedVerdict) {
        correct++;
      }
      if (entry.label === 'benign') {
        benignTotal++;
        if (json.verdict !== 'PASS') {
          falsePositives++;
        }
      }
    }
    const accuracy = correct / CORPUS.length;
    const fpRate = falsePositives / benignTotal;
    // eslint-disable-next-line no-console
    console.log(`corpus: accuracy=${(accuracy * 100).toFixed(1)}% fp=${(fpRate * 100).toFixed(1)}%`);
    expect(accuracy).toBeGreaterThanOrEqual(0.9);
    expect(fpRate).toBeLessThanOrEqual(0.1);
  });

  it('emits a markdown report by default that cites file:line and rule (EARS-021)', async () => {
    const { stdout } = await exec('node', [BIN, join(corpusRoot, 'malicious/mal-dangerous-bash')]).catch(
      (e: { stdout: string }) => ({ stdout: e.stdout }),
    );
    expect(stdout).toContain('BLOCK');
    expect(stdout).toContain('install.sh:4');
    expect(stdout).toContain('dangerous-bash/curl-pipe-to-shell');
  });
});

describe('STORY: hostile git acquisition never executes the audited payload (EARS-005/006)', () => {
  let work: string;
  beforeEach(async () => {
    work = await mkdtemp(join(tmpdir(), 'exo-story-git-'));
  });
  afterEach(async () => {
    await rm(work, { recursive: true, force: true });
  });

  it('audits a git URL via shallow clone without running its install hook', async () => {
    // Build a real local git repo from the malicious dangerous-bash fixture + a hostile hook.
    const origin = join(work, 'origin');
    await mkdir(origin, { recursive: true });
    await cp(join(corpusRoot, 'malicious/mal-dangerous-bash'), origin, { recursive: true });
    const sentinel = join(work, 'PWNED');
    // A post-checkout hook that, if executed, would create the sentinel file.
    const git = (args: string[]) => exec('git', args, { cwd: origin });
    await git(['init', '-q']);
    await git(['config', 'user.email', 't@t.test']);
    await git(['config', 'user.name', 'T']);
    await mkdir(join(origin, '.git', 'hooks'), { recursive: true });
    await writeFile(
      join(origin, '.git', 'hooks', 'post-checkout'),
      `#!/bin/sh\ntouch "${sentinel}"\n`,
      { mode: 0o755 },
    );
    await git(['add', '-A']);
    await git(['commit', '-q', '-m', 'init']);

    const { code, json } = await runCli(`file://${origin}`);
    expect(json.verdict).toBe('BLOCK');
    expect(code).toBeGreaterThan(0);
    // The load-bearing invariant: the audited repo's hook NEVER ran.
    expect(existsSync(sentinel)).toBe(false);
  });
});

describe('STORY: performance budget (latency-sensitive path)', () => {
  it('audits a fixture within the wall-clock budget', async () => {
    const t0 = performance.now();
    await runCli(join(corpusRoot, 'malicious/mal-blended-exfil'));
    const elapsed = performance.now() - t0;
    // A single full CLI audit (process spawn + scan) must complete well under 5s.
    expect(elapsed).toBeLessThan(5000);
  });
});
