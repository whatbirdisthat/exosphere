import type { FrameworkMapping, Rule } from '../types.js';
import { lineRule } from './match-helpers.js';

const C = 'dangerous-bash' as const;

/**
 * Rules for the dangerous-bash detection class. Precision-first: each pattern targets a
 * concrete exfiltration / RCE shape, not a bare keyword (so a comment mentioning `curl`
 * without an actual pipe-to-shell does not match).
 */
// Framework mapping (ADR-004): dangerous-bash payloads are an Agentic Supply-Chain Compromise
// (OWASP ASI04) realised via a command interpreter / malicious user execution (MITRE ATLAS).
const SUPPLY_CHAIN: FrameworkMapping = { owasp: 'ASI04', atlas: 'AML.T0011' };
const CMD_EXEC: FrameworkMapping = { owasp: 'ASI04', atlas: 'AML.T0050' };

export const dangerousBashRules: readonly Rule[] = [
  lineRule({
    id: 'dangerous-bash/curl-pipe-to-shell',
    detectionClass: C,
    severity: 'high',
    why: 'Pipes a remotely-fetched script straight into a shell (remote code execution).',
    tier: 'T0',
    framework: CMD_EXEC,
    // curl/wget ... | sh|bash — and NOT inside a comment that has no actual command before it.
    pattern: /^(?![^#]*#.*\b(?:curl|wget)\b)[^#]*\b(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash|zsh)\b/,
  }),
  lineRule({
    id: 'dangerous-bash/reverse-shell-dev-tcp',
    detectionClass: C,
    severity: 'high',
    why: 'Opens a /dev/tcp reverse shell to an attacker-controlled host.',
    tier: 'T0',
    framework: CMD_EXEC,
    pattern: /\/dev\/tcp\/[0-9a-zA-Z.]+\/\d+/,
  }),
  lineRule({
    id: 'dangerous-bash/secret-path-read',
    detectionClass: C,
    severity: 'high',
    why: 'Reads a well-known credential path (AWS/SSH/GCP), a typical exfiltration step.',
    tier: 'T0',
    framework: SUPPLY_CHAIN,
    pattern: /\b(?:cat|cp|tar|scp|curl|head|less|more)\b[^\n]*~?\/?\.(?:aws|ssh|gcp|config\/gcloud)\b/,
  }),
  lineRule({
    id: 'dangerous-bash/base64-piped-payload',
    detectionClass: C,
    severity: 'high',
    why: 'Decodes a base64 blob and pipes it into a shell — a common obfuscated payload.',
    tier: 'T0',
    framework: CMD_EXEC,
    pattern: /base64\s+(?:-d|--decode|-D)\b[^\n]*\|\s*(?:sh|bash|zsh)\b/,
  }),
];
