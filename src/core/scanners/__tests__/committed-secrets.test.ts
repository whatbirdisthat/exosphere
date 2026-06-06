import { describe, it, expect } from 'vitest';
import { committedSecretsRules } from '../committed-secrets.js';
import { scan } from '../../engine.js';
import type { FileRecord } from '../../types.js';

const file = (content: string, path = 'config.txt'): FileRecord => ({
  path,
  content,
  kind: 'other',
});

describe('committed-secrets scanner', () => {
  // @EARS-015 happy/malicious — AWS access key
  it('flags a committed AWS access key with file and line', () => {
    const f = file('region=us-east-1\naws_access_key_id=AKIAIOSFODNN7EXAMPLE\n');
    const findings = scan([f], committedSecretsRules);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      detectionClass: 'committed-secrets',
      severity: 'high',
      line: 2,
    });
  });

  // @EARS-015 abuse — private key block
  it('flags a committed private key block', () => {
    const f = file('-----BEGIN RSA PRIVATE KEY-----\nMIIabc\n-----END RSA PRIVATE KEY-----\n', 'id_rsa');
    const findings = scan([f], committedSecretsRules);
    expect(findings.some((x) => x.detectionClass === 'committed-secrets' && x.line === 1)).toBe(true);
  });

  // @EARS-015 abuse — generic high-entropy token assignment (e.g. GitHub PAT)
  it('flags a committed GitHub personal access token', () => {
    const f = file('GITHUB_TOKEN=ghp_0123456789abcdefghijklmnopqrstuvwxyz12\n');
    const findings = scan([f], committedSecretsRules);
    expect(findings.some((x) => x.detectionClass === 'committed-secrets')).toBe(true);
  });

  // @EARS-015 unhappy/benign — placeholder
  it('does not flag a documented placeholder key', () => {
    const f = file('AWS_ACCESS_KEY_ID=YOUR_KEY_HERE\n', 'README.md');
    const findings = scan([f], committedSecretsRules);
    expect(findings).toEqual([]);
  });

  // benign — no secret
  it('does not flag a file with no secret', () => {
    const f = file('name=exosphere\nversion=1\n');
    const findings = scan([f], committedSecretsRules);
    expect(findings).toEqual([]);
  });
});
