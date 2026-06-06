import { acquire } from './adapters/acquire.js';
import { enumerate } from './adapters/enumerate.js';
import { scan } from './core/engine.js';
import { ruleset } from './core/ruleset.js';
import { aggregate, exitCodeFor } from './core/verdict.js';
import { renderJson, renderMarkdown } from './core/report.js';
import { AuditError } from './core/types.js';
import type { AuditReport } from './core/types.js';

export interface CliResult {
  readonly exitCode: number;
  readonly stdout: string;
}

interface ParsedArgs {
  readonly target: string | undefined;
  readonly format: 'markdown' | 'json';
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  let format: 'markdown' | 'json' = 'markdown';
  let target: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--format') {
      const value = argv[i + 1];
      format = value === 'json' ? 'json' : 'markdown';
      i++;
    } else if (target === undefined) {
      target = arg;
    }
  }
  return { target, format };
}

/** Run the full audit pipeline for a target and return the report + exit code. */
export async function runAudit(argv: readonly string[]): Promise<CliResult> {
  const { target, format } = parseArgs(argv);
  try {
    const acquisition = await acquire(target as string);
    try {
      const files = await enumerate(acquisition.root);
      const findings = scan(files, ruleset);
      const verdict = aggregate(findings);
      const report: AuditReport = { verdict, findings };
      const stdout =
        format === 'json' ? renderJson(report, target as string) : renderMarkdown(report, target as string);
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
