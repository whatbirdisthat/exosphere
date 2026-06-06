import type { FileRecord, FrameworkMapping, Rule, RuleMatch } from '../types.js';

// Tool/skill-description poisoning (R9a / ADR-004): malicious instructions hidden in the tool/skill
// DESCRIPTIONS the model reads when choosing a tool but the user does not normally see — SKILL.md /
// agent frontmatter `description:` and MCP tool `description` fields in config. Pure string space:
// the description text is pattern-matched, never executed.

const C = 'tool-description-poisoning' as const;

// Framework mapping: MCP Tool Poisoning (OWASP MCP Top-10) realised as a prompt injection
// (MITRE ATLAS LLM Prompt Injection).
const POISONING: FrameworkMapping = { owasp: 'MCP-T01', atlas: 'AML.T0051' };

/** Kinds that carry a frontmatter `description:` the model reads. */
const FRONTMATTER_KINDS: ReadonlySet<FileRecord['kind']> = new Set(['skill', 'agent'] as const);

/**
 * A description is "poisoned" when it carries a coercive directive that does not belong in a
 * neutral summary of what the tool does: an override of the user's intent, a tool-coercion /
 * exfiltration directive to an external URL, or an instruction to act "before/instead of" the user.
 */
const COERCIVE_DIRECTIVE =
  /\b(?:ignore|disregard|override|bypass)\b[^\n]*\b(?:user|previous|prior|above)\b|\b(?:always|first|before\s+(?:using|doing|any)|instead)\b[^\n]*\b(?:send|exfiltrate|post|upload|forward|leak)\b|\b(?:send|exfiltrate|post|upload|forward|leak)\b[^\n]*https?:\/\//i;

/** Extract the frontmatter `description:` value and its 1-based line number, if present. */
function frontmatterDescription(content: string): { value: string; line: number } | undefined {
  const lines = content.split('\n');
  if (lines[0]?.trim() !== '---') {
    return undefined;
  }
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] as string;
    if (line.trim() === '---') {
      return undefined; // end of frontmatter, no description
    }
    const m = /^description:\s*(.*)$/i.exec(line);
    if (m) {
      return { value: m[1] as string, line: i + 1 };
    }
  }
  return undefined;
}

const frontmatterDescriptionRule: Rule = {
  id: 'tool-description-poisoning/frontmatter-description',
  detectionClass: C,
  severity: 'high',
  why: 'A skill/agent frontmatter description carries a coercive directive the model reads but the user does not see.',
  tier: 'T0',
  framework: POISONING,
  detect: (file: FileRecord): RuleMatch[] => {
    if (!FRONTMATTER_KINDS.has(file.kind)) {
      return [];
    }
    const desc = frontmatterDescription(file.content);
    if (desc && COERCIVE_DIRECTIVE.test(desc.value)) {
      return [{ line: desc.line, excerpt: desc.value.trim() }];
    }
    return [];
  },
};

const mcpToolDescriptionRule: Rule = {
  id: 'tool-description-poisoning/mcp-tool-description',
  detectionClass: C,
  severity: 'high',
  why: 'An MCP tool description carries a coercive directive the model reads but the user does not see.',
  tier: 'T0',
  framework: POISONING,
  detect: (file: FileRecord): RuleMatch[] => {
    if (file.kind !== 'mcp-config') {
      return [];
    }
    const matches: RuleMatch[] = [];
    let lineNo = 0;
    for (const line of file.content.split('\n')) {
      lineNo++;
      const m = /"description"\s*:\s*"([^"]*)"/i.exec(line);
      if (m && COERCIVE_DIRECTIVE.test(m[1] as string)) {
        matches.push({ line: lineNo, excerpt: line.trim() });
      }
    }
    return matches;
  },
};

export const toolDescriptionPoisoningRules: readonly Rule[] = [
  frontmatterDescriptionRule,
  mcpToolDescriptionRule,
];
