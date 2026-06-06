import { describe, it, expect } from 'vitest';
import { makeBadge } from '../badge.js';
import type { AuditReport, ExclusionSummary, Finding } from '../types.js';

const noExclusions: ExclusionSummary = { excludedCount: 0, patterns: [] };

function report(verdict: AuditReport['verdict'], over?: Partial<AuditReport>): AuditReport {
  return { verdict, findings: [], exclusions: noExclusions, ...over };
}

const highFinding: Finding = {
  rule: 'dangerous-bash/curl-pipe-to-shell',
  detectionClass: 'dangerous-bash',
  severity: 'high',
  file: 'install.sh',
  line: 2,
  excerpt: 'curl x | sh',
  why: 'pipes a remote script into a shell',
  tier: 'T0',
  owasp: 'ASI04',
  atlas: 'AML.T0011',
};

describe('badge.makeBadge — PASS emits a badge (EARS-032)', () => {
  it('returns a badge kind with both raw SVG and a markdown snippet on PASS', () => {
    const result = makeBadge(report('PASS'));
    expect(result.kind).toBe('badge');
    if (result.kind !== 'badge') return; // narrow
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('audited by');
    expect(result.svg).toContain('skillsentry');
    expect(result.markdown).toContain('![audited by skillsentry]');
  });

  it('markdown image source is an inline data:image/svg+xml data-URI (offline, self-contained)', () => {
    const result = makeBadge(report('PASS'));
    if (result.kind !== 'badge') throw new Error('expected badge');
    expect(result.markdown).toContain('data:image/svg+xml;base64,');
    // the data-URI must decode back to the exact raw SVG (the snippet is self-contained)
    const m = result.markdown.match(/base64,([A-Za-z0-9+/=]+)\)/);
    expect(m).not.toBeNull();
    const decoded = Buffer.from(m![1] as string, 'base64').toString('utf8');
    expect(decoded).toBe(result.svg);
  });
});

describe('badge.makeBadge — REVIEW/BLOCK emit no badge (EARS-033)', () => {
  it('returns a no-badge kind with a one-line reason naming BLOCK', () => {
    const result = makeBadge(report('BLOCK', { findings: [highFinding] }));
    expect(result.kind).toBe('no-badge');
    if (result.kind !== 'no-badge') return;
    expect(result.reason).toContain('BLOCK');
    expect(result.reason.split('\n')).toHaveLength(1);
  });

  it('returns a no-badge kind with a one-line reason naming REVIEW', () => {
    const result = makeBadge(report('REVIEW'));
    expect(result.kind).toBe('no-badge');
    if (result.kind !== 'no-badge') return;
    expect(result.reason).toContain('REVIEW');
  });
});

describe('badge.makeBadge — determinism / byte-stability (EARS-035)', () => {
  it('produces byte-identical svg + markdown across repeated calls', () => {
    const a = makeBadge(report('PASS'));
    const b = makeBadge(report('PASS'));
    if (a.kind !== 'badge' || b.kind !== 'badge') throw new Error('expected badges');
    expect(a.svg).toBe(b.svg);
    expect(a.markdown).toBe(b.markdown);
  });

  it('two different PASS reports earn the byte-identical badge (verdict is the only input)', () => {
    const a = makeBadge(report('PASS', { exclusions: { excludedCount: 5, patterns: [{ pattern: 'x/**', count: 5 }] } }));
    const b = makeBadge(report('PASS'));
    if (a.kind !== 'badge' || b.kind !== 'badge') throw new Error('expected badges');
    expect(a.svg).toBe(b.svg);
    expect(a.markdown).toBe(b.markdown);
  });

  it('the SVG contains no digits-as-timestamp and no nonce text', () => {
    const result = makeBadge(report('PASS'));
    if (result.kind !== 'badge') throw new Error('expected badge');
    // a 4-digit year / 10-digit epoch would betray a timestamp; the static badge has neither
    expect(result.svg).not.toMatch(/\b20\d{2}-\d{2}-\d{2}\b/); // ISO date
    expect(result.svg).not.toMatch(/\b\d{10,}\b/); // epoch-ish
    expect(result.svg.toLowerCase()).not.toContain('nonce');
  });
});
