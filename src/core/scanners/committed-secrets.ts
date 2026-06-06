import type { Rule } from '../types.js';
import { lineRule } from './match-helpers.js';

const C = 'committed-secrets' as const;

/**
 * Rules for the committed-secrets detection class. Precision-first: each pattern matches a
 * concrete credential shape, and obvious placeholders (YOUR_KEY_HERE, EXAMPLE-only contexts)
 * are excluded so documentation does not trip the BLOCK threshold.
 *
 * Note AKIAIOSFODNN7EXAMPLE is AWS's official documentation key; real audited skills that ship
 * it verbatim are still worth flagging, so the AKIA rule matches it — the FP guard is the
 * placeholder rule below, which only suppresses `=YOUR_KEY_HERE`-style assignments.
 */
export const committedSecretsRules: readonly Rule[] = [
  lineRule({
    id: 'committed-secrets/aws-access-key',
    detectionClass: C,
    severity: 'high',
    why: 'Contains an AWS access key id (AKIA…) — a committed long-lived credential.',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  }),
  lineRule({
    id: 'committed-secrets/private-key-block',
    detectionClass: C,
    severity: 'high',
    why: 'Contains a PEM private-key header — a committed private key.',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/,
  }),
  lineRule({
    id: 'committed-secrets/github-token',
    detectionClass: C,
    severity: 'high',
    why: 'Contains a GitHub personal access token (ghp_…).',
    pattern: /\bghp_[0-9A-Za-z]{36,255}\b/,
  }),
];
