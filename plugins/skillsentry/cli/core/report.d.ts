import type { AuditReport } from './types.js';
/** Render the audit report as human-readable markdown. */
export declare function renderMarkdown(report: AuditReport, target: string): string;
/** Render the audit report as a machine-readable JSON string. */
export declare function renderJson(report: AuditReport, target: string): string;
