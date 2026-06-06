import type { AuditReport } from './types.js';

/** Render the audit report as human-readable markdown. */
export function renderMarkdown(report: AuditReport, target: string): string {
  const lines: string[] = [];
  lines.push(`# skillsentry report`);
  lines.push('');
  lines.push(`- **Target:** ${target}`);
  lines.push(`- **Verdict:** ${report.verdict}`);
  lines.push('');
  appendExclusions(lines, report);
  appendDrift(lines, report);
  if (report.findings.length === 0) {
    lines.push('No findings.');
    return lines.join('\n') + '\n';
  }
  lines.push(`## Findings (${report.findings.length})`);
  lines.push('');
  for (const f of report.findings) {
    lines.push(`- **[${f.severity.toUpperCase()}] ${f.rule}** — ${f.file}:${f.line}`);
    lines.push(`  - why: ${f.why}`);
    lines.push(`  - framework: OWASP ${f.owasp} · MITRE ATLAS ${f.atlas} · tier ${f.tier}`);
    lines.push(`  - excerpt: \`${f.excerpt}\``);
  }
  return lines.join('\n') + '\n';
}

/**
 * Disclose `.skillsentryignore` exclusions (R3 transparency invariant). When any file was excluded,
 * the human report MUST show how many and by which patterns — an exclusion can never be silent.
 */
function appendExclusions(lines: string[], report: AuditReport): void {
  const { excludedCount, patterns } = report.exclusions;
  if (excludedCount === 0) {
    return;
  }
  lines.push(`## Excluded by .skillsentryignore (${excludedCount})`);
  lines.push('');
  lines.push(`> ${excludedCount} file(s) were excluded from the scan surface and NOT audited.`);
  for (const p of patterns) {
    lines.push(`- \`${p.pattern}\` — excluded ${p.count} file(s)`);
  }
  lines.push('');
}

/**
 * Disclose the R9d lockfile drift surface (EARS-087, transparency carry-over). When a `.skillsentry.lock`
 * baseline was present, the human report MUST show: how many files changed since approval (the benign
 * "drift" note), and — load-bearing — how many HIGH-severity findings the lockfile recorded as approved
 * (a lock cannot silently launder a HIGH). A lockfile can never silently suppress.
 */
function appendDrift(lines: string[], report: AuditReport): void {
  const drift = report.drift;
  if (drift === undefined) {
    return;
  }
  lines.push(`## Lockfile drift (.skillsentry.lock)`);
  lines.push('');
  lines.push(`> ${drift.changedSinceApproval} file(s) changed since approval.`);
  if (drift.approvedHighCount > 0) {
    lines.push(
      `> NOTE: the lockfile approved ${drift.approvedHighCount} high-severity finding(s) — a lockfile cannot lower a fresh verdict (additive-only).`,
    );
  }
  if (drift.findings.length > 0) {
    lines.push(`> ${drift.findings.length} capability drift finding(s) since approval (see below).`);
  }
  lines.push('');
}

/** Render the audit report as a machine-readable JSON string. */
export function renderJson(report: AuditReport, target: string): string {
  return JSON.stringify(
    {
      verdict: report.verdict,
      target,
      findings: report.findings,
      exclusions: report.exclusions,
      ...(report.drift ? { drift: report.drift } : {}),
    },
    null,
    2,
  );
}
