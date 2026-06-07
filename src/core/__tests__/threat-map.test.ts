import { describe, it, expect } from 'vitest';
import { ruleSpecs } from '../ruleset.js';
import type { AgenticAxis, StridePortal } from '../types.js';

// The threat-map invariant (the "STRIDE as data" slice). STRIDE is carried on every probe as JUST
// ANOTHER threat-intelligence source — peer to OWASP/ATLAS, never a brand. These tests make the
// classification DE-FACTO REQUIRED so it cannot silently rot, exactly as owasp/atlas already are
// (ruleset.test.ts), and prove the two EXTRA agentic axes (temporal, cognitive) are populated — the
// gap ritual (doc/threat-model/) reasons over this data mechanically.

const VALID_PORTALS: ReadonlySet<StridePortal> = new Set(['S', 'T', 'R', 'I', 'D', 'E']);
const VALID_AXES: ReadonlySet<AgenticAxis> = new Set(['temporal', 'cognitive']);

describe('threat-map classification (STRIDE portals + agentic axes)', () => {
  // Every rule must locate itself on the threat map: a STRIDE portal OR an EXTRA axis (or both). This
  // is the load-bearing invariant — a new rule that forgets to classify itself fails the build.
  it.each(ruleSpecs.map((s) => [s.id, s] as const))(
    'rule %s declares at least one STRIDE portal or agentic axis',
    (_id, spec) => {
      const strideCount = spec.framework.stride?.length ?? 0;
      const axisCount = spec.framework.axis?.length ?? 0;
      expect(strideCount + axisCount, `${spec.id} has neither stride nor axis`).toBeGreaterThan(0);
    },
  );

  it('uses only valid STRIDE portals and agentic axes', () => {
    for (const s of ruleSpecs) {
      for (const p of s.framework.stride ?? []) {
        expect(VALID_PORTALS.has(p), `${s.id} bad portal ${p}`).toBe(true);
      }
      for (const a of s.framework.axis ?? []) {
        expect(VALID_AXES.has(a), `${s.id} bad axis ${a}`).toBe(true);
      }
    }
  });

  it('covers Tampering, Information-disclosure and Elevation portals (the HEAVY cells)', () => {
    const portals = new Set<StridePortal>(ruleSpecs.flatMap((s) => [...(s.framework.stride ?? [])]));
    for (const heavy of ['T', 'I', 'E'] as const) {
      expect(portals.has(heavy), `expected probes covering portal ${heavy}`).toBe(true);
    }
  });

  // The product's moat: the prompt-injection family escapes classic STRIDE on the `cognitive` axis.
  it('tags the prompt-injection family with the cognitive axis', () => {
    const injection = ruleSpecs.filter((s) => s.detectionClass === 'prompt-injection');
    expect(injection.length).toBeGreaterThan(0);
    for (const s of injection) {
      expect(s.framework.axis ?? [], `${s.id} cognitive axis`).toContain('cognitive');
    }
  });
});
