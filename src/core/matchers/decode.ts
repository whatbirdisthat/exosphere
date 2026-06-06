// Pure, IO-free decoding/normalisation helpers for the encoding-evasion rules (R9a / ADR-004).
//
// SAFETY INVARIANT (load-bearing, SMU §6 / ADR-001): every function here operates in pure STRING
// space. Decoded bytes are turned into a string and pattern-matched — nothing decoded is ever
// passed to a shell, `eval`, `Function`, or any execution sink. The auditor never executes what it
// audits, even when it decodes obfuscated content to see through it.

/**
 * Confusable → ASCII skeleton map. A small, precision-first table of the Cyrillic/Greek look-alike
 * letters most used to disguise an English coercive directive ("ignore previous instructions").
 * Ordinary accented Latin (é, à, ç, ï) is intentionally NOT mapped — it normalises to itself, so
 * benign accented prose is never mistaken for a homoglyph attack.
 */
const CONFUSABLES: Readonly<Record<string, string>> = {
  // Cyrillic look-alikes
  а: 'a',
  е: 'e',
  о: 'o',
  р: 'p',
  с: 'c',
  у: 'y',
  х: 'x',
  і: 'i',
  ѕ: 's',
  // Greek look-alikes
  ο: 'o',
  ν: 'v',
  α: 'a',
  ρ: 'p',
  τ: 't',
};

/** Replace confusable unicode letters with their ASCII skeleton; pass everything else through. */
export function normaliseHomoglyphs(text: string): string {
  let out = '';
  for (const ch of text) {
    out += CONFUSABLES[ch] ?? ch;
  }
  return out;
}

/** A run of base64 characters long enough to plausibly carry an instruction. */
const BASE64_TOKEN = /[A-Za-z0-9+/]{16,}={0,2}/g;
/** A run of hex characters long enough to plausibly carry an instruction (even length enforced). */
const HEX_TOKEN = /\b[0-9a-fA-F]{16,}\b/g;
/** Printable ASCII (plus common whitespace) — used to reject decodes that are just binary noise. */
const PRINTABLE = /^[\t\n\r\x20-\x7e]+$/;

/**
 * Decode any base64/hex tokens embedded in a single line and return the concatenated decoded text
 * that looks like readable ASCII. Tokens that decode to non-printable bytes (binary blobs) or are
 * not valid encodings are skipped — only plausibly-textual decodes are surfaced for matching.
 */
export function decodeEmbeddedPayloads(line: string): string {
  const pieces: string[] = [];
  for (const m of line.match(BASE64_TOKEN) ?? []) {
    const decoded = tryDecodeBase64(m);
    if (decoded !== undefined) {
      pieces.push(decoded);
    }
  }
  for (const m of line.match(HEX_TOKEN) ?? []) {
    if (m.length % 2 === 0) {
      const decoded = tryDecodeHex(m);
      if (decoded !== undefined) {
        pieces.push(decoded);
      }
    }
  }
  return pieces.join(' ');
}

function tryDecodeBase64(token: string): string | undefined {
  const buf = Buffer.from(token, 'base64');
  // Reject tokens that do not round-trip: Buffer is lenient, so a run of valid base64 chars whose
  // length is not a clean base64 multiple re-encodes to a different string — that is not a real
  // payload (the caller's regex matches such runs, so this guard is reachable and load-bearing).
  if (buf.toString('base64').replace(/=+$/, '') !== token.replace(/=+$/, '')) {
    return undefined;
  }
  const text = buf.toString('utf8');
  return PRINTABLE.test(text) ? text : undefined;
}

function tryDecodeHex(token: string): string | undefined {
  // Callers guarantee an even-length run of [0-9a-fA-F]{16,}, so the decode is always valid hex
  // and round-trips by construction — only the printable-text filter can reject it.
  const text = Buffer.from(token, 'hex').toString('utf8');
  return PRINTABLE.test(text) ? text : undefined;
}

/**
 * ANSI escape sequences. We split "line jumping" control codes (cursor movement + line erase, which
 * visually overwrite/hide adjacent text) from benign colour/SGR codes — only the former is an
 * evasion signal.
 */
const ANSI_ANY = /\x1b\[[0-9;]*[A-Za-z]/g;
const ANSI_LINE_JUMP = /\x1b\[[0-9;]*[ABCDEFGJK]/;

/** True when the text contains an ANSI cursor-movement / line-erase escape ("line jumping"). */
export function hasLineJumpAnsi(text: string): boolean {
  return ANSI_LINE_JUMP.test(text);
}

/** Remove all ANSI escape sequences from text (pure string transform). */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_ANY, '');
}
