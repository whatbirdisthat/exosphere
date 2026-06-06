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
  { dir: 'benign/ben-date-formatter', label: 'benign', expectedVerdict: 'PASS' },
  { dir: 'benign/ben-narrow-perms', label: 'benign', expectedVerdict: 'PASS' },
  { dir: 'benign/ben-security-docs', label: 'benign', expectedVerdict: 'PASS' },
  { dir: 'benign/ben-build-script', label: 'benign', expectedVerdict: 'PASS' },
];
