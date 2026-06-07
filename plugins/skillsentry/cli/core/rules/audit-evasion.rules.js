// Rule DATA for the `audit-evasion` detection class — STRIDE portal R (Repudiation), the second
// ABSENT-cell class surfaced by the threat-modeler gap ritual (doc/threat-model/GAP_ANALYSIS.md).
// Declarative line-patterns; precision-first. A skill that erases shell history or tampers with system
// logs is destroying the audit trail (MAESTRO L5 observability integrity). From skillsentry's vantage
// it is a supply-chain payload (OWASP ASI04 / MITRE ATLAS AML.T0011); STRIDE portal R distinguishes it.
const C = 'audit-evasion';
const REPUDIATION = { owasp: 'ASI04', atlas: 'AML.T0011', stride: ['R'] };
export const auditEvasionRules = [
    {
        id: 'audit-evasion/history-clearing',
        detectionClass: C,
        severity: 'high',
        why: 'Clears or disables shell history to erase the record of what the skill ran.',
        tier: 'T0',
        framework: REPUDIATION,
        // history -c, unset/redirect HISTFILE, disable HISTSIZE, or delete/truncate a *_history file.
        matcher: {
            kind: 'line-pattern',
            pattern: '(?:\\bhistory\\s+-c\\b|\\bunset\\s+HISTFILE\\b|\\bexport\\s+HISTFILE=/dev/null\\b|\\bHISTSIZE=0\\b|\\brm\\b[^\\n]*\\.(?:bash|zsh|sh)_history\\b|>\\s*~?/?\\.(?:bash|zsh)_history\\b)',
        },
        failFixtures: [
            { kind: 'script', content: 'history -c' },
            { kind: 'script', content: 'unset HISTFILE' },
            { kind: 'script', content: 'rm -f ~/.bash_history' },
            { kind: 'script', content: 'export HISTFILE=/dev/null' },
        ],
        passFixtures: [
            { kind: 'script', content: 'cat ~/.bash_history' },
            { kind: 'script', content: 'echo "history of changes is in CHANGELOG.md"' },
            { kind: 'script', content: 'export HISTSIZE=10000' },
        ],
        precisionBudget: 0,
    },
    {
        id: 'audit-evasion/log-tampering',
        detectionClass: C,
        severity: 'high',
        why: 'Truncates, deletes, or rotates away system logs (/var/log, journalctl) to hide activity.',
        tier: 'T0',
        framework: REPUDIATION,
        // Truncating/deleting /var/log/*, rotating/vacuuming the journal, or disabling shell command logging.
        matcher: {
            kind: 'line-pattern',
            pattern: '(?:>\\s*/var/log/|\\btruncate\\b[^\\n]*\\s/var/log/|\\brm\\b[^\\n]*\\s/var/log/|\\bjournalctl\\b[^\\n]*--(?:rotate|vacuum-time|vacuum-size)|\\bset\\s+\\+o\\s+history\\b)',
        },
        failFixtures: [
            { kind: 'script', content: '> /var/log/auth.log' },
            { kind: 'script', content: 'rm -f /var/log/syslog' },
            { kind: 'script', content: 'journalctl --rotate' },
            { kind: 'script', content: 'set +o history' },
        ],
        passFixtures: [
            { kind: 'script', content: 'tail -f /var/log/app.log' },
            { kind: 'script', content: 'echo "done" >> ./build.log' },
            { kind: 'script', content: 'grep error /var/log/syslog' },
        ],
        precisionBudget: 0,
    },
];
