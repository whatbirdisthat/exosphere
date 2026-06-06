import type { FileRecord, Rule, RuleMatch } from '../types.js';
import { lineRule, INSTRUCTION_KINDS } from './match-helpers.js';

const C = 'prompt-injection' as const;

/** Zero-width / bidi-control characters used to hide instructions from human readers. */
const ZERO_WIDTH = /[​‌‍⁠﻿‪-‮]/;

/**
 * A line in an instruction body is a coercive-override only when it tells the agent to
 * disregard prior guidance. Documenting injection defensively ("this tool detects ... such as
 * coercive override attempts") must NOT match — so we require an imperative override verb
 * adjacent to "previous/prior/above instructions".
 */
const OVERRIDE =
  /\b(?:ignore|disregard|forget|override)\b[^\n]*\b(?:all\s+)?(?:previous|prior|above|earlier|preceding)\b[^\n]*\binstructions?\b/i;

/** Coerces the agent into using a tool to reach an external endpoint. */
const TOOL_COERCION =
  /\byou\s+must\s+(?:always\s+)?use\b[^\n]*\b(?:bash|tool|shell)\b[^\n]*\bhttps?:\/\//i;

const zeroWidthRule: Rule = {
  id: 'prompt-injection/zero-width-unicode',
  detectionClass: C,
  severity: 'medium',
  why: 'Contains zero-width or bidi-control unicode that can hide instructions from a human reviewer.',
  detect: (file: FileRecord): RuleMatch[] => {
    if (!INSTRUCTION_KINDS.has(file.kind)) {
      return [];
    }
    const matches: RuleMatch[] = [];
    let lineNo = 0;
    for (const line of file.content.split('\n')) {
      lineNo++;
      if (ZERO_WIDTH.test(line)) {
        matches.push({ line: lineNo, excerpt: line.replace(ZERO_WIDTH, '').trim() || '<zero-width>' });
      }
    }
    return matches;
  },
};

const htmlCommentInstructionRule: Rule = {
  id: 'prompt-injection/html-comment-instruction',
  detectionClass: C,
  severity: 'high',
  why: 'Hides a coercive instruction inside an HTML comment, invisible in rendered markdown.',
  detect: (file: FileRecord): RuleMatch[] => {
    if (!INSTRUCTION_KINDS.has(file.kind)) {
      return [];
    }
    const matches: RuleMatch[] = [];
    const directive = /(?:assistant|agent|system|you must|run\b|execute\b|ignore\b)/i;
    let lineNo = 0;
    for (const line of file.content.split('\n')) {
      lineNo++;
      if (/<!--/.test(line) && directive.test(line)) {
        matches.push({ line: lineNo, excerpt: line.trim() });
      }
    }
    return matches;
  },
};

export const promptInjectionRules: readonly Rule[] = [
  lineRule({
    id: 'prompt-injection/ignore-previous-instructions',
    detectionClass: C,
    severity: 'high',
    why: 'Issues a coercive override of prior instructions — the canonical prompt-injection payload.',
    pattern: OVERRIDE,
    appliesTo: INSTRUCTION_KINDS,
  }),
  lineRule({
    id: 'prompt-injection/tool-coercion-exfiltration',
    detectionClass: C,
    severity: 'high',
    why: 'Coerces the agent into using a tool to reach an external endpoint (exfiltration).',
    pattern: TOOL_COERCION,
    appliesTo: INSTRUCTION_KINDS,
  }),
  zeroWidthRule,
  htmlCommentInstructionRule,
];
