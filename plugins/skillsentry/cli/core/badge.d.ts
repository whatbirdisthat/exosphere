import type { AuditReport, BadgeResult } from './types.js';
/**
 * Build the badge result for an audit report. PASS → a badge (raw SVG + inline data-URI markdown);
 * REVIEW/BLOCK → no badge plus a single clear reason line. Derived only from the verdict.
 */
export declare function makeBadge(report: AuditReport): BadgeResult;
