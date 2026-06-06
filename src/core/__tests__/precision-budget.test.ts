import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { compileRule } from '../compile.js';
import { ruleSpecs } from '../ruleset.js';
import { classify } from '../../adapters/classify.js';
import type { ComponentKind, FileRecord, RuleSpec } from '../types.js';

// The PRECISION-BUDGET GUARD (R4 / ADR-005, EARS-056/057). This test IS the mechanical discipline:
//   (1) every rule fires on its own fail fixtures and stays silent on its own pass fixtures, and
//   (2) every rule's false-positive rate across the FULL benign corpus stays within its budget.
// A rule that regresses corpus FP fails the build here — it must be tightened, not merged.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
const benignRoot = join(repoRoot, 'tests', 'corpus', 'benign');

/** Walk a benign fixture dir into in-memory FileRecords, classifying each file's component kind. */
function loadBenignFiles(): FileRecord[] {
  const files: FileRecord[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      if (statSync(abs).isDirectory()) {
        walk(abs);
        continue;
      }
      const rel = relative(dir, abs).split(sep).join('/');
      files.push({
        path: rel,
        content: readFileSync(abs, 'utf8'),
        kind: classify(rel) as ComponentKind,
      });
    }
  };
  for (const fixture of readdirSync(benignRoot)) {
    walk(join(benignRoot, fixture));
  }
  return files;
}

const BENIGN_FILES = loadBenignFiles();

/** A rule's measured false-positive rate across the benign corpus (fraction of benign files it hits). */
function corpusFpRate(spec: RuleSpec): number {
  const rule = compileRule(spec);
  let hits = 0;
  for (const f of BENIGN_FILES) {
    if (rule.detect(f).length > 0) {
      hits++;
    }
  }
  return hits / BENIGN_FILES.length;
}

describe('precision-budget guard — every rule fires on its fail fixtures, is silent on its pass fixtures (EARS-056)', () => {
  it.each(ruleSpecs.map((s) => [s.id, s] as const))('rule %s honours its own fixtures', (_id, spec) => {
    const rule = compileRule(spec);
    expect(spec.failFixtures.length, `${spec.id} must ship fail fixtures`).toBeGreaterThan(0);
    expect(spec.passFixtures.length, `${spec.id} must ship pass fixtures`).toBeGreaterThan(0);
    for (const fx of spec.failFixtures) {
      const matches = rule.detect({ path: 'fail', content: fx.content, kind: fx.kind });
      expect(matches.length, `${spec.id} fail fixture must match`).toBeGreaterThan(0);
    }
    for (const fx of spec.passFixtures) {
      const matches = rule.detect({ path: 'pass', content: fx.content, kind: fx.kind });
      expect(matches.length, `${spec.id} pass fixture must NOT match`).toBe(0);
    }
  });
});

describe('precision-budget guard — corpus false-positive rate within budget (EARS-057)', () => {
  it('loads a non-empty benign corpus to measure against', () => {
    expect(BENIGN_FILES.length).toBeGreaterThan(0);
  });

  it.each(ruleSpecs.map((s) => [s.id, s] as const))(
    'rule %s stays within its precisionBudget on the benign corpus',
    (_id, spec) => {
      const fp = corpusFpRate(spec);
      expect(fp, `${spec.id} corpus FP ${fp} exceeds budget ${spec.precisionBudget}`).toBeLessThanOrEqual(
        spec.precisionBudget,
      );
    },
  );

  // The guard's OWN correctness: a deliberately-loose rule that fires on benign corpus files beyond its
  // budget MUST be caught. This proves the budget check actually bites (abuse / EARS-057).
  it('catches a deliberately-loose rule that regresses corpus FP', () => {
    const loose: RuleSpec = {
      id: 'evil/too-loose',
      detectionClass: 'prompt-injection',
      severity: 'high',
      tier: 'T0',
      framework: { owasp: 'LLM01', atlas: 'AML.T0051' },
      why: 'a deliberately over-broad rule that fires on ordinary prose',
      // matches almost any line containing a lowercase letter — guaranteed to hit benign files.
      matcher: { kind: 'line-pattern', pattern: '[a-z]' },
      failFixtures: [{ kind: 'skill', content: 'anything' }],
      passFixtures: [{ kind: 'skill', content: 'ALL CAPS NO MATCH 123' }],
      precisionBudget: 0,
    };
    const fp = corpusFpRate(loose);
    // It DOES regress corpus FP (fires on benign files)…
    expect(fp).toBeGreaterThan(0);
    // …and the SAME assertion the guard uses above would fail for it — the guard bites.
    expect(fp).toBeGreaterThan(loose.precisionBudget);
  });
});
