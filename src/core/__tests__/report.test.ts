import { describe, it, expect } from 'vitest';
import { renderMarkdown, renderJson } from '../report.js';
import type { AuditReport, Finding } from '../types.js';

const finding: Finding = {
  rule: 'dangerous-bash/curl-pipe-sh',
  detectionClass: 'dangerous-bash',
  severity: 'high',
  file: 'install.sh',
  line: 2,
  excerpt: 'curl x | sh',
  why: 'pipes a remote script straight into a shell',
};

const blockReport: AuditReport = { verdict: 'BLOCK', findings: [finding] };
const passReport: AuditReport = { verdict: 'PASS', findings: [] };

describe('report.renderMarkdown', () => {
  // @EARS-021 — markdown cites file, line, rule, why
  it('renders a markdown report that cites file:line, rule, and why', () => {
    const md = renderMarkdown(blockReport, 'install.sh');
    expect(md).toContain('BLOCK');
    expect(md).toContain('install.sh:2');
    expect(md).toContain('dangerous-bash/curl-pipe-sh');
    expect(md).toContain('pipes a remote script straight into a shell');
  });

  it('renders a PASS markdown report with no findings', () => {
    const md = renderMarkdown(passReport, '.');
    expect(md).toContain('PASS');
    expect(md.toLowerCase()).toContain('no findings');
  });
});

describe('report.renderJson', () => {
  // @EARS-021 / @EARS-016 — JSON round-trips to a typed structure
  it('renders JSON that parses to verdict + findings array with all fields', () => {
    const parsed = JSON.parse(renderJson(blockReport, 'install.sh')) as {
      verdict: string;
      target: string;
      findings: Finding[];
    };
    expect(parsed.verdict).toBe('BLOCK');
    expect(parsed.target).toBe('install.sh');
    expect(parsed.findings).toHaveLength(1);
    expect(parsed.findings[0]).toEqual(finding);
  });

  it('renders JSON with an empty findings array for PASS', () => {
    const parsed = JSON.parse(renderJson(passReport, '.')) as { verdict: string; findings: unknown[] };
    expect(parsed.verdict).toBe('PASS');
    expect(parsed.findings).toEqual([]);
  });
});
