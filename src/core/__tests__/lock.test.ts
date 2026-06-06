import { describe, it, expect } from 'vitest';
import { extractCapabilitySet, serialiseLock, capabilitySetKey } from '../lock.js';
import type { Finding, LockFile } from '../types.js';

function finding(over: Partial<Finding> = {}): Finding {
  return {
    rule: 'dangerous-bash/curl-pipe-to-shell',
    detectionClass: 'dangerous-bash',
    severity: 'high',
    file: 'install.sh',
    line: 4,
    excerpt: 'curl x | sh',
    why: 'pipes a remote script to a shell',
    tier: 'T0',
    owasp: 'ASI04',
    atlas: 'AML.T0011',
    ...over,
  };
}

describe('extractCapabilitySet — the capability fingerprint (EARS-075/080)', () => {
  it('projects each finding to its stable structural capability key (rule/class/severity/file/line)', () => {
    const caps = extractCapabilitySet([finding()]);
    expect(caps).toEqual([
      {
        rule: 'dangerous-bash/curl-pipe-to-shell',
        detectionClass: 'dangerous-bash',
        severity: 'high',
        file: 'install.sh',
        line: 4,
      },
    ]);
  });

  it('is order-independent: two finding lists differing only in order produce an equal capability SET', () => {
    const a = extractCapabilitySet([finding({ file: 'a.sh', line: 1 }), finding({ file: 'b.sh', line: 2 })]);
    const b = extractCapabilitySet([finding({ file: 'b.sh', line: 2 }), finding({ file: 'a.sh', line: 1 })]);
    expect(a.map(capabilitySetKey).sort()).toEqual(b.map(capabilitySetKey).sort());
  });

  it('does not carry excerpt/why/owasp/atlas (benign byte drift must not change the fingerprint)', () => {
    const caps = extractCapabilitySet([finding({ excerpt: 'TOTALLY DIFFERENT TEXT', why: 'reworded' })]);
    expect(Object.keys(caps[0]!)).toEqual(['rule', 'detectionClass', 'severity', 'file', 'line']);
  });

  it('returns an empty set for no findings', () => {
    expect(extractCapabilitySet([])).toEqual([]);
  });
});

describe('serialiseLock — byte-stable deterministic JSON (EARS-076)', () => {
  const lock: LockFile = {
    schemaVersion: '1.0.0',
    approvedVerdict: 'PASS',
    fileHashes: { 'b.txt': 'bbb', 'a.txt': 'aaa' },
    capabilities: [],
    exclusions: { excludedCount: 0, patterns: [] },
  };

  it('ends with exactly one trailing newline', () => {
    const text = serialiseLock(lock);
    expect(text.endsWith('\n')).toBe(true);
    expect(text.endsWith('\n\n')).toBe(false);
  });

  it('sorts object keys so the bytes are stable regardless of input key order', () => {
    const reordered: LockFile = {
      // same data, different insertion order
      exclusions: { patterns: [], excludedCount: 0 },
      capabilities: [],
      fileHashes: { 'a.txt': 'aaa', 'b.txt': 'bbb' },
      approvedVerdict: 'PASS',
      schemaVersion: '1.0.0',
    } as LockFile;
    expect(serialiseLock(reordered)).toBe(serialiseLock(lock));
  });

  it('sorts the fileHashes map by path (stable ordering of the hash set)', () => {
    const text = serialiseLock(lock);
    expect(text.indexOf('a.txt')).toBeLessThan(text.indexOf('b.txt'));
  });

  it('sorts the capability array by its stable key (reorder-independent bytes)', () => {
    const c1 = { rule: 'r2', detectionClass: 'dangerous-bash', severity: 'high', file: 'z.sh', line: 9 } as const;
    const c2 = { rule: 'r1', detectionClass: 'dangerous-bash', severity: 'high', file: 'a.sh', line: 1 } as const;
    const one = serialiseLock({ ...lock, capabilities: [c1, c2] });
    const two = serialiseLock({ ...lock, capabilities: [c2, c1] });
    expect(one).toBe(two);
  });
});
