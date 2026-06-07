import { acquire } from './adapters/acquire.js';
import { enumerateWithIgnore } from './adapters/enumerate.js';
import { hashFiles, readLock, writeLock } from './adapters/lockfile.js';
import { scan } from './core/engine.js';
import { ruleset } from './core/ruleset.js';
import { aggregate, exitCodeFor } from './core/verdict.js';
import { renderJson, renderMarkdown } from './core/report.js';
import { makeBadge } from './core/badge.js';
import { diffCapabilities } from './core/drift.js';
import { extractCapabilitySet } from './core/lock.js';
import { LOCKFILE_SCHEMA_VERSION } from './core/ruleset.js';
import { AuditError } from './core/types.js';
function parseArgs(argv) {
    let format = 'markdown';
    let target;
    let noIgnore = false;
    let badge = false;
    let ci = false;
    let approve = false;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--format') {
            const value = argv[i + 1];
            format = value === 'json' ? 'json' : 'markdown';
            i++;
        }
        else if (arg === '--no-ignore') {
            noIgnore = true;
        }
        else if (arg === '--badge') {
            badge = true;
        }
        else if (arg === '--ci') {
            ci = true;
        }
        else if (arg === '--approve') {
            approve = true;
        }
        else if (target === undefined) {
            target = arg;
        }
    }
    return { target, format, noIgnore, badge, ci, approve };
}
/**
 * Append the R2 badge block to a markdown report. On PASS the author earns a trust badge
 * (markdown data-URI snippet + raw SVG); on REVIEW/BLOCK no badge is issued, only a one-line
 * reason. The exclusion disclosure lives upstream in the report itself (transparency carry-over),
 * so a badge can never launder a hidden `.skillsentryignore` exclusion.
 */
function appendBadge(reportStdout, report) {
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
function appendCiStatus(reportStdout, report) {
    const gated = report.verdict === 'BLOCK';
    const line = gated
        ? `CI: BLOCK — gating the build (exit non-zero).`
        : `CI: ${report.verdict} — not gating the build (exit zero).`;
    return `${reportStdout}\n${line}\n`;
}
/** Run the full audit pipeline for a target and return the report + exit code. */
export async function runAudit(argv) {
    const { target, format, noIgnore, badge, ci, approve } = parseArgs(argv);
    try {
        const acquisition = await acquire(target);
        try {
            const { files, exclusions } = await enumerateWithIgnore(acquisition.root, { noIgnore });
            const findings = scan(files, ruleset);
            // The fresh deterministic T0/T1 scan ALWAYS sets the verdict floor. Drift findings can only be
            // ADDED to this list (never subtracted) — the additive-only invariant is structural here.
            const freshVerdict = aggregate(findings);
            if (approve) {
                // EARS-075: persist the approval baseline (capability fingerprint) and report the fresh scan.
                await writeApprovalLock(acquisition.root, files, findings, freshVerdict, exclusions);
            }
            // EARS-079/086: the T3 temporal pass runs only when a baseline is present. Without one it is
            // inert and `drift` stays undefined (a pre-R9d audit is byte-identical).
            const drift = await computeDrift(acquisition.root, files, findings);
            // EARS-084: verdict = max(freshVerdict, driftVerdict). `aggregate` over the UNION of fresh +
            // drift findings is exactly that max — a lockfile can add a finding, never remove one.
            const allFindings = drift ? [...findings, ...drift.findings] : [...findings];
            const verdict = aggregate(allFindings);
            const report = {
                verdict,
                findings: allFindings,
                exclusions,
                ...(drift ? { drift } : {}),
            };
            let stdout = format === 'json' ? renderJson(report, target) : renderMarkdown(report, target);
            if (badge) {
                stdout = appendBadge(stdout, report);
            }
            if (ci) {
                stdout = appendCiStatus(stdout, report);
            }
            return { exitCode: exitCodeFor(verdict), stdout };
        }
        finally {
            await acquisition.cleanup();
        }
    }
    catch (err) {
        if (err instanceof AuditError) {
            return { exitCode: 2, stdout: err.message };
        }
        throw err;
    }
}
/**
 * Write the `.skillsentry.lock` approval baseline (EARS-075). The capability fingerprint is computed by
 * the SAME pure `extractCapabilitySet` the diff uses — the single source of truth that keeps approve and
 * diff from drifting apart (a divergence would false-positive benign drift AND could slip an escalation).
 */
async function writeApprovalLock(root, files, findings, verdict, exclusions) {
    const lock = {
        schemaVersion: LOCKFILE_SCHEMA_VERSION,
        approvedVerdict: verdict,
        fileHashes: hashFiles(files),
        capabilities: extractCapabilitySet(findings),
        exclusions,
    };
    await writeLock(root, lock);
}
/** Run the T3 temporal pass at the adapter edge: read the baseline (if any), diff, return the summary. */
async function computeDrift(root, files, findings) {
    const lock = await readLock(root);
    if (lock === undefined) {
        return undefined;
    }
    return diffCapabilities(findings, hashFiles(files), lock);
}
