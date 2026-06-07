// The CLOSED registry of named built-in structural matchers (ADR-005 / R4, EARS-050).
//
// These are the rules that genuinely need structural logic — JSON scope parsing, frontmatter
// `description:` extraction, decode-then-match, ANSI line-jump, HTML-comment, zero-width unicode —
// that cannot be expressed as a single line-pattern regex. They are referenced from rule DATA by
// NAME only (`{ kind: 'builtin', name }`); a contributor cannot define a new builtin in data, only
// select from this vetted, code-reviewed vocabulary. Each is a pure function over a `FileRecord`.
//
// SAFETY INVARIANT (SMU §6 / ADR-001 / ADR-005): every matcher here operates in pure string space and
// NEVER reaches an execution sink. The decode helpers (homoglyph/base64/hex/ANSI) transform text into
// other text that is then pattern-matched — nothing decoded is executed.
//
// Behaviour preservation (R4): the bodies below are the R9a scanner logic relocated verbatim — only
// their home and selection mechanism changed (compiled-in module export → named builtin).
import { normaliseHomoglyphs, decodeEmbeddedPayloads, hasLineJumpAnsi } from './decode.js';
import { shellTaintToSink } from './shell-dataflow.js';
import { shellCrossfileTaintToSink } from './shell-crossfile-dataflow.js';
/** Instruction bodies that prompt-injection / description matchers apply to. */
const INSTRUCTION_KINDS = new Set(['skill', 'agent']);
/** Zero-width / bidi-control characters used to hide instructions from human readers. */
const ZERO_WIDTH = /[​‌‍⁠﻿‪-‮]/;
/** A coercive override of prior instructions — the canonical prompt-injection payload. */
const OVERRIDE = /\b(?:ignore|disregard|forget|override)\b[^\n]*\b(?:all\s+)?(?:previous|prior|above|earlier|preceding)\b[^\n]*\binstructions?\b/i;
/**
 * A description is "poisoned" when it carries a coercive directive that does not belong in a neutral
 * summary of what the tool does: an override of the user's intent, a tool-coercion / exfiltration
 * directive to an external URL, or an instruction to act "before/instead of" the user.
 */
const COERCIVE_DIRECTIVE = /\b(?:ignore|disregard|override|bypass)\b[^\n]*\b(?:user|previous|prior|above)\b|\b(?:always|first|before\s+(?:using|doing|any)|instead)\b[^\n]*\b(?:send|exfiltrate|post|upload|forward|leak)\b|\b(?:send|exfiltrate|post|upload|forward|leak)\b[^\n]*https?:\/\//i;
// ── zero-width unicode ───────────────────────────────────────────────────────────────────────────
const zeroWidthUnicode = (file) => {
    if (!INSTRUCTION_KINDS.has(file.kind)) {
        return [];
    }
    const matches = [];
    let lineNo = 0;
    for (const line of file.content.split('\n')) {
        lineNo++;
        if (ZERO_WIDTH.test(line)) {
            matches.push({ line: lineNo, excerpt: line.replace(ZERO_WIDTH, '').trim() || '<zero-width>' });
        }
    }
    return matches;
};
// ── HTML-comment instruction ─────────────────────────────────────────────────────────────────────
const htmlCommentInstruction = (file) => {
    if (!INSTRUCTION_KINDS.has(file.kind)) {
        return [];
    }
    const matches = [];
    const directive = /(?:assistant|agent|system|you must|run\b|execute\b|ignore\b)/i;
    let lineNo = 0;
    for (const line of file.content.split('\n')) {
        lineNo++;
        if (/<!--/.test(line) && directive.test(line)) {
            matches.push({ line: lineNo, excerpt: line.trim() });
        }
    }
    return matches;
};
/**
 * Build a per-line instruction-body matcher whose match runs on a TRANSFORMED view of each line
 * (homoglyph-normalised, or decode-of-embedded-payloads). The excerpt cites the ORIGINAL line so the
 * finding still points the reviewer at the real source text. Pure string space — the transform never
 * executes the content (decode.ts safety invariant). Fires only on the EVASION view (transform changed
 * the line), so a plain override line is owned by its own line-pattern rule (one finding per line).
 */
