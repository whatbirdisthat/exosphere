import { describe, it, expect } from 'vitest';
import { renderMarkdown, renderJson } from '../report.js';
import type { AuditReport, ExclusionSummary, Finding } from '../types.js';

const finding: Finding = {
  rule: 'dangerous-bash/curl-pipe-sh',
  detectionClass: 'dangerous-bash',
  severity: 'high',
  file: 'install.sh',
  line: 2,
  excerpt: 'curl x | sh',
  why: 'pipes a remote script straight into a shell',
  tier: 'T0',
  owasp: 'ASI04',
  atlas: 'AML.T0011',
};

const noExclusions: ExclusionSummary = { excludedCount: 0, patterns: [] };
const blockReport: AuditReport = { verdict: 'BLOCK', findings: [finding], exclusions: noExclusions };
const passReport: AuditReport = { verdict: 'PASS', findings: [], exclusions: noExclusions };

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

  // @EARS-041 — markdown surfaces the finding's OWASP + MITRE ATLAS framework ids
  it('surfaces the finding OWASP and MITRE ATLAS ids in markdown', () => {
    const md = renderMarkdown(blockReport, 'install.sh');
    expect(md).toContain('ASI04');
    expect(md).toContain('AML.T0011');
  });

  // @EARS-029 — the transparency invariant is disclosed in markdown
  it('discloses excluded-file count and per-pattern counts in markdown when files were excluded', () => {
    const report: AuditReport = {
      verdict: 'PASS',
      findings: [],
      exclusions: { excludedCount: 3, patterns: [{ pattern: 'tests/corpus/**', count: 3 }] },
    };
    const md = renderMarkdown(report, '.');
    expect(md.toLowerCase()).toContain('excluded');
    expect(md).toContain('3');
    expect(md).toContain('tests/corpus/**');
  });

  // @EARS-030 — no exclusions => no exclusion section noise
  it('omits the exclusion section in markdown when nothing was excluded', () => {
    const md = renderMarkdown(passReport, '.');
    expect(md.toLowerCase()).not.toContain('excluded by .exosphereignore');
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
    // @EARS-041 — the framework ids + tier round-trip in JSON
    expect(parsed.findings[0]).toMatchObject({ tier: 'T0', owasp: 'ASI04', atlas: 'AML.T0011' });
  });

  it('renders JSON with an empty findings array for PASS', () => {
    const parsed = JSON.parse(renderJson(passReport, '.')) as { verdict: string; findings: unknown[] };
    expect(parsed.verdict).toBe('PASS');
    expect(parsed.findings).toEqual([]);
  });

  // @EARS-029 / @EARS-030 — JSON always carries the exclusion summary (machine-readable transparency)
  it('always includes the exclusions summary in JSON', () => {
    const report: AuditReport = {
      verdict: 'PASS',
      findings: [],
      exclusions: { excludedCount: 2, patterns: [{ pattern: '*.env', count: 2 }] },
    };
    const parsed = JSON.parse(renderJson(report, '.')) as { exclusions: ExclusionSummary };
    expect(parsed.exclusions.excludedCount).toBe(2);
    expect(parsed.exclusions.patterns).toEqual([{ pattern: '*.env', count: 2 }]);
  });

  it('includes a zero exclusions summary in JSON when nothing was excluded', () => {
    const parsed = JSON.parse(renderJson(passReport, '.')) as { exclusions: ExclusionSummary };
    expect(parsed.exclusions).toEqual({ excludedCount: 0, patterns: [] });
  });
});
