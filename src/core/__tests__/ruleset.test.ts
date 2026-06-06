import { describe, it, expect } from 'vitest';
import { ruleset, ruleSpecs, RULESET_VERSION, RULESET_SCHEMA_VERSION } from '../ruleset.js';
import type { DetectionClass } from '../types.js';

describe('ruleset', () => {
  it('exposes a versioned ruleset', () => {
    expect(RULESET_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  // @EARS-054 — publishes both a schema version and a content version, each semantic-version strings
  it('exposes a RULESET_SCHEMA_VERSION and a RULESET_VERSION as semver strings', () => {
    expect(RULESET_SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(RULESET_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  // @EARS-048 — each rule is a self-describing DATA record with matcher + own fixtures + budget
  it('expresses every rule as a self-describing data spec (matcher, fixtures, budget)', () => {
    expect(ruleSpecs.length).toBe(ruleset.length);
    for (const s of ruleSpecs) {
      expect(s.id.length, `${s.id} id`).toBeGreaterThan(0);
      expect(['line-pattern', 'builtin']).toContain(s.matcher.kind);
      expect(Array.isArray(s.passFixtures)).toBe(true);
      expect(Array.isArray(s.failFixtures)).toBe(true);
      expect(typeof s.precisionBudget).toBe('number');
    }
  });

  it('includes rules from all six detection classes (R9b adds dataflow-taint)', () => {
    const classes = new Set<DetectionClass>(ruleset.map((r) => r.detectionClass));
    expect(classes).toEqual(
      new Set<DetectionClass>([
        'dangerous-bash',
        'prompt-injection',
        'over-broad-perms',
        'committed-secrets',
        'tool-description-poisoning',
        'dataflow-taint',
      ]),
    );
  });

  it('gives every rule a unique id', () => {
    const ids = ruleset.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every rule a non-empty why and a valid severity', () => {
    for (const r of ruleset) {
      expect(r.why.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(r.severity);
    }
  });

  // @EARS-039 @EARS-059 — every rule carries a valid tier (T0 or the R9b T1) + OWASP + ATLAS
  it('gives every rule a valid tier and a non-empty OWASP + MITRE ATLAS framework mapping', () => {
    for (const r of ruleset) {
      expect(['T0', 'T1'], `${r.id} tier`).toContain(r.tier);
      expect(r.framework.owasp.length, `${r.id} owasp`).toBeGreaterThan(0);
      expect(r.framework.atlas.length, `${r.id} atlas`).toBeGreaterThan(0);
    }
  });

  // @EARS-039 — the tool-description-poisoning detection class is present
  it('includes the tool-description-poisoning detection class', () => {
    const classes = new Set<DetectionClass>(ruleset.map((r) => r.detectionClass));
    expect(classes.has('tool-description-poisoning')).toBe(true);
  });

  // @EARS-058 — the T1 dataflow-taint class is present and every dataflow-taint rule is tier T1
  it('includes the T1 dataflow-taint detection class with tier T1 (R9b)', () => {
    const t1 = ruleset.filter((r) => r.detectionClass === 'dataflow-taint');
    expect(t1.length).toBeGreaterThan(0);
    for (const r of t1) {
      expect(r.tier, `${r.id} tier`).toBe('T1');
    }
  });
});