function transformedLineMatcher(transform, pattern) {
    return (file) => {
        if (!INSTRUCTION_KINDS.has(file.kind)) {
            return [];
        }
        const matches = [];
        let lineNo = 0;
        for (const line of file.content.split('\n')) {
            lineNo++;
            const transformed = transform(line);
            if (transformed !== line && transformed.length > 0 && pattern.test(transformed)) {
                matches.push({ line: lineNo, excerpt: line.trim() });
            }
        }
        return matches;
    };
}
const homoglyphOverride = transformedLineMatcher(normaliseHomoglyphs, OVERRIDE);
const encodedOverridePayload = transformedLineMatcher(decodeEmbeddedPayloads, OVERRIDE);
// ── ANSI line jumping ────────────────────────────────────────────────────────────────────────────
const ansiLineJumping = (file) => {
    if (!INSTRUCTION_KINDS.has(file.kind)) {
        return [];
    }
    const matches = [];
    let lineNo = 0;
    for (const line of file.content.split('\n')) {
        lineNo++;
        if (hasLineJumpAnsi(line)) {
            // eslint-disable-next-line no-control-regex
            matches.push({ line: lineNo, excerpt: line.replace(/\x1b/g, '\\x1b').trim() });
        }
    }
    return matches;
};
// ── MCP combined scopes (over-broad-perms) ────────────────────────────────────────────────────────
const mcpCombinedScopes = (file) => {
    if (file.kind !== 'mcp-config') {
        return [];
    }
    const matches = [];
    let lineNo = 0;
    for (const line of file.content.split('\n')) {
        lineNo++;
        const hasFs = /filesystem/.test(line);
        const hasNet = /network/.test(line);
        const hasSecret = /secret/.test(line);
        if (hasFs && hasNet && hasSecret) {
            matches.push({ line: lineNo, excerpt: line.trim() });
        }
    }
    return matches;
};
// ── tool/skill-description poisoning ───────────────────────────────────────────────────────────────
const FRONTMATTER_KINDS = new Set(['skill', 'agent']);
/** Extract the frontmatter `description:` value and its 1-based line number, if present. */
function frontmatterDescription(content) {
    const lines = content.split('\n');
    if (lines[0]?.trim() !== '---') {
        return undefined;
    }
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '---') {
            return undefined; // end of frontmatter, no description
        }
        const m = /^description:\s*(.*)$/i.exec(line);
        if (m) {
            return { value: m[1], line: i + 1 };
        }
    }
    return undefined;
}
const frontmatterCoerciveDescription = (file) => {
    if (!FRONTMATTER_KINDS.has(file.kind)) {
        return [];
    }
    const desc = frontmatterDescription(file.content);
    if (desc && COERCIVE_DIRECTIVE.test(desc.value)) {
        return [{ line: desc.line, excerpt: desc.value.trim() }];
    }
    return [];
};
const mcpToolCoerciveDescription = (file) => {
    if (file.kind !== 'mcp-config') {
        return [];
    }
    const matches = [];
    let lineNo = 0;
    for (const line of file.content.split('\n')) {
        lineNo++;
        const m = /"description"\s*:\s*"([^"]*)"/i.exec(line);
        if (m && COERCIVE_DIRECTIVE.test(m[1])) {
            matches.push({ line: lineNo, excerpt: line.trim() });
        }
    }
    return matches;
};
/**
 * The closed registry of PER-FILE builtins: a rule's `{ kind: 'builtin', name }` selects one of these
 * by name (when the name is a per-file matcher). An unknown name is rejected at compile time
 * (EARS-053). Adding a builtin is a code change (a new vetted matcher), never a data change — that is
 * the security boundary. The cross-file matcher lives in its OWN map below (different signature).
 */
export const BUILTIN_MATCHERS = {
    'zero-width-unicode': zeroWidthUnicode,
    'html-comment-instruction': htmlCommentInstruction,
    'homoglyph-override': homoglyphOverride,
    'encoded-override-payload': encodedOverridePayload,
    'ansi-line-jumping': ansiLineJumping,
    'mcp-combined-scopes': mcpCombinedScopes,
    'frontmatter-coercive-description': frontmatterCoerciveDescription,
    'mcp-tool-coercive-description': mcpToolCoerciveDescription,
    // R9b (ADR-006): the T1 intra-file shell taint/dataflow analyzer. A pure, multi-line structural
    // matcher; scoped to script/hook kinds inside the analyzer; never reaches an execution sink.
    'shell-taint-to-sink': shellTaintToSink,
};
/**
 * The closed registry of CROSS-FILE builtins (ADR-007 / R9b.1). A rule whose builtin name is one of
 * these resolves to the engine's `detectCrossFile` channel (it needs the whole file set). Same security
 * boundary: a contributor selects by name; the analyzer logic is vetted code, never data.
 */
export const CROSSFILE_BUILTIN_MATCHERS = {
    // R9b.1 (ADR-007): the T1 cross-file shell taint/dataflow analyzer. Resolves a `source`d sibling's
    // taint in pure string space over in-memory records; never reads disk, executes, or fetches.
    'shell-crossfile-taint-to-sink': shellCrossfileTaintToSink,
};
