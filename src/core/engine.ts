import type { FileRecord, Finding, Rule } from './types.js';

/** Apply a ruleset to in-memory files, producing findings. Pure — no IO. */
export function scan(files: readonly FileRecord[], rules: readonly Rule[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    for (const rule of rules) {
      for (const match of rule.detect(file)) {
        findings.push({
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
      }
    }
  }
  return findings;
}
