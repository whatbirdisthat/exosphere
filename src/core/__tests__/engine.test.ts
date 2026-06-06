import { describe, it, expect } from 'vitest';
import { scan } from '../engine.js';
import type { FileRecord, Rule } from '../types.js';

const alwaysLine1: Rule = {
  id: 'test/always',
  detectionClass: 'dangerous-bash',
  severity: 'high',
  why: 'test rule',
  detect: (f) => (f.content.includes('HIT') ? [{ line: 1, excerpt: 'HIT' }] : []),
};

const file = (content: string, path = 'a.txt'): FileRecord => ({ path, content, kind: 'other' });

describe('engine.scan', () => {
  // @EARS-016 — shapes a finding from a rule match with all fields
  it('shapes a finding carrying rule, class, severity, file, line, excerpt, why', () => {
    const findings = scan([file('HIT')], [alwaysLine1]);
    expect(findings).toEqual([
      {
        rule: 'test/always',
        detectionClass: 'dangerous-bash',
        severity: 'high',
        file: 'a.txt',
        line: 1,
        excerpt: 'HIT',
        why: 'test rule',
      },
    ]);
  });

  // @EARS-017 — no match yields no findings
  it('returns no findings when no rule matches', () => {
    expect(scan([file('clean')], [alwaysLine1])).toEqual([]);
  });

  // empty inputs
  it('returns no findings for empty files', () => {
    expect(scan([], [alwaysLine1])).toEqual([]);
  });

  it('returns no findings for empty ruleset', () => {
    expect(scan([file('HIT')], [])).toEqual([]);
  });

  // multiple files, multiple rules — accumulates
  it('accumulates findings across files and rules', () => {
    const second: Rule = { ...alwaysLine1, id: 'test/second' };
    const findings = scan([file('HIT', 'x'), file('HIT', 'y')], [alwaysLine1, second]);
    expect(findings).toHaveLength(4);
    expect(findings.map((x) => x.file).sort()).toEqual(['x', 'x', 'y', 'y']);
  });
});
