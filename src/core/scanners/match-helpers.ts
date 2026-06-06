import type { FileRecord, FrameworkMapping, Rule, RuleMatch, RuleTier } from '../types.js';

/** Build a per-line regex rule. `appliesTo` restricts the rule to certain component kinds. */
export function lineRule(opts: {
  id: string;
  detectionClass: Rule['detectionClass'];
  severity: Rule['severity'];
  why: string;
  tier: RuleTier;
  framework: FrameworkMapping;
  pattern: RegExp;
  appliesTo?: ReadonlySet<FileRecord['kind']>;
}): Rule {
  const { id, detectionClass, severity, why, tier, framework, pattern, appliesTo } = opts;
  return {
    id,
    detectionClass,
    severity,
    why,
    tier,
    framework,
    detect: (file: FileRecord): RuleMatch[] => {
      if (appliesTo && !appliesTo.has(file.kind)) {
        return [];
      }
      const matches: RuleMatch[] = [];
      const lines = file.content.split('\n');
      const linePattern = new RegExp(pattern.source, pattern.flags.replace('g', ''));
      let lineNo = 0;
      for (const line of lines) {
        lineNo++;
        if (linePattern.test(line)) {
          matches.push({ line: lineNo, excerpt: line.trim() });
        }
      }
      return matches;
    },
  };
}

/** Instruction bodies that prompt-injection rules apply to. */
export const INSTRUCTION_KINDS: ReadonlySet<FileRecord['kind']> = new Set([
  'skill',
  'agent',
] as const);
