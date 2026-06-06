import type { FileRecord, Finding, Rule } from './types.js';

/** Apply a ruleset to in-memory files, producing findings. Pure — no IO. */
export function scan(files: readonly FileRecord[], rules: readonly Rule[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    for (const rule of rules) {
      const toFinding = (match: { line: number; excerpt: string }): Finding => ({
        rule: rule.id,
        detectionClass: rule.detectionClass,
        severity: rule.severity,
        file: file.path,
        line: match.line,
        excerpt: match.excerpt,
        why: rule.why,
        tier: rule.tier,
        owasp: rule.framework.owasp,
        atlas: rule.framework.atlas,
      });
      // A rule has EITHER the per-file channel (the default) OR, for a cross-file rule (ADR-007 /
      // R9b.1), the cross-file channel that sees the whole in-memory file set. The cross-file channel
      // subsumes the per-file one (it runs the same analyzer over the full set), so when present it is
      // used INSTEAD OF `detect` — avoiding a duplicate finding for single-file-decidable cases (an
      // escaping include). `detect` still exists on a cross-file rule purely so the precision-budget
      // guard, which calls `rule.detect` on lone fixtures, can validate it. Existing rules (no
      // `detectCrossFile`) are unaffected — the per-file channel runs exactly as before.
      const matches = rule.detectCrossFile ? rule.detectCrossFile(file, files) : rule.detect(file);
      for (const match of matches) {
        findings.push(toFinding(match));
      }
    }
  }
  return findings;
}
