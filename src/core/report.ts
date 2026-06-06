import type { AuditReport } from './types.js';

/** Render the audit report as human-readable markdown. */
export function renderMarkdown(report: AuditReport, target: string): string {
  const lines: string[] = [];
  lines.push(`# exosphere-audit report`);
  lines.push('');
  lines.push(`- **Target:** ${target}`);
  lines.push(`- **Verdict:** ${report.verdict}`);
  lines.push('');
  if (report.findings.length === 0) {
    lines.push('No findings.');
    return lines.join('\n') + '\n';
  }
  lines.push(`## Findings (${report.findings.length})`);
  lines.push('');
  for (const f of report.findings) {
    lines.push(`- **[${f.severity.toUpperCase()}] ${f.rule}** — ${f.file}:${f.line}`);
    lines.push(`  - why: ${f.why}`);
    lines.push(`  - excerpt: \`${f.excerpt}\``);
  }
  return lines.join('\n') + '\n';
}

/** Render the audit report as a machine-readable JSON string. */
export function renderJson(report: AuditReport, target: string): string {
  return JSON.stringify(
    {
      verdict: report.verdict,
      target,
      findings: report.findings,
    },
    null,
    2,
  );
}
