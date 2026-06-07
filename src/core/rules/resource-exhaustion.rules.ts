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
    // The classic `:(){ :|:& };:` AND any renamed equivalent — a function that pipes itself into a
    // backgrounded copy of itself, then invokes itself. The captured identifier + backreference (\1)
    // generalises beyond the `:` glyph (U8); `run_pipeline(){ build|test; }` does NOT match (the body
    // does not re-invoke the same name).
    matcher: {
      kind: 'line-pattern',
      pattern: '([A-Za-z_:][\\w]*)\\s*\\(\\s*\\)\\s*\\{\\s*\\1\\s*\\|\\s*\\1\\s*&\\s*\\}\\s*;\\s*\\1',
    },
    failFixtures: [
      { kind: 'script', content: ':(){ :|:& };:' },
      { kind: 'script', content: ': () { : | : & } ; :' },
      { kind: 'script', content: 'b(){ b|b& };b' },
    ],
    passFixtures: [
      { kind: 'script', content: 'echo ":(){ documented fork bomb shape, not live }"' },
      { kind: 'script', content: 'run_pipeline() { build | test; }' },
    ],
    precisionBudget: 0,
  },
  {
    id: 'resource-exhaustion/fork-loop',
    detectionClass: C,
    severity: 'high',
    why: 'A tight unbounded fork loop (perl `fork while fork`, Python `while True: os.fork()`) exhausts process slots.',
    tier: 'T0',
    framework: DOS,
    matcher: {
      kind: 'line-pattern',
      pattern: '\\bfork\\s+while\\s+fork\\b|\\bwhile\\s+(?:True|1)\\s*:[^\\n]*\\bos\\.fork\\s*\\(\\s*\\)',
    },
    failFixtures: [
      { kind: 'script', content: "perl -e 'fork while fork'" },
      { kind: 'script', content: 'while True: os.fork()' },
    ],
    passFixtures: [
      { kind: 'script', content: 'pid = os.fork()  # spawn one worker' },
      { kind: 'script', content: '# fork the repository before cloning' },
    ],
    precisionBudget: 0,
  },
  {
    id: 'resource-exhaustion/raw-disk-destroy',
    detectionClass: C,
    severity: 'high',
    why: 'Writes over, reformats, or wipes a block device (dd of=/dev/…, mkfs, shred, wipefs, blkdiscard, or a `>` redirect) — destroys a disk.',
    tier: 'T0',
    framework: DOS,
    // A destructive WRITE to a block device: dd of=, a `>` redirect, mkfs, shred, wipefs, or blkdiscard
    // targeting /dev/{sd,vd,xvd,nvme,mmcblk,hd,disk}[partition]. Reading a device (if=/dev/urandom),
    // imaging to a FILE (of=key.bin), or `> /dev/null` does NOT match (U9).
    matcher: {
      kind: 'line-pattern',
      pattern:
        '(?:\\bdd\\b[^\\n]*\\bof\\s*=\\s*|\\b(?:shred|wipefs|blkdiscard)\\b[^\\n]*\\s|\\bmkfs(?:\\.\\w+)?\\s+[^\\n]*|>\\s*)/dev/(?:sd[a-z]|vd[a-z]|xvd[a-z]|nvme\\d+n\\d+|mmcblk\\d+|hd[a-z]|disk\\d+)(?:p?\\d+)?\\b',
    },
    failFixtures: [
      { kind: 'script', content: 'dd if=/dev/zero of=/dev/sda bs=1M' },
      { kind: 'script', content: 'mkfs.ext4 /dev/nvme0n1' },
      // evasions found in adversarial review (U9):
      { kind: 'script', content: 'dd if=/dev/zero of=/dev/sda1' },
      { kind: 'script', content: 'shred /dev/sdb' },
      { kind: 'script', content: 'wipefs -a /dev/sda' },
      { kind: 'script', content: 'cat /dev/zero > /dev/vda' },
      { kind: 'script', content: 'dd of = /dev/xvda bs=1M' },
    ],
    passFixtures: [
      { kind: 'script', content: 'dd if=/dev/urandom of=key.bin bs=32 count=1' },
      { kind: 'script', content: 'mkfs.ext4 /tmp/disk.img' },
      { kind: 'script', content: 'echo hi > /dev/null' },
      { kind: 'script', content: 'dd if=/dev/sda of=backup.img' },
    ],
    precisionBudget: 0,
  },
];
