import { acquire } from './adapters/acquire.js';
import { enumerateWithIgnore } from './adapters/enumerate.js';
import { scan } from './core/engine.js';
import { ruleset } from './core/ruleset.js';
import { aggregate, exitCodeFor } from './core/verdict.js';
import { renderJson, renderMarkdown } from './core/report.js';
import { makeBadge } from './core/badge.js';
import { AuditError } from './core/types.js';
import type { AuditReport } from './core/types.js';

export interface CliResult {
  readonly exitCode: number;
  readonly stdout: string;
}

interface ParsedArgs {
  readonly target: string | undefined;
  readonly format: 'markdown' | 'json';
  readonly noIgnore: boolean;
  readonly badge: boolean;
  readonly ci: boolean;
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  let format: 'markdown' | 'json' = 'markdown';
  let target: string | undefined;
  let noIgnore = false;
  let badge = false;
  let ci = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--format') {
      const value = argv[i + 1];
      format = value === 'json' ? 'json' : 'markdown';
      i++;
    } else if (arg === '--no-ignore') {
      noIgnore = true;
    } else if (arg === '--badge') {
      badge = true;
    } else if (arg === '--ci') {
      ci = true;
    } else if (target === undefined) {
      target = arg;
    }
  }
  return { target, format, noIgnore, badge, ci };
}

/**
 * Append the R2 badge block to a markdown report. On PASS the author earns a trust badge
 * (markdown data-URI snippet + raw SVG); on REVIEW/BLOCK no badge is issued, only a one-line
 * reason. The exclusion disclosure lives upstream in the report itself (transparency carry-over),
 * so a badge can never launder a hidden `.skillsentryignore` exclusion.
 */
function appendBadge(reportStdout: string, report: AuditReport): string {
  const badge = makeBadge(report);
  if (badge.kind === 'no-badge') {
    return `${reportStdout}\n${badge.reason}\n`;
  }
  return [
    reportStdout,
    '## Trust badge',
    '',
    'Markdown (paste into your README):',
    '',
    '```markdown',
    badge.markdown,
    '```',
    '',
    'Raw SVG:',
    '',
    '```svg',
    badge.svg,
    '```',
    '',
  ].join('\n');
}

/**
 * A terse CI status line for `--ci` (an author's GitHub Action). It restates the verdict and
 * whether the run gates the build, preserving the EARS-022 exit-code contract (non-zero only on
 * BLOCK). `--ci` runs the normal pipeline, so it honours `.skillsentryignore` by default and
 * `--no-ignore` still overrides it (EARS-038).
 */
function appendCiStatus(reportStdout: string, report: AuditReport): string {
  const gated = report.verdict === 'BLOCK';
  const line = gated
    ? `CI: BLOCK — gating the build (exit non-zero).`
    : `CI: ${report.verdict} — not gating the build (exit zero).`;
  return `${reportStdout}\n${line}\n`;
}

/** Run the full audit pipeline for a target and return the report + exit code. */
export async function runAudit(argv: readonly string[]): Promise<CliResult> {
  const { target, format, noIgnore, badge, ci } = parseArgs(argv);
  try {
    const acquisition = await acquire(target as string);
    try {
      const { files, exclusions } = await enumerateWithIgnore(acquisition.root, { noIgnore });
      const findings = scan(files, ruleset);
      const verdict = aggregate(findings);
      const report: AuditReport = { verdict, findings, exclusions };
      let stdout =
        format === 'json' ? renderJson(report, target as string) : renderMarkdown(report, target as string);
      if (badge) {
        stdout = appendBadge(stdout, report);
      }
      if (ci) {
        stdout = appendCiStatus(stdout, report);
      }
      return { exitCode: exitCodeFor(verdict), stdout };
    } finally {
      await acquisition.cleanup();
    }
  } catch (err) {
    if (err instanceof AuditError) {
      return { exitCode: 2, stdout: err.message };
    }
    throw err;
  }
}
