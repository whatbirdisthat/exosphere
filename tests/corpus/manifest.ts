import type { DetectionClass, Verdict } from '../../src/core/types.js';

/** A labelled corpus entry — the success oracle. Built test-first alongside the scanner. */
export interface CorpusEntry {
  readonly dir: string;
  readonly label: 'malicious' | 'benign';
  readonly expectedVerdict: Verdict;
  /** For malicious entries: the detection class + a file:line the BLOCK must cite. */
  readonly expectCite?: {
    readonly detectionClass: DetectionClass;
    readonly file: string;
    readonly line: number;
    /** R9a: the framework ids the cited finding must carry (OWASP + MITRE ATLAS). */
    readonly owasp?: string;
    readonly atlas?: string;
  };
}

export const CORPUS: readonly CorpusEntry[] = [
  {
    dir: 'malicious/mal-dangerous-bash',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: { detectionClass: 'dangerous-bash', file: 'install.sh', line: 4 },
  },
  {
    dir: 'malicious/mal-prompt-injection',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: { detectionClass: 'prompt-injection', file: 'SKILL.md', line: 10 },
  },
  {
    dir: 'malicious/mal-over-broad-perms',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: { detectionClass: 'over-broad-perms', file: 'settings.json', line: 3 },
  },
  {
    dir: 'malicious/mal-committed-secrets',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: { detectionClass: 'committed-secrets', file: 'config.env', line: 3 },
  },
  {
    dir: 'malicious/mal-blended-exfil',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: { detectionClass: 'dangerous-bash', file: 'scripts/run.sh', line: 2 },
  },
  // ── R9a malicious fixtures (each cites file:line + rule + framework ids) ──
  {
    dir: 'malicious/mal-homoglyph-injection',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: {
      detectionClass: 'prompt-injection',
      file: 'SKILL.md',
      line: 8,
      owasp: 'LLM01',
      atlas: 'AML.T0051',
    },
  },
  {
    dir: 'malicious/mal-base64-injection',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: {
      detectionClass: 'prompt-injection',
      file: 'SKILL.md',
      line: 8,
      owasp: 'LLM01',
      atlas: 'AML.T0051',
    },
  },
  {
    dir: 'malicious/mal-hex-injection',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: {
      detectionClass: 'prompt-injection',
      file: 'SKILL.md',
      line: 8,
      owasp: 'LLM01',
      atlas: 'AML.T0051',
    },
  },
  {
    dir: 'malicious/mal-ansi-linejump',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: {
      detectionClass: 'prompt-injection',
      file: 'agents/helper.md',
      line: 3,
      owasp: 'LLM01',
      atlas: 'AML.T0051',
    },
  },
  {
    dir: 'malicious/mal-skill-desc-poisoning',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: {
      detectionClass: 'tool-description-poisoning',
      file: 'SKILL.md',
      line: 3,
      owasp: 'MCP-T01',
      atlas: 'AML.T0051',
    },
  },
  {
    dir: 'malicious/mal-mcp-desc-poisoning',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: {
      detectionClass: 'tool-description-poisoning',
      file: '.mcp.json',
      line: 6,
      owasp: 'MCP-T01',
      atlas: 'AML.T0051',
    },
  },
  // ── R9b T1 dataflow malicious fixtures (each cites the SINK file:line + dataflow-taint + framework ids) ──
  {
    dir: 'malicious/mal-dataflow-split-curl',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: {
      detectionClass: 'dataflow-taint',
      file: 'install.sh',
      line: 6,
      owasp: 'ASI04',
      atlas: 'AML.T0011',
    },
  },
  {
    dir: 'malicious/mal-dataflow-base64-assemble',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: {
      detectionClass: 'dataflow-taint',
      file: 'hooks/post-install.sh',
      line: 4,
      owasp: 'ASI04',
      atlas: 'AML.T0011',
    },
  },
  {
    dir: 'malicious/mal-dataflow-autorun',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: {
      detectionClass: 'dataflow-taint',
      file: 'install.sh',
      line: 3,
      owasp: 'ASI04',
      atlas: 'AML.T0011',
    },
  },
  // ── R9b.1 T1 CROSS-FILE dataflow malicious fixtures (split across FILES; include-escape) ──
  {
    dir: 'malicious/mal-crossfile-split-curl',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: {
      detectionClass: 'dataflow-taint',
      file: 'install.sh',
      line: 3,
      owasp: 'ASI04',
      atlas: 'AML.T0011',
    },
  },
  {
    dir: 'malicious/mal-crossfile-autorun',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: {
      detectionClass: 'dataflow-taint',
      file: 'install.sh',
      line: 3,
      owasp: 'ASI04',
      atlas: 'AML.T0011',
    },
  },
  {
    dir: 'malicious/mal-crossfile-include-escape',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: {
      detectionClass: 'dataflow-taint',
      file: 'install.sh',
      line: 2,
      owasp: 'ASI04',
      atlas: 'AML.T0011',
    },
  },
  // ── Threat-map gap-ritual fixtures: the first two ABSENT STRIDE cells (D and R) ──
  {
    dir: 'malicious/mal-destructive-delete',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: { detectionClass: 'resource-exhaustion', file: 'wipe.sh', line: 2, owasp: 'ASI04', atlas: 'AML.T0011' },
  },
  {
    dir: 'malicious/mal-fork-bomb',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: { detectionClass: 'resource-exhaustion', file: 'bomb.sh', line: 2, owasp: 'ASI04', atlas: 'AML.T0011' },
  },
  {
    dir: 'malicious/mal-disk-destroyer',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: { detectionClass: 'resource-exhaustion', file: 'format.sh', line: 2, owasp: 'ASI04', atlas: 'AML.T0011' },
  },
  {
    dir: 'malicious/mal-history-clear',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: { detectionClass: 'audit-evasion', file: 'cleanup.sh', line: 2, owasp: 'ASI04', atlas: 'AML.T0011' },
  },
  {
    dir: 'malicious/mal-log-tamper',
    label: 'malicious',
    expectedVerdict: 'BLOCK',
    expectCite: { detectionClass: 'audit-evasion', file: 'cover.sh', line: 2, owasp: 'ASI04', atlas: 'AML.T0011' },
  },
  { dir: 'benign/ben-safe-cleanup', label: 'benign', expectedVerdict: 'PASS' },
  { dir: 'benign/ben-date-formatter', label: 'benign', expectedVerdict: 'PASS' },
  { dir: 'benign/ben-narrow-perms', label: 'benign', expectedVerdict: 'PASS' },
  { dir: 'benign/ben-security-docs', label: 'benign', expectedVerdict: 'PASS' },
  { dir: 'benign/ben-build-script', label: 'benign', expectedVerdict: 'PASS' },
  // ── R9a benign near-misses (precision boundary) ──
  { dir: 'benign/ben-base64-docs', label: 'benign', expectedVerdict: 'PASS' },
  { dir: 'benign/ben-plain-description', label: 'benign', expectedVerdict: 'PASS' },
  { dir: 'benign/ben-accented-prose', label: 'benign', expectedVerdict: 'PASS' },
  // ── R9b benign near-misses (T1 precision boundary): multi-step scripts whose taint never sinks ──
  { dir: 'benign/ben-pinned-download', label: 'benign', expectedVerdict: 'PASS' },
  { dir: 'benign/ben-captured-echo', label: 'benign', expectedVerdict: 'PASS' },
  // ── R9b.1 benign CROSS-FILE near-misses: multi-file bundles whose sourced taint never sinks ──
  { dir: 'benign/ben-crossfile-pinned-download', label: 'benign', expectedVerdict: 'PASS' },
  { dir: 'benign/ben-crossfile-captured-echo', label: 'benign', expectedVerdict: 'PASS' },
];
