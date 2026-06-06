import { describe, it, expect } from 'vitest';
import { diffCapabilities } from '../drift.js';
import { extractCapabilitySet } from '../lock.js';
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

function lock(over: Partial<LockFile> = {}): LockFile {
  return {
    schemaVersion: '1.0.0',
    approvedVerdict: 'PASS',
    fileHashes: {},
    capabilities: [],
    exclusions: { excludedCount: 0, patterns: [] },
    ...over,
  };
}

describe('diffCapabilities — benign drift (the FP line, EARS-080/081)', () => {
  it('raises NO finding when the capability set is unchanged but file hashes differ (doc edit/reorder)', () => {
    const fresh: Finding[] = []; // a clean target stays clean
    const baseline = lock({
      fileHashes: { 'README.md': 'OLDHASH', 'SKILL.md': 'OLD2' },
      capabilities: [],
    });
    const freshHashes = { 'README.md': 'NEWHASH', 'SKILL.md': 'OLD2' };
    const result = diffCapabilities(fresh, freshHashes, baseline);
    expect(result.findings).toEqual([]);
    expect(result.changedSinceApproval).toBe(1); // README changed → informational note only
  });

  it('reports zero changed files when every hash matches the baseline', () => {
    const baseline = lock({ fileHashes: { 'a.sh': 'h1' } });
    const result = diffCapabilities([], { 'a.sh': 'h1' }, baseline);
    expect(result.changedSinceApproval).toBe(0);
    expect(result.findings).toEqual([]);
  });
});

describe('diffCapabilities — escalation (the rug-pull, EARS-082)', () => {
  it('raises a T3 version-drift escalation when a NEW capability appears since approval', () => {
    const approved = lock({ capabilities: [] }); // clean at approval
    const fresh = [finding()]; // a new curl|sh sink appeared
    const result = diffCapabilities(fresh, {}, approved);
    expect(result.findings).toHaveLength(1);
    const f = result.findings[0]!;
    expect(f.driftKind).toBe('escalation');
    expect(f.detectionClass).toBe('version-drift');
    expect(f.tier).toBe('T3');
    expect(f.severity).toBe('high');
    expect(f.file).toBe('install.sh');
    expect(f.line).toBe(4);
    expect(f.owasp).toBe('ASI04');
    expect(f.atlas.length).toBeGreaterThan(0);
    expect(f.why).toContain('since approval');
  });

  it('does NOT escalate a capability that was already approved (present in the baseline set)', () => {
    const already = extractCapabilitySet([finding()]);
    const approved = lock({ capabilities: already });
    const result = diffCapabilities([finding()], {}, approved);
    expect(result.findings.filter((f) => f.driftKind === 'escalation')).toEqual([]);
  });

  it('escalates only the NEW capability when the set grows from one to two', () => {
    const approved = lock({ capabilities: extractCapabilitySet([finding({ file: 'a.sh', line: 1 })]) });
    const fresh = [finding({ file: 'a.sh', line: 1 }), finding({ file: 'b.sh', line: 2 })];
    const result = diffCapabilities(fresh, {}, approved);
    const escalations = result.findings.filter((f) => f.driftKind === 'escalation');
    expect(escalations).toHaveLength(1);
    expect(escalations[0]!.file).toBe('b.sh');
  });
});

describe('diffCapabilities — approval invalidation (EARS-083)', () => {
  it('re-surfaces an approved capability whose underlying file bytes changed since approval', () => {
    const approvedCap = extractCapabilitySet([finding()]); // install.sh:4 was approved
    const approved = lock({
      capabilities: approvedCap,
      fileHashes: { 'install.sh': 'OLDHASH' },
    });
    // fresh scan still finds it (same capability) BUT install.sh changed bytes
    const result = diffCapabilities([finding()], { 'install.sh': 'NEWHASH' }, approved);
    const invalidations = result.findings.filter((f) => f.driftKind === 'approval-invalidation');
    expect(invalidations).toHaveLength(1);
    expect(invalidations[0]!.file).toBe('install.sh');
    expect(invalidations[0]!.tier).toBe('T3');
    expect(invalidations[0]!.why).toContain('changed since it was approved');
  });

  it('does NOT invalidate an approved capability whose file is byte-identical to approval', () => {
    const approvedCap = extractCapabilitySet([finding()]);
    const approved = lock({ capabilities: approvedCap, fileHashes: { 'install.sh': 'SAME' } });
    const result = diffCapabilities([finding()], { 'install.sh': 'SAME' }, approved);
    expect(result.findings.filter((f) => f.driftKind === 'approval-invalidation')).toEqual([]);
  });
});

describe('diffCapabilities — anti-laundering disclosure (EARS-085)', () => {
  it('counts how many HIGH-severity findings the lockfile recorded as approved', () => {
    const approved = lock({
      capabilities: extractCapabilitySet([
        finding({ severity: 'high', file: 'a.sh', line: 1 }),
        finding({ severity: 'high', file: 'b.sh', line: 2 }),
        finding({ severity: 'low', file: 'c.sh', line: 3 }),
      ]),
    });
    const result = diffCapabilities([], {}, approved);
    expect(result.approvedHighCount).toBe(2);
  });
});
