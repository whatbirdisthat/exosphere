import type { FileRecord, FrameworkMapping, Rule, RuleMatch } from '../types.js';
import { lineRule, INSTRUCTION_KINDS } from './match-helpers.js';
import { normaliseHomoglyphs, decodeEmbeddedPayloads, hasLineJumpAnsi } from './decode.js';

const C = 'prompt-injection' as const;

// Framework mapping (ADR-004): prompt injection is OWASP LLM01 / MITRE ATLAS LLM Prompt Injection.
const INJECTION: FrameworkMapping = { owasp: 'LLM01', atlas: 'AML.T0051' };

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
  tier: 'T0',
  framework: INJECTION,
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
  tier: 'T0',
  framework: INJECTION,
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

/**
 * Build a per-line instruction-body rule whose match runs on a TRANSFORMED view of each line
 * (homoglyph-normalised, or decode-of-embedded-payloads). The excerpt cites the ORIGINAL line so
 * the finding still points the reviewer at the real source text. Pure string space — the transform
 * never executes the content (decode.ts safety invariant).
 */
function transformedLineRule(opts: {
  id: string;
  severity: Rule['severity'];
  why: string;
  transform: (line: string) => string;
  pattern: RegExp;
}): Rule {
  const { id, severity, why, transform, pattern } = opts;
  return {
    id,
    detectionClass: C,
    severity,
    why,
    tier: 'T0',
    framework: INJECTION,
    detect: (file: FileRecord): RuleMatch[] => {
      if (!INSTRUCTION_KINDS.has(file.kind)) {
        return [];
      }
      const matches: RuleMatch[] = [];
      let lineNo = 0;
      for (const line of file.content.split('\n')) {
        lineNo++;
        const transformed = transform(line);
        // Only fire on the EVASION view: the transform must have revealed something the raw line
        // did not already show. A plain override line is owned by the un-transformed rule, so the
        // evasion rules avoid double-flagging it (one finding per line, precision-first).
        // A line that matches an override pattern is never blank, so `line.trim()` is non-empty.
        if (transformed !== line && transformed.length > 0 && pattern.test(transformed)) {
          matches.push({ line: lineNo, excerpt: line.trim() });
        }
      }
      return matches;
    },
  };
}

/** Flags an ANSI cursor-movement / line-erase escape ("line jumping") in an instruction body. */
const ansiLineJumpRule: Rule = {
  id: 'prompt-injection/ansi-line-jumping',
  detectionClass: C,
  severity: 'high',
  why: 'Uses ANSI cursor-movement / line-erase escapes to visually hide instructions from a human reviewer.',
  tier: 'T0',
  framework: INJECTION,
  detect: (file: FileRecord): RuleMatch[] => {
    if (!INSTRUCTION_KINDS.has(file.kind)) {
      return [];
    }
    const matches: RuleMatch[] = [];
    let lineNo = 0;
    for (const line of file.content.split('\n')) {
      lineNo++;
      if (hasLineJumpAnsi(line)) {
        // A line carrying an ANSI escape is never blank once the escape is rendered visible.
        // eslint-disable-next-line no-control-regex
        matches.push({ line: lineNo, excerpt: line.replace(/\x1b/g, '\\x1b').trim() });
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
    tier: 'T0',
    framework: INJECTION,
    pattern: OVERRIDE,
    appliesTo: INSTRUCTION_KINDS,
  }),
  lineRule({
    id: 'prompt-injection/tool-coercion-exfiltration',
    detectionClass: C,
    severity: 'high',
    why: 'Coerces the agent into using a tool to reach an external endpoint (exfiltration).',
    tier: 'T0',
    framework: INJECTION,
    pattern: TOOL_COERCION,
    appliesTo: INSTRUCTION_KINDS,
  }),
  zeroWidthRule,
  htmlCommentInstructionRule,
  // R9a encoding-evasion: a homoglyph-disguised override, normalised to its ASCII skeleton.
  transformedLineRule({
    id: 'prompt-injection/homoglyph-override',
    severity: 'high',
    why: 'Disguises a coercive override directive with confusable (homoglyph) unicode to evade detection.',
    transform: normaliseHomoglyphs,
    pattern: OVERRIDE,
  }),
  // R9a encoding-evasion: a base64/hex-encoded payload that decodes to an override directive.
  transformedLineRule({
    id: 'prompt-injection/encoded-override-payload',
    severity: 'high',
    why: 'Hides a coercive override directive inside a base64/hex-encoded payload (decoded defensively, never executed).',
    transform: decodeEmbeddedPayloads,
    pattern: OVERRIDE,
  }),
  ansiLineJumpRule,
];
