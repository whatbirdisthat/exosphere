import { describe, it, expect } from 'vitest';
import { ruleset, RULESET_VERSION } from '../ruleset.js';
import type { DetectionClass } from '../types.js';

describe('ruleset', () => {
  it('exposes a versioned ruleset', () => {
    expect(RULESET_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('includes rules from all five detection classes', () => {
    const classes = new Set<DetectionClass>(ruleset.map((r) => r.detectionClass));
    expect(classes).toEqual(
      new Set<DetectionClass>([
        'dangerous-bash',
        'prompt-injection',
        'over-broad-perms',
        'committed-secrets',
        'tool-description-poisoning',
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

  // @EARS-039 — every rule (existing four classes + new) carries tier T0 + OWASP + ATLAS
  it('gives every rule tier T0 and a non-empty OWASP + MITRE ATLAS framework mapping', () => {
    for (const r of ruleset) {
      expect(r.tier, `${r.id} tier`).toBe('T0');
      expect(r.framework.owasp.length, `${r.id} owasp`).toBeGreaterThan(0);
      expect(r.framework.atlas.length, `${r.id} atlas`).toBeGreaterThan(0);
    }
  });

  // @EARS-039 — the new fifth detection class is present in the ruleset
  it('includes the tool-description-poisoning detection class', () => {
    const classes = new Set<DetectionClass>(ruleset.map((r) => r.detectionClass));
    expect(classes.has('tool-description-poisoning')).toBe(true);
  });
});
