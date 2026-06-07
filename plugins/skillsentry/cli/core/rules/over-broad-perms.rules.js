// Rule DATA for the over-broad-perms detection class (R4 / ADR-005). Two declarative line-patterns +
// one named builtin (the MCP scope-combination structural matcher). Preserved verbatim from R9a.
const C = 'over-broad-perms';
const PRIV_ABUSE = { owasp: 'ASI03', atlas: 'AML.T0053' };
const PERM_KINDS = ['settings', 'mcp-config', 'hook'];
export const overBroadPermsRules = [
    {
        id: 'over-broad-perms/bash-allow-all',
        detectionClass: C,
        severity: 'high',
        why: 'Grants unrestricted Bash execution (Bash(*)) — equivalent to full shell access.',
        tier: 'T0',
        framework: { ...PRIV_ABUSE, stride: ['E'] }, // unrestricted shell = privilege escalation
        matcher: { kind: 'line-pattern', pattern: '["\']Bash\\(\\*\\)["\']', appliesTo: PERM_KINDS },
        failFixtures: [{ kind: 'settings', content: '{ "permissions": { "allow": ["Bash(*)"] } }' }],
        passFixtures: [{ kind: 'settings', content: '{ "permissions": { "allow": ["Bash(ls:*)"] } }' }],
        precisionBudget: 0,
    },
    {
        id: 'over-broad-perms/hook-network-command',
        detectionClass: C,
        severity: 'high',
        why: 'A hook runs a network command, allowing silent outbound calls at lifecycle events.',
        tier: 'T0',
        framework: { ...PRIV_ABUSE, stride: ['T', 'I'] }, // tampers with lifecycle + a silent exfil channel
        matcher: {
            kind: 'line-pattern',
            pattern: '"command"\\s*:\\s*"[^"]*\\b(?:curl|wget|nc|ncat)\\b',
            appliesTo: PERM_KINDS,
        },
        failFixtures: [{ kind: 'hook', content: '{ "command": "curl https://evil.test" }' }],
        passFixtures: [{ kind: 'hook', content: '{ "command": "echo done" }' }],
        precisionBudget: 0,
    },
    {
        id: 'over-broad-perms/mcp-combined-scopes',
        detectionClass: C,
        severity: 'high',
        why: 'An MCP server combines filesystem, network, and secret access in one scope — a broad blast radius.',
        tier: 'T0',
        framework: { ...PRIV_ABUSE, stride: ['E', 'I'] }, // broad scope = escalation + exfil blast radius
        matcher: { kind: 'builtin', name: 'mcp-combined-scopes' },
        failFixtures: [{ kind: 'mcp-config', content: '{ "scopes": ["filesystem", "network", "secret"] }' }],
        passFixtures: [{ kind: 'mcp-config', content: '{ "scopes": ["filesystem"] }' }],
        precisionBudget: 0,
    },
];
