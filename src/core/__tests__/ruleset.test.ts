import { describe, it, expect } from 'vitest';
import { ruleset, RULESET_VERSION } from '../ruleset.js';
import type { DetectionClass } from '../types.js';

describe('ruleset', () => {
  it('exposes a versioned ruleset', () => {
    expect(RULESET_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('includes rules from all four detection classes', () => {
    const classes = new Set<DetectionClass>(ruleset.map((r) => r.detectionClass));
    expect(classes).toEqual(
      new Set<DetectionClass>([
        'dangerous-bash',
        'prompt-injection',
        'over-broad-perms',
        'committed-secrets',
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
});
