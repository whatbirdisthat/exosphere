/** Replace confusable unicode letters with their ASCII skeleton; pass everything else through. */
export declare function normaliseHomoglyphs(text: string): string;
/**
 * Decode any base64/hex tokens embedded in a single line and return the concatenated decoded text
 * that looks like readable ASCII. Tokens that decode to non-printable bytes (binary blobs) or are
 * not valid encodings are skipped — only plausibly-textual decodes are surfaced for matching.
 */
export declare function decodeEmbeddedPayloads(line: string): string;
/** True when the text contains an ANSI cursor-movement / line-erase escape ("line jumping"). */
export declare function hasLineJumpAnsi(text: string): boolean;
/** Remove all ANSI escape sequences from text (pure string transform). */
export declare function stripAnsi(text: string): string;
