import type { FrameworkMapping, RuleSpec } from '../types.js';

// Rule DATA for the `resource-exhaustion` detection class — STRIDE portal D (Denial of service), the
// first ABSENT-cell class surfaced by the threat-modeler gap ritual (doc/threat-model/GAP_ANALYSIS.md).
// Declarative line-patterns only; precision-first — each targets an UNAMBIGUOUS catastrophe so the
// corpus false-positive budget stays 0. From skillsentry's vantage a destructive command shipped in a
// skill is a supply-chain payload (OWASP ASI04) executed by the user/agent (MITRE ATLAS AML.T0011);
// the STRIDE portal D is what distinguishes it from the RCE classes.

const C = 'resource-exhaustion' as const;
const DOS: FrameworkMapping = { owasp: 'ASI04', atlas: 'AML.T0011', stride: ['D'] };

export const resourceExhaustionRules: readonly RuleSpec[] = [
  {
    id: 'resource-exhaustion/recursive-delete-root',
    detectionClass: C,
    severity: 'high',
    why: 'Recursively force-deletes a root-level location (/, a top-level system dir, ~, or $HOME) — catastrophic data loss.',
    tier: 'T0',
    framework: DOS,
    // rm + a recursive AND force intent (combined `-rf`/`-Rf`/`-fr`, split `-r -f`, or long
    // `--recursive --force` in any order, case-insensitive recursive flag) + a CATASTROPHIC target: bare
    // `/`, a top-level system dir, `~`, or `$HOME`/`${HOME}`/`"$HOME"`, optionally globbed, anchored to a
    // word boundary so a subdir (`rm -rf /var/cache/app`, `rm -rf ~/.cache/app`, `rm -rf ./build`) and a
    // non-recursive `rm -f` do NOT match — precision-first (corpus budget 0).
    matcher: {
      kind: 'line-pattern',
      pattern:
        '\\brm\\s+[^\\n]*(?:-[a-zA-Z]*[rR][a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*[rR]|-[rR]\\b[^\\n]*\\s-f\\b|-f\\b[^\\n]*\\s-[rR]\\b|--recursive\\b[^\\n]*--force|--force\\b[^\\n]*--recursive)[^\\n]*\\s["\']?(?:/(?:etc|usr|var|boot|lib|lib64|bin|sbin|opt|root|home|sys|proc|dev|srv)?|~|\\$\\{?HOME\\}?)(?:/?\\*)?["\']?(?:\\s|$)',
    },
    failFixtures: [
      { kind: 'script', content: 'rm -rf /' },
      { kind: 'script', content: 'rm -rf ~' },
      { kind: 'script', content: 'rm -rf /*' },
      { kind: 'script', content: 'rm -fr $HOME' },
      // evasions found in adversarial review (U6) — each must now be caught:
      { kind: 'script', content: 'rm -rf /etc' },
      { kind: 'script', content: 'rm -Rf /usr' },
      { kind: 'script', content: 'rm -r -f /var' },
      { kind: 'script', content: 'rm -rf "$HOME"' },
      { kind: 'script', content: 'rm -rf ${HOME}' },
      { kind: 'script', content: 'rm -rf /home/*' },
      { kind: 'script', content: 'rm --recursive --force /boot' },
    ],
    passFixtures: [
      { kind: 'script', content: 'rm -rf ./build' },
      { kind: 'script', content: 'rm -rf node_modules' },
      { kind: 'script', content: 'rm -f /tmp/lockfile' },
      { kind: 'script', content: 'rm -rf ~/.cache/myapp' },
      // precision boundaries: a SUBDIR of a system path is not the catastrophe and must NOT match.
      { kind: 'script', content: 'rm -rf /var/cache/app' },
      { kind: 'script', content: 'rm -rf /tmp/build' },
    ],
    precisionBudget: 0,
  },
  {
    id: 'resource-exhaustion/fork-bomb',
    detectionClass: C,
    severity: 'high',
    why: 'Defines a self-replicating fork bomb that exhausts process slots until the system is unusable.',
    tier: 'T0',
    framework: DOS,
    // The classic `:(){ :|:& };:` and whitespace variants.
    matcher: {
      kind: 'line-pattern',
      pattern: ':\\s*\\(\\s*\\)\\s*\\{\\s*:\\s*\\|\\s*:\\s*&\\s*\\}\\s*;\\s*:',
    },
    failFixtures: [
      { kind: 'script', content: ':(){ :|:& };:' },
      { kind: 'script', content: ': () { : | : & } ; :' },
    ],
    passFixtures: [
      { kind: 'script', content: 'echo ":(){ documented fork bomb shape, not live }"' },
      { kind: 'script', content: 'run_pipeline() { build | test; }' },
    ],
    precisionBudget: 0,
  },
  {
    id: 'resource-exhaustion/raw-disk-destroy',
    detectionClass: C,
    severity: 'high',
    why: 'Writes raw bytes over, or reformats, a block device (dd of=/dev/sdX, mkfs /dev/…) — wipes a disk.',
    tier: 'T0',
    framework: DOS,
    // dd WRITING to a block device, or mkfs ON a block device. Reading a device (if=/dev/urandom) or
    // imaging to a file does NOT match.
    matcher: {
      kind: 'line-pattern',
      pattern:
        '(?:\\bdd\\b[^\\n]*\\bof=|\\bmkfs(?:\\.\\w+)?\\s+[^\\n]*)/dev/(?:sd[a-z]|nvme\\d|disk\\d|hd[a-z]|mmcblk\\d)',
    },
    failFixtures: [
      { kind: 'script', content: 'dd if=/dev/zero of=/dev/sda bs=1M' },
      { kind: 'script', content: 'mkfs.ext4 /dev/nvme0n1' },
    ],
    passFixtures: [
      { kind: 'script', content: 'dd if=/dev/urandom of=key.bin bs=32 count=1' },
      { kind: 'script', content: 'mkfs.ext4 /tmp/disk.img' },
    ],
    precisionBudget: 0,
  },
];
