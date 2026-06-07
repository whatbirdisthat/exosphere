// Pure badge generator for the author README trust-badge (R2). No IO — derives a deterministic,
// offline badge purely from the audit verdict. Per ADR-003 this lives in `core/*` (depends only on
// `core/types`); the CLI adapter decides WHEN to call it and appends its output to the report.
//
// Determinism (EARS-035): the PASS badge is a FIXED, hand-written static SVG with two fixed strings
// ("audited by" / "skillsentry") and no timestamp, nonce, or environment-dependent content, so
// base64-of-a-fixed-string is itself fixed and the snippet an author pastes is byte-stable.
//
// Zero runtime dependency (ADR-003): the SVG is ~hand-generated, not produced by a badge/SVG package.
// The badge embeds no author-controlled text, so there is no XML-injection surface to delegate.
const ALT_TEXT = 'audited by skillsentry';
// A small, static, shields-style two-segment badge. Fixed geometry, fixed text, green PASS colour.
// Left segment: "audited by"; right segment: "skillsentry" on a green (#3fb950) field.
const PASS_SVG = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="186" height="20" role="img" aria-label="audited by: skillsentry">',
    '<title>audited by: skillsentry</title>',
    '<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>',
    '<clipPath id="r"><rect width="186" height="20" rx="3" fill="#fff"/></clipPath>',
    '<g clip-path="url(#r)">',
    '<rect width="67" height="20" fill="#555"/>',
    '<rect x="67" width="119" height="20" fill="#3fb950"/>',
    '<rect width="186" height="20" fill="url(#s)"/>',
    '</g>',
    '<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="110" text-rendering="geometricPrecision">',
    '<text x="345" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="570">audited by</text>',
    '<text x="345" y="140" transform="scale(.1)" textLength="570">audited by</text>',
    '<text x="1255" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="1090">skillsentry</text>',
    '<text x="1255" y="140" transform="scale(.1)" textLength="1090">skillsentry</text>',
    '</g>',
    '</svg>',
].join('');
/**
 * Build the badge result for an audit report. PASS → a badge (raw SVG + inline data-URI markdown);
 * REVIEW/BLOCK → no badge plus a single clear reason line. Derived only from the verdict.
 */
export function makeBadge(report) {
    if (report.verdict !== 'PASS') {
        return { kind: 'no-badge', reason: noBadgeReason(report.verdict) };
    }
    const svg = PASS_SVG;
    const dataUri = `data:image/svg+xml;base64,${toBase64(svg)}`;
    const markdown = `![${ALT_TEXT}](${dataUri})`;
    return { kind: 'badge', svg, markdown };
}
/** One-line reason explaining why no badge was issued for a non-PASS verdict. */
function noBadgeReason(verdict) {
    return `No badge: the verdict is ${verdict}, not PASS. Resolve the findings (or disclose-and-exclude via .skillsentryignore) to earn a badge.`;
}
/** Deterministic base64 of a UTF-8 string. Uses Buffer in Node; no environment-dependent input. */
function toBase64(text) {
    return Buffer.from(text, 'utf8').toString('base64');
}
