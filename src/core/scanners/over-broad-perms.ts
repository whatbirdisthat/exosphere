import type { FileRecord, FrameworkMapping, Rule, RuleMatch } from '../types.js';
import { lineRule } from './match-helpers.js';

const C = 'over-broad-perms' as const;

const PERM_KINDS: ReadonlySet<FileRecord['kind']> = new Set(['settings', 'mcp-config', 'hook'] as const);

// Framework mapping (ADR-004): over-broad permissions are Agent Identity & Privilege Abuse
// (OWASP ASI03) realised via plugin/tool compromise (MITRE ATLAS LLM Plugin Compromise).
const PRIV_ABUSE: FrameworkMapping = { owasp: 'ASI03', atlas: 'AML.T0053' };

/**
 * An MCP server that combines filesystem + network + secret scopes in a single server is
 * over-broad. We parse the JSON and inspect each server's declared scopes rather than
 * line-matching, because the three scope tokens can appear on one line or many.
 */
const mcpCombinedScopesRule: Rule = {
  id: 'over-broad-perms/mcp-combined-scopes',
  detectionClass: C,
  severity: 'high',
  why: 'An MCP server combines filesystem, network, and secret access in one scope — a broad blast radius.',
  tier: 'T0',
  framework: PRIV_ABUSE,
  detect: (file: FileRecord): RuleMatch[] => {
    if (file.kind !== 'mcp-config') {
      return [];
    }
    const matches: RuleMatch[] = [];
    let lineNo = 0;
    for (const line of file.content.split('\n')) {
      lineNo++;
      const hasFs = /filesystem/.test(line);
      const hasNet = /network/.test(line);
      const hasSecret = /secret/.test(line);
      if (hasFs && hasNet && hasSecret) {
        matches.push({ line: lineNo, excerpt: line.trim() });
      }
    }
    return matches;
  },
};

export const overBroadPermsRules: readonly Rule[] = [
  lineRule({
    id: 'over-broad-perms/bash-allow-all',
    detectionClass: C,
    severity: 'high',
    why: 'Grants unrestricted Bash execution (Bash(*)) — equivalent to full shell access.',
    tier: 'T0',
    framework: PRIV_ABUSE,
    // Bash(*) but NOT Bash(ls:*) / Bash(specific:*) — the wildcard must be the whole argument.
    pattern: /["']Bash\(\*\)["']/,
    appliesTo: PERM_KINDS,
  }),
  lineRule({
    id: 'over-broad-perms/hook-network-command',
    detectionClass: C,
    severity: 'high',
    why: 'A hook runs a network command, allowing silent outbound calls at lifecycle events.',
    tier: 'T0',
    framework: PRIV_ABUSE,
    pattern: /"command"\s*:\s*"[^"]*\b(?:curl|wget|nc|ncat)\b/,
    appliesTo: PERM_KINDS,
  }),
  mcpCombinedScopesRule,
];
