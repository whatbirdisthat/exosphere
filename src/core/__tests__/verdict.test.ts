import { describe, it, expect } from 'vitest';
import { aggregate, exitCodeFor } from '../verdict.js';
import type { Finding, Severity } from '../types.js';

const finding = (severity: Severity): Finding => ({
  rule: 'r',
  detectionClass: 'dangerous-bash',
  severity,
  file: 'f',
  line: 1,
  excerpt: 'e',
  why: 'w',
});

describe('verdict.aggregate', () => {
  // @EARS-018
  it('returns PASS when there are no findings', () => {
    expect(aggregate([])).toBe('PASS');
  });

  // @EARS-019 — only low
  it('returns REVIEW when the max severity is low', () => {
    expect(aggregate([finding('low')])).toBe('REVIEW');
  });

  // @EARS-019 — only medium (boundary just below high)
  it('returns REVIEW when the max severity is medium', () => {
    expect(aggregate([finding('low'), finding('medium')])).toBe('REVIEW');
  });

  // @EARS-020 — any high
  it('returns BLOCK when any finding is high severity', () => {
    expect(aggregate([finding('low'), finding('high')])).toBe('BLOCK');
  });
});

describe('verdict.exitCodeFor', () => {
  // @EARS-022
  it('returns non-zero for BLOCK', () => {
    expect(exitCodeFor('BLOCK')).toBeGreaterThan(0);
  });

  it('returns zero for PASS', () => {
    expect(exitCodeFor('PASS')).toBe(0);
  });

  it('returns zero for REVIEW', () => {
    expect(exitCodeFor('REVIEW')).toBe(0);
  });
});
