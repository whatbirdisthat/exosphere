import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enumerateWithIgnore } from '../../adapters/enumerate.js';
import { scan } from '../engine.js';
import { ruleset } from '../ruleset.js';
import { aggregate } from '../verdict.js';

// PARITY PROOF (R4 / ADR-005, EARS-055): the externally-declared ruleset reproduces the baseline
// verdicts + findings of the previously compiled-in (R9a) ruleset for EVERY corpus fixture, finding
// for finding. The baseline oracle (`parity-baseline.json`) was captured from the compiled-in ruleset
// BEFORE externalisation and committed as the behaviour-preservation contract.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
const corpusRoot = join(repoRoot, 'tests', 'corpus');

interface OracleFinding {
  rule: string;
  file: string;
  line: number;
  owasp: string;
  atlas: string;
  sev: string;
}
interface OracleEntry {
  verdict: string;
  n: number;
  findings: OracleFinding[];
}
const oracle = JSON.parse(
  readFileSync(join(corpusRoot, 'parity-baseline.json'), 'utf8'),
) as Record<string, OracleEntry>;

/** Re-derive the current (externalised) verdict + normalised findings for a fixture, exactly as the
 *  CLI does (real enumerate adapter, --no-ignore so the corpus is fully scanned). */
async function current(label: string, d: string): Promise<OracleEntry> {
  const { files } = await enumerateWithIgnore(join(corpusRoot, label, d), { noIgnore: true });
  const findings = scan(files, ruleset)
    .map((f) => ({ rule: f.rule, file: f.file, line: f.line, owasp: f.owasp, atlas: f.atlas, sev: f.severity }))
    .sort((a, b) => (a.file + a.line + a.rule).localeCompare(b.file + b.line + b.rule));
  return { verdict: aggregate(scan(files, ruleset)), n: findings.length, findings };
}

describe('parity: externalised ruleset reproduces the compiled-in baseline (EARS-055)', () => {
  it('covers every baseline fixture (no fixture silently dropped)', () => {
    const onDisk = new Set<string>();
    for (const label of ['malicious', 'benign']) {
      for (const d of readdirSync(join(corpusRoot, label))) {
        onDisk.add(`${label}/${d}`);
      }
    }
    expect(new Set(Object.keys(oracle))).toEqual(onDisk);
  });

  it.each(Object.keys(oracle))('fixture %s yields identical verdict and findings', async (key) => {
    const [label, d] = key.split('/');
    const got = await current(label as string, d as string);
    expect(got.verdict, `${key} verdict`).toBe(oracle[key]!.verdict);
    expect(got.n, `${key} finding count`).toBe(oracle[key]!.n);
    expect(got.findings, `${key} findings`).toEqual(oracle[key]!.findings);
  });
});
