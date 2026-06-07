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
        // history -c / set +o history; unset or null HISTFILE; disable HISTSIZE; delete, truncate, shred, or
        // symlink-to-/dev/null a *_history file. `>` is a truncating redirect, not `>>` append (U10/U33).
        matcher: {
            kind: 'line-pattern',
            pattern: '(?:\\bhistory\\s+-c\\b|\\bset\\s+\\+o\\s+history\\b|\\bunset\\s+HISTFILE\\b|\\bHISTFILE=/dev/null\\b|\\bHISTSIZE=0\\b|\\brm\\b[^\\n]*_history\\b|(?<!>)>\\s*[~/.\\w]*_history\\b|\\bln\\s+-[a-z]*s[a-z]*\\s+/dev/null[^\\n]*_history\\b|\\b(?:shred|truncate)\\b[^\\n]*_history\\b)',
        },
        failFixtures: [
            { kind: 'script', content: 'history -c' },
            { kind: 'script', content: 'unset HISTFILE' },
            { kind: 'script', content: 'rm -f ~/.bash_history' },
            { kind: 'script', content: 'export HISTFILE=/dev/null' },
            // evasions found in adversarial review (U10) + set +o history relocated here (U33):
            { kind: 'script', content: 'HISTFILE=/dev/null' },
            { kind: 'script', content: 'ln -sf /dev/null ~/.bash_history' },
            { kind: 'script', content: 'shred ~/.bash_history' },
            { kind: 'script', content: 'truncate -s0 ~/.zsh_history' },
            { kind: 'script', content: 'set +o history' },
        ],
        passFixtures: [
            { kind: 'script', content: 'cat ~/.bash_history' },
            { kind: 'script', content: 'echo "history of changes is in CHANGELOG.md"' },
            { kind: 'script', content: 'export HISTSIZE=10000' },
            { kind: 'script', content: 'echo "$cmd" >> ~/.bash_history' },
        ],
        precisionBudget: 0,
    },
    {
        id: 'audit-evasion/log-tampering',
        detectionClass: C,
        severity: 'high',
        why: 'Truncates, deletes, locks, or rotates away system logs (/var/log, journalctl, auditctl) to hide activity.',
        tier: 'T0',
        framework: REPUDIATION,
        // Truncating/deleting/locking /var/log (whole dir or a file under it), rotating/vacuuming the
        // journal, or disabling the Linux audit daemon. Trailing slash optional so `rm -rf /var/log` (the
        // whole dir) is caught (U11). Reading a log (tail/grep) does NOT match.
        matcher: {
            kind: 'line-pattern',
            pattern: '(?:(?<!>)>\\s*/var/log\\b|\\b(?:truncate|chattr)\\b[^\\n]*\\s/var/log\\b|\\brm\\b[^\\n]*\\s/var/log\\b|\\bjournalctl\\b[^\\n]*--(?:rotate|vacuum-time|vacuum-size|vacuum-files)|\\bauditctl\\b[^\\n]*\\s-(?:e\\s*0\\b|D\\b))',
        },
        failFixtures: [
            { kind: 'script', content: '> /var/log/auth.log' },
            { kind: 'script', content: 'rm -f /var/log/syslog' },
            { kind: 'script', content: 'journalctl --rotate' },
            // evasions found in adversarial review (U11):
            { kind: 'script', content: 'rm -rf /var/log' },
            { kind: 'script', content: 'chattr +i /var/log/syslog' },
            { kind: 'script', content: 'auditctl -e 0' },
        ],
        passFixtures: [
            { kind: 'script', content: 'tail -f /var/log/app.log' },
            { kind: 'script', content: 'echo "done" >> ./build.log' },
            { kind: 'script', content: 'grep error /var/log/syslog' },
        ],
        precisionBudget: 0,
    },
];
