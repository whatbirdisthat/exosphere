import type { FrameworkMapping, RuleSpec } from '../types.js';

// Rule DATA for the committed-secrets detection class (R4 / ADR-005). Declarative line-patterns,
// preserved verbatim from R9a. Precision-first: each pattern matches a concrete credential shape.

const C = 'committed-secrets' as const;
const CREDS: FrameworkMapping = { owasp: 'ASI04', atlas: 'AML.T0055' };

export const committedSecretsRules: readonly RuleSpec[] = [
  {
    id: 'committed-secrets/aws-access-key',
    detectionClass: C,
    severity: 'high',
    why: 'Contains an AWS access key id (AKIA…) — a committed long-lived credential.',
    tier: 'T0',
    framework: CREDS,
    matcher: { kind: 'line-pattern', pattern: '\\bAKIA[0-9A-Z]{16}\\b' },
    failFixtures: [{ kind: 'other', content: 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE' }],
    passFixtures: [{ kind: 'other', content: 'AWS_ACCESS_KEY_ID=YOUR_KEY_HERE' }],
    precisionBudget: 0,
  },
  {
    id: 'committed-secrets/private-key-block',
    detectionClass: C,
    severity: 'high',
    why: 'Contains a PEM private-key header — a committed private key.',
    tier: 'T0',
    framework: CREDS,
    matcher: { kind: 'line-pattern', pattern: '-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----' },
    failFixtures: [{ kind: 'other', content: '-----BEGIN RSA PRIVATE KEY-----' }],
    passFixtures: [{ kind: 'other', content: '-----BEGIN CERTIFICATE-----' }],
    precisionBudget: 0,
  },
  {
    id: 'committed-secrets/github-token',
    detectionClass: C,
    severity: 'high',
    why: 'Contains a GitHub personal access token (ghp_…).',
    tier: 'T0',
    framework: CREDS,
    matcher: { kind: 'line-pattern', pattern: '\\bghp_[0-9A-Za-z]{36,255}\\b' },
    failFixtures: [
      { kind: 'other', content: 'token: ghp_0123456789abcdefABCDEF0123456789abcdef' },
    ],
    passFixtures: [{ kind: 'other', content: 'token: ghp_REPLACE_ME' }],
    precisionBudget: 0,
  },
];
